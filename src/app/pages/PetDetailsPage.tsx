import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Heart, MapPin, Calendar, Ruler, CheckCircle, Building } from "lucide-react";
import { Header } from "../components/Header";
import { mockPets } from "../data/mockPets";

export function PetDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pet = mockPets.find((p) => p.id === id);

  if (!pet) {
    return (
      <div className="min-h-screen bg-adopter-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pet não encontrado</h2>
          <button
            onClick={() => navigate('/swipe')}
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

      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full aspect-square object-cover"
              />
              {pet.matchPercentage && (
                <div className="absolute top-6 right-6 bg-primary text-primary-foreground px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
                  <Heart className="w-5 h-5 fill-current" />
                  <span className="font-semibold text-lg">{pet.matchPercentage}% Match</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-semibold mb-4">Informações Veterinárias</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-5 h-5 ${pet.vaccinated ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{pet.vaccinated ? 'Vacinado' : 'Não vacinado'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-5 h-5 ${pet.neutered ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">{pet.neutered ? 'Castrado' : 'Não castrado'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h1 className="text-4xl font-bold mb-2">{pet.name}</h1>
              <p className="text-xl text-muted-foreground mb-6">
                {pet.breed || pet.species} • {pet.gender === 'M' ? 'Macho' : 'Fêmea'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Idade</p>
                    <p className="font-semibold">{pet.age}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Ruler className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Porte</p>
                    <p className="font-semibold">{pet.size}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Sobre {pet.name}</h3>
                <p className="text-muted-foreground leading-relaxed">{pet.bio}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Temperamento</h3>
                <div className="flex flex-wrap gap-2">
                  {pet.temperament.map((trait) => (
                    <span
                      key={trait}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6 p-4 bg-adopter-bg rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Building className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">ONG Responsável</h3>
                </div>
                <p className="text-muted-foreground">{pet.ongName}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{pet.location}</span>
                </div>
              </div>

              <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 mb-6">
                <p className="text-sm font-medium text-primary">
                  💡 Por que este pet é perfeito para você?
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Com base no seu questionário, {pet.name} se encaixa perfeitamente no seu estilo de vida e preferências!
                </p>
              </div>

              <button className="w-full py-4 px-6 bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                Tenho Interesse
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
