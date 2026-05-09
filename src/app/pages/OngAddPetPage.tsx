import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Upload, ArrowLeft, Save, X } from "lucide-react";

export function OngAddPetPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    size: "",
    gender: "",
    bio: "",
    temperament: [] as string[],
    vaccinated: false,
    neutered: false,
  });

  const [newTag, setNewTag] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTemperamentTag = () => {
    if (newTag && !formData.temperament.includes(newTag)) {
      setFormData({
        ...formData,
        temperament: [...formData.temperament, newTag],
      });
      setNewTag("");
    }
  };

  const removeTemperamentTag = (tag: string) => {
    setFormData({
      ...formData,
      temperament: formData.temperament.filter((t) => t !== tag),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/ong/animais');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ong-bg to-white">
      <Header variant="ong" />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Adicionar Novo Animal</h1>
          <p className="text-lg text-muted-foreground">Preencha as informações do pet para adoção</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Foto do Animal</h2>
            <div className="flex items-center justify-center">
              <label className="w-full max-w-md cursor-pointer">
                {imagePreview ? (
                  <div className="relative aspect-square rounded-3xl overflow-hidden border-4 border-dashed border-primary">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-semibold">Clique para alterar</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-3xl border-4 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-4">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-semibold mb-1">Clique para fazer upload</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG até 10MB</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Informações Básicas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-2">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                  placeholder="Ex: Luna"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Espécie *</label>
                <select
                  required
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                >
                  <option value="">Selecione</option>
                  <option value="Cachorro">Cachorro</option>
                  <option value="Gato">Gato</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2">Raça</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                  placeholder="Ex: Golden Retriever"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Idade *</label>
                <input
                  type="text"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                  placeholder="Ex: 2 anos"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Porte *</label>
                <select
                  required
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                >
                  <option value="">Selecione</option>
                  <option value="Pequeno">Pequeno</option>
                  <option value="Médio">Médio</option>
                  <option value="Grande">Grande</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2">Sexo *</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                >
                  <option value="">Selecione</option>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Descrição e Temperamento</h2>
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-2">Biografia do Animal *</label>
                <textarea
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={5}
                  className="w-full p-4 bg-input-background rounded-xl border border-border resize-none"
                  placeholder="Conte a história do animal, seu comportamento, preferências..."
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Temperamento (Tags)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTemperamentTag())}
                    className="flex-1 p-4 bg-input-background rounded-xl border border-border"
                    placeholder="Ex: Carinhoso, Brincalhão..."
                  />
                  <button
                    type="button"
                    onClick={addTemperamentTag}
                    className="px-6 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:scale-105 transition-transform"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.temperament.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTemperamentTag(tag)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Histórico Veterinário</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 bg-input-background rounded-xl cursor-pointer hover:bg-muted transition-colors">
                <input
                  type="checkbox"
                  checked={formData.vaccinated}
                  onChange={(e) => setFormData({ ...formData, vaccinated: e.target.checked })}
                  className="w-5 h-5 rounded border-border"
                />
                <span className="font-medium">Animal vacinado</span>
              </label>
              <label className="flex items-center gap-3 p-4 bg-input-background rounded-xl cursor-pointer hover:bg-muted transition-colors">
                <input
                  type="checkbox"
                  checked={formData.neutered}
                  onChange={(e) => setFormData({ ...formData, neutered: e.target.checked })}
                  className="w-5 h-5 rounded border-border"
                />
                <span className="font-medium">Animal castrado</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-4 bg-white border-2 border-border rounded-2xl font-semibold hover:border-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-secondary to-orange-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Salvar Animal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
