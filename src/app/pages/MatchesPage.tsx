import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { PetCard } from "../components/PetCard";
import { mockPets } from "../data/mockPets";
import { Heart } from "lucide-react";

export function MatchesPage() {
  const navigate = useNavigate();
  const likedPets = mockPets.slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-primary fill-current" />
            <h1 className="text-4xl font-bold">Meus Matches</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {likedPets.length} {likedPets.length === 1 ? 'pet curtido' : 'pets curtidos'}
          </p>
        </div>

        {likedPets.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center max-w-2xl mx-auto">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Nenhum match ainda</h2>
            <p className="text-muted-foreground mb-6">
              Comece a dar likes nos pets que você se interessar para vê-los aqui!
            </p>
            <button
              onClick={() => navigate('/swipe')}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Descobrir Pets
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {likedPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                compact
                showMatch
                onClick={() => navigate(`/pet/${pet.id}`)}
              />
            ))}
          </div>
        )}

        {likedPets.length > 0 && (
          <div className="mt-12 bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="font-semibold text-xl mb-4">Próximos Passos</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Revise os detalhes</h4>
                  <p className="text-sm text-muted-foreground">
                    Clique nos pets para ver mais informações e confirmar se é o match perfeito.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Demonstre interesse</h4>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Tenho Interesse" na página do pet para notificar a ONG.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Aguarde o contato</h4>
                  <p className="text-sm text-muted-foreground">
                    A ONG entrará em contato para agendar uma visita e dar continuidade ao processo de adoção.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
