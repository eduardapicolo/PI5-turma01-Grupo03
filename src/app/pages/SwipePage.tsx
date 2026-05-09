import { useState } from "react";
import { useNavigate } from "react-router";
import { X, Heart, Filter, Sliders } from "lucide-react";
import { Header } from "../components/Header";
import { PetCard } from "../components/PetCard";
import { mockPets } from "../data/mockPets";
import { motion, AnimatePresence } from "motion/react";

export function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [likedPets, setLikedPets] = useState<string[]>([]);
  const navigate = useNavigate();

  const currentPet = mockPets[currentIndex];

  const handleLike = () => {
    if (currentPet) {
      setLikedPets([...likedPets, currentPet.id]);
      nextPet();
    }
  };

  const handlePass = () => {
    nextPet();
  };

  const nextPet = () => {
    if (currentIndex < mockPets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleCardClick = () => {
    if (currentPet) {
      navigate(`/pet/${currentPet.id}`);
    }
  };

  if (!currentPet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Descubra seu Pet</h1>
            <p className="text-muted-foreground">
              {likedPets.length} {likedPets.length === 1 ? 'match' : 'matches'} até agora
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Filtros</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Espécie</label>
                <select className="w-full p-3 bg-input-background rounded-xl border border-border">
                  <option>Todos</option>
                  <option>Cachorro</option>
                  <option>Gato</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Porte</label>
                <select className="w-full p-3 bg-input-background rounded-xl border border-border">
                  <option>Todos</option>
                  <option>Pequeno</option>
                  <option>Médio</option>
                  <option>Grande</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Idade</label>
                <select className="w-full p-3 bg-input-background rounded-xl border border-border">
                  <option>Todas</option>
                  <option>Filhote (0-1 ano)</option>
                  <option>Jovem (1-3 anos)</option>
                  <option>Adulto (3-7 anos)</option>
                  <option>Idoso (7+ anos)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center min-h-[600px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPet.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <PetCard pet={currentPet} showMatch onClick={handleCardClick} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={handlePass}
            className="w-20 h-20 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center group border-4 border-destructive/20"
          >
            <X className="w-10 h-10 text-destructive group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={handleLike}
            className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
          >
            <Heart className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-2">
            Pet {currentIndex + 1} de {mockPets.length}
          </p>
          <div className="flex justify-center gap-1">
            {mockPets.slice(0, 10).map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : index < currentIndex
                    ? 'w-1 bg-primary/50'
                    : 'w-1 bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
