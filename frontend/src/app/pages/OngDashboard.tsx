import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { Heart, PawPrint, Plus } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface Stats {
  total: number;
  disponiveis: number;
  adotados: number;
}

export function OngDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/pets/ong/meus`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const pets = d.data ?? [];
        setStats({
          total:       pets.length,
          disponiveis: pets.filter((p: any) => p.disponibilidade === "Disponível").length,
          adotados:    pets.filter((p: any) => p.disponibilidade === "Adotado").length,
        });
      })
      .catch(() => setStats({ total: 0, disponiveis: 0, adotados: 0, emProcesso: 0 }))
      .finally(() => setLoading(false));
  }, [token]);

  const cards = [
    { label: "Total de Animais", value: stats?.total,       icon: PawPrint, color: "bg-primary/10 text-primary" },
    { label: "Disponíveis",      value: stats?.disponiveis, icon: Heart,    color: "bg-green-500/10 text-green-600" },
    { label: "Adotados",         value: stats?.adotados,    icon: Heart,    color: "bg-purple-500/10 text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ong-bg to-white">
      <Header variant="ong" />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Bem-vindo{user?.ongName ? `, ${user.ongName}` : ""}! Gerencie seus pets para adoção.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-3xl shadow-lg p-6">
              <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {loading ? "—" : (value ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Ações rápidas */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/ong/adicionar"
              className="p-6 bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center gap-4"
            >
              <div className="bg-white/20 p-3 rounded-xl">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Adicionar Animal</h3>
                <p className="text-sm opacity-90">Cadastre um novo pet para adoção</p>
              </div>
            </Link>
            <Link
              to="/ong/animais"
              className="p-6 bg-gradient-to-br from-secondary to-orange-600 text-white rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center gap-4"
            >
              <div className="bg-white/20 p-3 rounded-xl">
                <PawPrint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gerenciar Animais</h3>
                <p className="text-sm opacity-90">Visualize, edite e exclua seus pets</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
