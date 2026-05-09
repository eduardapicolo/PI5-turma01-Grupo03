import { useState } from "react";
import { Header } from "../components/Header";
import { Mail, Phone, MapPin, Heart, Calendar, User, CheckCircle, X } from "lucide-react";
import { mockPets } from "../data/mockPets";

interface Interest {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userLocation: string;
  petId: string;
  petName: string;
  petImage: string;
  matchPercentage: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockInterests: Interest[] = [
  {
    id: "1",
    userName: "Maria Silva",
    userEmail: "maria.silva@email.com",
    userPhone: "(11) 98888-7777",
    userLocation: "São Paulo, SP",
    petId: "1",
    petName: "Luna",
    petImage: mockPets[0].image,
    matchPercentage: 95,
    date: "2026-05-03",
    status: 'pending',
  },
  {
    id: "2",
    userName: "João Santos",
    userEmail: "joao.santos@email.com",
    userPhone: "(21) 97777-6666",
    userLocation: "Rio de Janeiro, RJ",
    petId: "2",
    petName: "Thor",
    petImage: mockPets[1].image,
    matchPercentage: 88,
    date: "2026-05-04",
    status: 'pending',
  },
  {
    id: "3",
    userName: "Ana Costa",
    userEmail: "ana.costa@email.com",
    userPhone: "(31) 96666-5555",
    userLocation: "Belo Horizonte, MG",
    petId: "3",
    petName: "Mia",
    petImage: mockPets[2].image,
    matchPercentage: 92,
    date: "2026-05-05",
    status: 'approved',
  },
];

export function OngInterestsPage() {
  const [interests, setInterests] = useState<Interest[]>(mockInterests);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredInterests = filter === 'all'
    ? interests
    : interests.filter((i) => i.status === filter);

  const handleApprove = (id: string) => {
    setInterests(interests.map((i) => i.id === id ? { ...i, status: 'approved' as const } : i));
  };

  const handleReject = (id: string) => {
    setInterests(interests.map((i) => i.id === id ? { ...i, status: 'rejected' as const } : i));
  };

  const pendingCount = interests.filter((i) => i.status === 'pending').length;
  const approvedCount = interests.filter((i) => i.status === 'approved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ong-bg to-white">
      <Header variant="ong" />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Interessados</h1>
          <p className="text-lg text-muted-foreground">
            {pendingCount} {pendingCount === 1 ? 'solicitação pendente' : 'solicitações pendentes'}
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-white text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({interests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-secondary text-secondary-foreground shadow-md'
                : 'bg-white text-muted-foreground hover:text-foreground'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
              filter === 'approved'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-white text-muted-foreground hover:text-foreground'
            }`}
          >
            Aprovados ({approvedCount})
          </button>
        </div>

        <div className="space-y-4">
          {filteredInterests.map((interest) => (
            <div key={interest.id} className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src={interest.petImage}
                    alt={interest.petName}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg mb-1">{interest.petName}</h3>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary fill-current" />
                      <span className="text-sm font-semibold text-primary">
                        {interest.matchPercentage}% Match
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{interest.userName}</span>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{interest.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{interest.userPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{interest.userLocation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(interest.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {interest.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(interest.id)}
                          className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(interest.id)}
                          className="py-3 px-4 bg-destructive/10 text-destructive rounded-xl font-semibold hover:bg-destructive/20 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : interest.status === 'approved' ? (
                      <div className="py-3 px-4 bg-green-500/10 text-green-600 rounded-xl font-semibold text-center">
                        ✓ Aprovado
                      </div>
                    ) : (
                      <div className="py-3 px-4 bg-destructive/10 text-destructive rounded-xl font-semibold text-center">
                        ✗ Rejeitado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInterests.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Nenhum interessado ainda</h2>
            <p className="text-muted-foreground">
              Quando alguém demonstrar interesse em seus pets, você verá aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
