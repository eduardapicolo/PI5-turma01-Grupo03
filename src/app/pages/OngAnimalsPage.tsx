import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Plus, Search, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import { mockPets } from "../data/mockPets";

export function OngAnimalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredPets = mockPets.filter((pet) =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-ong-bg to-white">
      <Header variant="ong" />

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gerenciar Animais</h1>
            <p className="text-lg text-muted-foreground">{filteredPets.length} animais cadastrados</p>
          </div>
          <Link
            to="/ong/adicionar"
            className="px-6 py-4 bg-gradient-to-r from-secondary to-orange-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Animal
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome do animal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-input-background rounded-2xl border border-border"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-3xl shadow-lg overflow-hidden group">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={pet.image}
                  alt={pet.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                    Disponível
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{pet.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {pet.breed || pet.species} • {pet.age} • {pet.size}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/pet/${pet.id}`)}
                    className="flex-1 py-3 px-4 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="py-3 px-4 bg-destructive/10 text-destructive rounded-xl font-semibold hover:bg-destructive/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPets.length === 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Nenhum animal encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Tente buscar por outro nome ou adicione um novo animal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
