import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, LogOut, Heart, ExternalLink,
  Phone, MapPin, Pencil, Check, X, Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface LikedPet {
  _id: string;
  nome: string;
  tipo_animal: string;
  porte: string;
  sexo: string;
  idade_display: string;
  imagem_principal?: string;
  imagem?: string;
  fotos?: string[];
  url?: string;
}

function getPetImg(pet: LikedPet): string | null {
  return pet.imagem_principal || pet.imagem || pet.fotos?.[0] || null;
}

export function ProfilePage() {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [likedPets, setLikedPets]       = useState<LikedPet[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(true);

  // Campos editáveis — iniciam vazios, preenchidos após fetch do /me
  const [editing, setEditing]         = useState(false);
  const [telefone, setTelefone]       = useState("");
  const [cep, setCep]                 = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [cepLoading, setCepLoading]   = useState(false);
  const [cepError, setCepError]       = useState<string | null>(null);
  const [telefoneError, setTelefoneError] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  // Formata telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  const formatTelefone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2)  return digits.length ? `(${digits}` : "";
    if (digits.length <= 6)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const validateTelefone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (value === "") return null;
    if (digits.length < 10 || digits.length > 11) return "Telefone inválido. Use (XX) XXXX-XXXX ou (XX) XXXXX-XXXX";
    return null;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setTelefone(formatted);
    setTelefoneError(null);
  };

  // Formata CEP: XXXXX-XXX
  const formatCep = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0,5)}-${digits.slice(5)}` : digits;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    setCepError(null);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado.");
        setLocalizacao("");
      } else {
        setLocalizacao(`${data.localidade} - ${data.uf}`);
        setCepError(null);
      }
    } catch {
      setCepError("Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  // Busca dados frescos do usuário no banco
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          updateUser(d.user);
          setTelefone(d.user.telefone ?? "");
          setLocalizacao(d.user.localizacao ?? "");
        }
      })
      .catch(() => {});
  }, [token]);

  // Busca likes com dados do pet
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/likes?populate=1`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setLikedPets(d.pets ?? []))
      .catch(() => {})
      .finally(() => setLoadingLikes(false));
  }, [token]);

  const handleSave = async () => {
    const telErr = validateTelefone(telefone);
    if (telErr) { setTelefoneError(telErr); return; }
    if (cepError) return;

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ telefone, localizacao }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      const data = await res.json();
      updateUser({ telefone: data.user.telefone, localizacao: data.user.localizacao });
      setEditing(false);
    } catch {
      setSaveError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setTelefone(user?.telefone ?? "");
    setLocalizacao(user?.localizacao ?? "");
    setCep("");
    setCepError(null);
    setTelefoneError(null);
    setSaveError(null);
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Meu Perfil</h1>

        {/* Avatar + nome */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 flex items-center gap-6">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{user.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Informações pessoais */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Informações Pessoais</h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {saveError && (
            <p className="mb-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">{saveError}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Email — somente leitura */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> E-mail
              </label>
              <div className="px-4 py-3 bg-muted/50 rounded-xl text-sm text-muted-foreground truncate">
                {user.email}
              </div>
            </div>

            {/* Telefone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Telefone
              </label>
              {editing ? (
                <div className="flex flex-col gap-1">
                  <input
                    type="tel"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(11) 99999-9999"
                    className={`px-4 py-3 bg-input-background rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      telefoneError ? "border-destructive" : "border-border"
                    }`}
                  />
                  {telefoneError && (
                    <p className="text-xs text-destructive">{telefoneError}</p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-muted/50 rounded-xl text-sm truncate">
                  {user.telefone || <span className="text-muted-foreground italic">Não informado</span>}
                </div>
              )}
            </div>

            {/* CEP → Localização */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {editing ? "CEP" : "Localização"}
              </label>
              {editing ? (
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className={`w-full px-4 py-3 bg-input-background rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 ${
                        cepError ? "border-destructive" : "border-border"
                      }`}
                    />
                    {cepLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {cepError && <p className="text-xs text-destructive">{cepError}</p>}
                  {localizacao && !cepError && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {localizacao}
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-muted/50 rounded-xl text-sm truncate">
                  {user.localizacao || <span className="text-muted-foreground italic">Não informado</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pets curtidos */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <h3 className="text-xl font-bold">Meus Likes</h3>
            {!loadingLikes && (
              <span className="ml-auto text-sm text-muted-foreground">
                {likedPets.length} pet{likedPets.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingLikes && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingLikes && likedPets.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-muted-foreground mb-4">Você ainda não curtiu nenhum pet.</p>
              <button
                onClick={() => navigate("/matches")}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold hover:scale-105 transition-transform"
              >
                Ver Matches
              </button>
            </div>
          )}

          {!loadingLikes && likedPets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {likedPets.map((pet) => {
                const img = getPetImg(pet);
                return (
                  <div key={pet._id} className="rounded-2xl overflow-hidden border border-border group">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {img ? (
                        <img
                          src={img}
                          alt={pet.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-primary/10 to-purple-100">
                          {pet.tipo_animal?.toLowerCase() === "gato" ? "🐱" : "🐶"}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold truncate text-sm">{pet.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {pet.tipo_animal} · {pet.porte}
                      </p>
                      {pet.url && (
                        <a
                          href={pet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                        >
                          Entrar em contato
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-4">Conta</h3>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-destructive/10 text-destructive rounded-2xl font-semibold hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
