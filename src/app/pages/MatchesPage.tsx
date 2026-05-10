import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { X, Heart, MapPin, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const BATCH = 20;

interface RecomendacaoPet {
  pet: {
    _id: string;
    nome: string;
    tipo_animal: string;
    raca?: string;
    porte: string;
    sexo: string;
    idade_display: string;
    descricao?: string;
    imagem?: string;
    imagem_principal?: string;
    fotos?: string[];
    url?: string;
    localizacao?: string;
    sociavel_criancas?: boolean;
    sociavel_animais?: boolean;
  };
  score: number;
  distancia: number;
  justificativa: string;
}

function getPetImg(pet: RecomendacaoPet["pet"]): string | null {
  return pet.imagem_principal || pet.imagem || pet.fotos?.[0] || null;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-orange-500";
  return (
    <div className={`absolute top-4 right-4 ${color} text-white px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg font-semibold text-sm`}>
      <Heart className="w-3.5 h-3.5 fill-white" />
      {score}% Match
    </div>
  );
}

export function MatchesPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { token, user } = useAuth();

  const state = location.state as { recomendacoes?: RecomendacaoPet[]; tipo?: string } | null;

  const [recs, setRecs]                 = useState<RecomendacaoPet[]>(state?.recomendacoes ?? []);
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [likedIds, setLikedIds]         = useState<Set<string>>(new Set());
  const [liking, setLiking]             = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [allLoaded, setAllLoaded]       = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const fetchedCount = useRef(state?.recomendacoes?.length ?? 0);

  const fetchBatch = useCallback(async (skip: number) => {
    const answers = user?.lastQuestionnaireAnswers;
    if (!token || !answers?.tipo) return [];
    const res = await fetch(`${API_URL}/recomendacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...answers, topN: BATCH, skip }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.recomendacoes ?? []) as RecomendacaoPet[];
  }, [token, user?.lastQuestionnaireAnswers]);

  // Se não vieram recs pela navegação, busca o primeiro lote
  useEffect(() => {
    if (recs.length > 0) return;
    const answers = user?.lastQuestionnaireAnswers;
    if (!answers?.tipo || !token) return;
    setInitialLoading(true);
    fetchBatch(0).then((batch) => {
      if (batch.length === 0) {
        setAllLoaded(true);
      } else {
        setRecs(batch);
        fetchedCount.current = batch.length;
      }
    }).finally(() => setInitialLoading(false));
  }, []);

  // Carrega likes existentes
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/likes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setLikedIds(new Set(d.petIds ?? [])))
      .catch(() => {});
  }, [token]);

  const loadMore = useCallback(async () => {
    if (loadingMore || allLoaded) return;
    setLoadingMore(true);
    const batch = await fetchBatch(fetchedCount.current);
    if (batch.length === 0) {
      setAllLoaded(true);
    } else {
      setRecs((prev) => [...prev, ...batch]);
      fetchedCount.current += batch.length;
    }
    setLoadingMore(false);
  }, [loadingMore, allLoaded, fetchBatch]);

  const advance = useCallback(() => {
    setCurrentIdx((i) => {
      const next = i + 1;
      // Perto do fim — carrega mais
      if (!allLoaded && !loadingMore && next >= recs.length - 3) {
        loadMore();
      }
      return next;
    });
  }, [allLoaded, loadingMore, recs.length, loadMore]);

  const like = async () => {
    const current = recs[currentIdx];
    if (!current || liking) return;
    setLiking(true);
    try {
      const res = await fetch(`${API_URL}/likes/${current.pet._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLikedIds((prev) => {
        const next = new Set(prev);
        data.liked ? next.add(current.pet._id) : next.delete(current.pet._id);
        return next;
      });
    } catch { /* silencioso */ }
    finally {
      setLiking(false);
      advance();
    }
  };

  const skip = () => advance();

  // ── estados especiais ──────────────────────────────
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
        <Header variant="adopter" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
        <Header variant="adopter" />
        <div className="container mx-auto px-6 py-20 text-center max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="text-6xl mb-6">🐾</div>
            <h2 className="text-2xl font-bold mb-4">Nenhum match ainda</h2>
            <p className="text-muted-foreground mb-8">
              Responda ao questionário para descobrir os pets mais compatíveis com você!
            </p>
            <button
              onClick={() => navigate("/questionario")}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:scale-105 transition-transform"
            >
              Responder Questionário
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = recs[currentIdx] ?? null;

  // Todos os cards vistos e sem mais para carregar
  if (!current && allLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
        <Header variant="adopter" />
        <div className="container mx-auto px-6 py-20 text-center max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold mb-4">Você viu todos os matches!</h2>
            <p className="text-muted-foreground mb-8">
              {likedIds.size > 0
                ? `Você curtiu ${likedIds.size} pet${likedIds.size > 1 ? "s" : ""}. Acesse seu perfil para ver os contatos!`
                : "Refaça o questionário para novos resultados."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentIdx(0)}
                className="w-full py-3 border-2 border-primary text-primary rounded-2xl font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Ver novamente
              </button>
              <button
                onClick={() => navigate("/questionario")}
                className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-semibold hover:scale-105 transition-transform"
              >
                Novo questionário
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Carregando mais (chegou no fim mas ainda há mais)
  if (!current && !allLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
        <Header variant="adopter" />
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Buscando mais matches...</p>
        </div>
      </div>
    );
  }

  const img     = getPetImg(current!.pet);
  const isLiked = likedIds.has(current!.pet._id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-4 py-6 flex flex-col items-center">
        {/* Contador */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{currentIdx + 1}</span>
          <span>/</span>
          <span>{recs.length}{!allLoaded ? "+" : ""}</span>
          <span>matches</span>
          {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={current!.pet._id}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Imagem */}
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {img ? (
                  <img src={img} alt={current!.pet.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-primary/10 to-purple-100">
                    {current!.pet.tipo_animal?.toLowerCase() === "gato" ? "🐱" : "🐶"}
                  </div>
                )}

                <ScoreBadge score={current!.score} />

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 text-white">
                  <h2 className="text-2xl font-bold leading-tight">
                    {current!.pet.nome}, {current!.pet.idade_display}
                  </h2>
                  <p className="text-sm opacity-90 mt-0.5">
                    {current!.pet.raca || current!.pet.tipo_animal} · {current!.pet.sexo}
                  </p>
                  {current!.pet.localizacao && (
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                      <MapPin className="w-3.5 h-3.5" />
                      {current!.pet.localizacao}
                    </div>
                  )}
                </div>
              </div>

              {/* Info + contato */}
              <div className="p-4">
                {current!.pet.descricao && (
                  <p className="text-sm text-foreground/80 mb-3 line-clamp-3 leading-relaxed">
                    {current!.pet.descricao}
                  </p>
                )}

                {current!.pet.url && (
                  <a
                    href={current!.pet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all shadow-md ${
                      isLiked
                        ? "bg-gradient-to-r from-primary to-purple-600 text-white hover:scale-[1.02]"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    Entrar em Contato
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Botões like / skip */}
        <div className="flex items-center gap-8 mt-6">
          <button
            onClick={skip}
            className="w-16 h-16 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center border-2 border-destructive/20 hover:border-destructive/40"
          >
            <X className="w-7 h-7 text-destructive" />
          </button>

          <button
            onClick={like}
            disabled={liking}
            className={`w-20 h-20 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center ${
              isLiked ? "bg-primary" : "bg-gradient-to-br from-primary to-purple-600"
            } disabled:opacity-60 disabled:hover:scale-100`}
          >
            <Heart className={`w-9 h-9 text-white ${isLiked ? "fill-white" : ""}`} />
          </button>
        </div>

        {/* Indicadores de progresso */}
        <div className="flex gap-1 mt-5">
          {recs.slice(0, Math.min(recs.length, 10)).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentIdx
                  ? "w-6 bg-primary"
                  : i < currentIdx
                  ? "w-2 bg-primary/40"
                  : "w-2 bg-border"
              }`}
            />
          ))}
          {!allLoaded && <div className="w-2 h-1 rounded-full bg-border/50" />}
        </div>
      </div>
    </div>
  );
}
