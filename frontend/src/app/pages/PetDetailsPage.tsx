import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Heart, MapPin, Calendar, Ruler,
  CheckCircle, ExternalLink,
} from "lucide-react";
import { Header } from "../components/Header";
import { ApiPet } from "../components/PetCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function PetDetailsPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [pet, setPet]       = useState<ApiPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/pets/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPet(d.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const img = pet?.imagem_principal || pet?.imagem || pet?.fotos?.[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-adopter-bg">
        <Header variant="adopter" />
        <div className="container mx-auto px-6 py-20 flex justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-adopter-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pet não encontrado</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Coluna esquerda — imagem */}
          <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden shadow-2xl bg-muted aspect-square">
              {img ? (
                <img src={img} alt={pet.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-primary/10 to-purple-100">
                  {pet.tipo_animal?.toLowerCase() === "gato" ? "🐱" : "🐶"}
                </div>
              )}
            </div>

            {/* Saúde */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-semibold mb-4">Histórico Veterinário</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Vacinado",     ok: (pet as any).vacinado },
                  { label: "Castrado",     ok: (pet as any).castrado },
                  { label: "Vermifugado",  ok: (pet as any).vermifugado },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2">
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 ${ok ? "text-green-500" : "text-muted-foreground/30"}`} />
                    <span className={`text-sm ${ok ? "" : "text-muted-foreground"}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna direita — info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h1 className="text-4xl font-bold mb-1">{pet.nome}</h1>
              <p className="text-xl text-muted-foreground mb-6">
                {pet.raca || pet.tipo_animal} · {pet.sexo}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Idade</p>
                    <p className="font-semibold text-sm">{pet.idade_display}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Ruler className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Porte</p>
                    <p className="font-semibold text-sm">{pet.porte}</p>
                  </div>
                </div>
              </div>

              {pet.descricao && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Sobre {pet.nome}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{pet.descricao}</p>
                </div>
              )}

              {(pet.sociavel_criancas || pet.sociavel_animais) && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Sociabilidade</h3>
                  <div className="flex flex-wrap gap-2">
                    {pet.sociavel_criancas && (
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                        👶 Sociável com crianças
                      </span>
                    )}
                    {pet.sociavel_animais && (
                      <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                        🐾 Sociável com animais
                      </span>
                    )}
                  </div>
                </div>
              )}

              {pet.localizacao && (
                <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{pet.localizacao}</span>
                </div>
              )}

              {pet.url ? (
                <a
                  href={pet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Quero Adotar
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button className="w-full py-4 px-6 bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  Tenho Interesse
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
