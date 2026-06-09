import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { X, Heart, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import {
  alternarLikePet,
  buscarIdsCurtidos,
  buscarRecomendacoes,
  RECOMMENDATION_BATCH_SIZE,
  type RecomendacaoPet,
} from "../services/api";

function getPetImg(pet: RecomendacaoPet["pet"]): string | null {
  return pet.imagem_principal || pet.imagem || pet.fotos?.[0] || null;
}

function formatarDistancia(distancia: number): string {
  return distancia.toFixed(4);
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

    try {
      const data = await buscarRecomendacoes(
        { ...answers, topN: RECOMMENDATION_BATCH_SIZE, skip },
        token,
      );

      return (data.recomendacoes ?? []) as RecomendacaoPet[];
    } catch {
      return [];
    }
  }, [token, user?.lastQuestionnaireAnswers]);

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

  useEffect(() => {
    if (!token) return;
    buscarIdsCurtidos(token)
      .then((petIds) => setLikedIds(new Set(petIds)))
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
      if (!allLoaded && !loadingMore && next >= recs.length - 1) {
        loadMore();
      }
      return next;
    });
  }, [allLoaded, loadingMore, recs.length, loadMore]);

  const like = async () => {
    const current = recs.length > 0 ? recs[currentIdx % recs.length] : null;
    if (!current || liking) return;
    setLiking(true);
    try {
      const data = await alternarLikePet(current.pet._id, token);
      setLikedIds((prev) => {
        const next = new Set(prev);
        data.liked ? next.add(current.pet._id) : next.delete(current.pet._id);
        return next;
      });
    } catch {}
    finally {
      setLiking(false);
      advance();
    }
  };

  const skip = () => advance();

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

  const activeIndex = currentIdx % recs.length;
  const current = recs[activeIndex] ?? null;

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
  const distancia = formatarDistancia(current!.distancia);

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-4 py-6 flex flex-col items-center">

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${current!.pet._id}-${currentIdx}`}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {img ? (
                  <img src={img} alt={current!.pet.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-primary/10 to-purple-100">
                    {current!.pet.tipo_animal?.toLowerCase() === "gato" ? "🐱" : "🐶"}
                  </div>
                )}

                <div className="absolute top-4 right-4 rounded-2xl bg-black/70 px-3 py-2 text-right text-white shadow-lg backdrop-blur-sm">
                  <p className="text-[10px] font-medium leading-none opacity-80">
                    Distância euclidiana
                  </p>
                  <p className="mt-1 text-base font-bold leading-none">{distancia}</p>
                </div>

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

        <div className="flex gap-1 mt-5">
          {recs.slice(0, Math.min(recs.length, 10)).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-6 bg-primary"
                  : i < activeIndex
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
