import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { PetCard, ApiPet } from "../components/PetCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function SwipePage() {
  const [pets, setPets]       = useState<ApiPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 24;

  async function fetchPets(p: number, append = false) {
    try {
      const res = await fetch(
        `${API_URL}/pets?disponibilidade=Dispon%C3%ADvel&limit=${LIMIT}&page=${p}`
      );
      if (!res.ok) throw new Error("Falha ao carregar pets");
      const data = await res.json();
      const novos: ApiPet[] = data.data || [];
      setPets((prev) => append ? [...prev, ...novos] : novos);
      setHasMore(novos.length === LIMIT);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchPets(1).finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    await fetchPets(next, true);
    setPage(next);
    setLoadingMore(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Pets para Adoção</h1>
          {!loading && !error && (
            <p className="text-muted-foreground mt-1">
              {pets.length} pet{pets.length !== 1 ? "s" : ""} disponíveis
            </p>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-9 bg-muted rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); fetchPets(1).finally(() => setLoading(false)); }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && pets.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            Nenhum pet disponível no momento.
          </div>
        )}

        {!loading && !error && pets.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pets.map((pet) => (
                <PetCard key={String(pet._id)} pet={pet} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loadingMore ? "Carregando..." : "Ver mais pets"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
