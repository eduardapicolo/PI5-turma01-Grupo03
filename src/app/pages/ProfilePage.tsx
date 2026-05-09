import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { User, Mail, Phone, MapPin, Edit2, Save } from "lucide-react";

export function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 99999-9999",
    city: "São Paulo, SP",
  });

  const navigate = useNavigate();

  const handleSave = () => {
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg to-white">
      <Header variant="adopter" />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Meu Perfil</h1>
          <p className="text-lg text-muted-foreground">Gerencie suas informações e preferências</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
            <div className="bg-gradient-to-br from-primary to-purple-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="font-semibold text-xl mb-1">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <button
              onClick={() => setEditing(!editing)}
              className="mt-4 px-6 py-2 bg-primary/10 text-primary rounded-full font-semibold hover:bg-primary/20 transition-colors flex items-center gap-2 mx-auto"
            >
              <Edit2 className="w-4 h-4" />
              {editing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h3 className="font-semibold text-xl mb-6">Informações Pessoais</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <User className="w-4 h-4" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!editing}
                    className="w-full p-4 bg-input-background rounded-xl border border-border disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Mail className="w-4 h-4" />
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!editing}
                    className="w-full p-4 bg-input-background rounded-xl border border-border disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!editing}
                    className="w-full p-4 bg-input-background rounded-xl border border-border disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4" />
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    disabled={!editing}
                    className="w-full p-4 bg-input-background rounded-xl border border-border disabled:opacity-60"
                  />
                </div>
              </div>
              {editing && (
                <button
                  onClick={handleSave}
                  className="mt-6 w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h3 className="font-semibold text-xl mb-4">Preferências de Adoção</h3>
              <p className="text-muted-foreground mb-4">
                Suas preferências foram configuradas no questionário inicial.
              </p>
              <button
                onClick={() => navigate('/questionario')}
                className="px-6 py-3 bg-primary/10 text-primary rounded-2xl font-semibold hover:bg-primary/20 transition-colors"
              >
                Refazer Questionário
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
