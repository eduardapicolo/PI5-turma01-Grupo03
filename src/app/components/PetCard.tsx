import { Heart, MapPin } from "lucide-react";

export interface Pet {
  id: string;
  name: string;
  age: string;
  species: string;
  breed?: string;
  size: string;
  gender: string;
  image: string;
  bio: string;
  location: string;
  matchPercentage?: number;
  ongName: string;
  temperament: string[];
  vaccinated: boolean;
  neutered: boolean;
}

interface PetCardProps {
  pet: Pet;
  showMatch?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function PetCard({ pet, showMatch = false, compact = false, onClick }: PetCardProps) {
  if (compact) {
    return (
      <div
        onClick={onClick}
        className="bg-card rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={pet.image}
            alt={pet.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {showMatch && pet.matchPercentage && (
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2">
              <Heart className="w-4 h-4 fill-current" />
              <span className="font-semibold">{pet.matchPercentage}%</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg text-foreground">{pet.name}</h3>
              <p className="text-sm text-muted-foreground">{pet.age} • {pet.breed || pet.species}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{pet.location}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-3xl overflow-hidden shadow-2xl max-w-md w-full cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={pet.image}
          alt={pet.name}
          className="w-full h-full object-cover"
        />
        {showMatch && pet.matchPercentage && (
          <div className="absolute top-6 right-6 bg-primary text-primary-foreground px-6 py-3 rounded-full flex items-center gap-2 shadow-lg">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-semibold text-lg">{pet.matchPercentage}% Match</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 text-white">
          <h2 className="text-3xl font-bold mb-2">{pet.name}, {pet.age}</h2>
          <p className="text-lg mb-3 opacity-90">{pet.breed || pet.species} • {pet.gender === 'M' ? 'Macho' : 'Fêmea'}</p>
          <p className="text-sm mb-3 line-clamp-2 opacity-80">{pet.bio}</p>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{pet.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
