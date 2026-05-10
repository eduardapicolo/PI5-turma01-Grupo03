import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Pet {
  _id: string;
  nome: string;
  tipo_animal: string;
  raca?: string;
  porte: string;
  idade_display: string;
  sexo: string;
  disponibilidade: string;
  imagem_principal?: string;
  imagem?: string;
  fotos?: string[];
}

const STATUS_STYLE: Record<string, string> = {
  "Disponível":  "bg-green-100 text-green-700",
  "Em processo": "bg-yellow-100 text-yellow-700",
  "Adotado":     "bg-gray-100 text-gray-600",
};

export function OngAnimalsPage() {
  const { token }         = useAuth();
  const [pets, setPets]   = useState<Pet[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/pets/ong/meus`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setPets(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este animal?")) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/pets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPets((prev) => prev.filter((p) => p._id !== id));
    } catch {
      alert("Erro ao excluir o animal.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = pets.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const getImg = (p: Pet) =>
    p.imagem_principal || p.imagem || p.fotos?.[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ong-bg to-white">
      <Header variant="ong" />

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-1">Meus Animais</h1>
            <p className="text-muted-foreground">{filtered.length} animal(is) cadastrado(s)</p>
          </div>
          <Link
            to="/ong/adicionar"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-orange-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Adicionar Animal
          </Link>
        </div>

        {/* Busca */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-input-background rounded-xl border border-border"
            />
          </div>
        </div>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-2xl font-bold mb-2">
              {search ? "Nenhum animal encontrado" : "Nenhum animal cadastrado"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {search
                ? "Tente outro nome."
                : "Adicione seu primeiro pet para começar a receber adotantes."}
            </p>
            {!search && (
              <Link
                to="/ong/adicionar"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold"
              >
                <Plus className="w-4 h-4" />
                Adicionar Animal
              </Link>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((pet) => {
              const img = getImg(pet);
              return (
                <div key={pet._id} className="bg-white rounded-3xl shadow-lg overflow-hidden group">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={pet.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary/10 to-purple-100">
                        {pet.tipo_animal?.toLowerCase() === "gato" ? "🐱" : "🐶"}
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLE[pet.disponibilidade] ?? "bg-gray-100 text-gray-600"}`}>
                        {pet.disponibilidade}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-1 truncate">{pet.nome}</h3>
                    <p className="text-sm text-muted-foreground mb-4 truncate">
                      {pet.raca || pet.tipo_animal} · {pet.idade_display} · {pet.porte}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        to={`/ong/editar/${pet._id}`}
                        className="flex-1 py-2.5 px-4 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(pet._id)}
                        disabled={deleting === pet._id}
                        className="py-2.5 px-4 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
