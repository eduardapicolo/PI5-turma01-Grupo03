import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Upload, ArrowLeft, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const IDADES = [
  "Abaixo de 2 meses",
  "2 a 6 meses",
  "7 a 11 meses",
  "1 ano",
  "2 anos",
  "3 anos",
  "4 anos",
  "5 anos",
  "6 ou mais anos",
];

export function OngAddPetPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    nome:                      "",
    tipo_animal:               "",
    raca:                      "",
    porte:                     "",
    idade_display:             "",
    sexo:                      "",
    pelagem:                   "",
    descricao:                 "",
    // saúde
    castrado:                  false,
    vacinado:                  false,
    vermifugado:               false,
    precisa_cuidados_especiais: false,
    // sociabilidade
    sociavel_criancas: false,
    sociavel_animais:  false,
    // ambiente
    aceita_apartamento:  false,
    aceita_casa_quintal: false,
    disponibilidade:     "Disponível",
  });

  const [foto, setFoto]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const set = (key: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        body.append(k, String(v));
      });
      if (foto) body.append("foto", foto);

      const res = await fetch(`${API_URL}/pets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao salvar pet");
      }

      navigate("/ong/animais");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const Field = ({
    label, required = false, children,
  }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block font-medium mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );

  const Select = ({
    field, options, required = false,
  }: { field: string; options: string[]; required?: boolean }) => (
    <select
      required={required}
      value={(formData as Record<string, unknown>)[field] as string}
      onChange={(e) => set(field, e.target.value)}
      className="w-full p-4 bg-input-background rounded-xl border border-border"
    >
      <option value="">Selecione</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const Checkbox = ({ field, label }: { field: string; label: string }) => (
    <label className="flex items-center gap-3 p-4 bg-input-background rounded-xl cursor-pointer hover:bg-muted transition-colors">
      <input
        type="checkbox"
        checked={(formData as Record<string, unknown>)[field] as boolean}
        onChange={(e) => set(field, e.target.checked)}
        className="w-5 h-5 rounded border-border"
      />
      <span className="font-medium">{label}</span>
    </label>
  );

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

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-2xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Foto do Animal</h2>
            <div className="flex items-center justify-center">
              <label className="w-full max-w-md cursor-pointer">
                {preview ? (
                  <div className="relative aspect-square rounded-3xl overflow-hidden border-4 border-dashed border-primary">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Informações básicas */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Informações Básicas</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Field label="Nome" required>
                <input
                  type="text" required value={formData.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                  placeholder="Ex: Luna"
                />
              </Field>
              <Field label="Espécie" required>
                <Select field="tipo_animal" options={["Cachorro", "Gato"]} required />
              </Field>
              <Field label="Raça">
                <input
                  type="text" value={formData.raca}
                  onChange={(e) => set("raca", e.target.value)}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                  placeholder="Ex: Golden Retriever ou Vira-lata"
                />
              </Field>
              <Field label="Idade" required>
                <Select field="idade_display" options={IDADES} required />
              </Field>
              <Field label="Porte" required>
                <Select field="porte" options={["Pequeno", "Médio", "Grande"]} required />
              </Field>
              <Field label="Sexo" required>
                <Select field="sexo" options={["Macho", "Fêmea"]} required />
              </Field>
              <Field label="Pelagem">
                <input
                  type="text" value={formData.pelagem}
                  onChange={(e) => set("pelagem", e.target.value)}
                  className="w-full p-4 bg-input-background rounded-xl border border-border"
                  placeholder="Ex: Caramela, Preta e branca"
                />
              </Field>
              <Field label="Disponibilidade">
                <Select field="disponibilidade" options={["Disponível", "Adotado"]} />
              </Field>
            </div>

            <div className="mt-6">
              <Field label="Descrição" required>
                <textarea
                  required value={formData.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-input-background rounded-xl border border-border resize-none"
                  placeholder="Conte a história do animal, seu comportamento, preferências..."
                />
              </Field>
            </div>
          </div>

          {/* Saúde */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Histórico Veterinário</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Checkbox field="castrado"    label="Castrado" />
              <Checkbox field="vacinado"    label="Vacinado" />
              <Checkbox field="vermifugado" label="Vermifugado" />
              <Checkbox field="precisa_cuidados_especiais" label="Precisa de cuidados especiais" />
            </div>
          </div>

          {/* Sociabilidade */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Sociabilidade</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Checkbox field="sociavel_criancas" label="Sociável com crianças" />
              <Checkbox field="sociavel_animais"  label="Sociável com outros animais" />
            </div>
          </div>

          {/* Ambiente */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Ambiente</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Checkbox field="aceita_apartamento"  label="Vive bem em apartamento" />
              <Checkbox field="aceita_casa_quintal" label="Vive bem em casa com quintal" />
            </div>
          </div>

          {/* Ações */}
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
              disabled={isLoading}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-secondary to-orange-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
            >
              <Save className="w-5 h-5" />
              {isLoading ? "Salvando..." : "Salvar Animal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
