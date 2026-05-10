import { ExternalLink, MapPin } from "lucide-react";

export interface ApiPet {
  _id: string;
  nome: string;
  tipo_animal: string;
  raca?: string;
  porte: string;
  idade_display: string;
  sexo: string;
  pelagem?: string;
  descricao?: string;
  imagem?: string;
  imagem_principal?: string;
  fotos?: string[];
  url?: string;
  localizacao?: string;
  disponibilidade: string;
  sociavel_criancas?: boolean;
  sociavel_animais?: boolean;
}

interface PetCardProps {
  pet: ApiPet;
  onClick?: () => void;
}

function getPetImage(pet: ApiPet): string | null {
  return pet.imagem_principal || pet.imagem || pet.fotos?.[0] || null;
}

function PetPlaceholder({ tipo }: { tipo: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center text-6xl select-none">
      {tipo?.toLowerCase() === "gato" ? "🐱" : "🐶"}
    </div>
  );
}

export function PetCard({ pet, onClick }: PetCardProps) {
  const img = getPetImage(pet);
  const adocaoUrl = pet.url;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
    >
      {/* Imagem */}
      <div className="relative w-full aspect-square overflow-hidden bg-muted flex-shrink-0">
        {img ? (
          <img
            src={img}
            alt={pet.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="w-full h-full"
          style={{ display: img ? "none" : "flex" }}
        >
          <PetPlaceholder tipo={pet.tipo_animal} />
        </div>

        {/* Badge disponibilidade */}
        {pet.disponibilidade !== "Disponível" && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            {pet.disponibilidade}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-bold text-lg text-foreground leading-tight truncate">
            {pet.nome}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {pet.raca || pet.tipo_animal} · {pet.porte} · {pet.sexo}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">{pet.idade_display}</p>

        {pet.localizacao && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{pet.localizacao}</span>
          </div>
        )}

        {/* Tags sociabilidade */}
        {(pet.sociavel_criancas || pet.sociavel_animais) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {pet.sociavel_criancas && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                👶 Crianças
              </span>
            )}
            {pet.sociavel_animais && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                🐾 Animais
              </span>
            )}
          </div>
        )}

        {/* Botão de adoção */}
        {adocaoUrl && (
          <a
            href={adocaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-auto pt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Quero Adotar
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
