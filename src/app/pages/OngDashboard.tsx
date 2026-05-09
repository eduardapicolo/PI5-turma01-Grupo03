import { Link } from "react-router";
import { Header } from "../components/Header";
import { Heart, PawPrint, Users, TrendingUp } from "lucide-react";
import { mockPets } from "../data/mockPets";

export function OngDashboard() {
  const totalPets = mockPets.length;
  const availablePets = mockPets.filter(p => p.id !== "0").length;
  const adoptedPets = 12;
  const interestedUsers = 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ong-bg to-white">
      <Header variant="ong" />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard da ONG</h1>
          <p className="text-lg text-muted-foreground">Bem-vindo de volta! Aqui está um resumo da sua ONG.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <PawPrint className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold text-green-600">+2 este mês</span>
            </div>
            <p className="text-3xl font-bold mb-1">{totalPets}</p>
            <p className="text-sm text-muted-foreground">Total de Animais</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-secondary/10 p-3 rounded-2xl">
                <Heart className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{availablePets}</p>
            <p className="text-sm text-muted-foreground">Disponíveis</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/10 p-3 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-600">+3 este mês</span>
            </div>
            <p className="text-3xl font-bold mb-1">{adoptedPets}</p>
            <p className="text-sm text-muted-foreground">Adotados</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/10 p-3 rounded-2xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{interestedUsers}</p>
            <p className="text-sm text-muted-foreground">Interessados Ativos</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                to="/ong/adicionar"
                className="p-6 bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl hover:scale-105 transition-transform shadow-lg"
              >
                <PawPrint className="w-8 h-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Adicionar Animal</h3>
                <p className="text-sm opacity-90">Cadastre um novo pet para adoção</p>
              </Link>
              <Link
                to="/ong/animais"
                className="p-6 bg-gradient-to-br from-secondary to-orange-600 text-white rounded-2xl hover:scale-105 transition-transform shadow-lg"
              >
                <Heart className="w-8 h-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Gerenciar Animais</h3>
                <p className="text-sm opacity-90">Visualize e edite seus pets</p>
              </Link>
              <Link
                to="/ong/interessados"
                className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl hover:scale-105 transition-transform shadow-lg"
              >
                <Users className="w-8 h-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Ver Interessados</h3>
                <p className="text-sm opacity-90">Acompanhe adotantes em potencial</p>
              </Link>
              <div className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl hover:scale-105 transition-transform shadow-lg cursor-pointer">
                <TrendingUp className="w-8 h-8 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Relatórios</h3>
                <p className="text-sm opacity-90">Visualize estatísticas e métricas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Atividade Recente</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <Heart className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Nova adoção!</p>
                  <p className="text-xs text-muted-foreground">Luna foi adotada</p>
                  <p className="text-xs text-muted-foreground">Há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Novo interesse</p>
                  <p className="text-xs text-muted-foreground">Maria demonstrou interesse em Thor</p>
                  <p className="text-xs text-muted-foreground">Há 5 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <PawPrint className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Animal cadastrado</p>
                  <p className="text-xs text-muted-foreground">Bob foi adicionado ao sistema</p>
                  <p className="text-xs text-muted-foreground">Ontem</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
