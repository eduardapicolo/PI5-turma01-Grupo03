import { ArrowRight, Heart, Search, Sparkles, Users } from "lucide-react";
import { Link } from "react-router";
import { Header } from "../components/Header";

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-adopter-bg">
      <Header variant="public" />

      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-6">
            <span className="bg-primary/10 text-primary px-6 py-2 rounded-full font-semibold text-sm">
              🐾 Encontre seu novo melhor amigo
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
            Adoção com <span className="text-primary">Match Perfeito</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Conectamos você com pets que combinam com seu estilo de vida através de tecnologia inteligente e muito amor.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-lg"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section id="como-funciona" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Como Funciona</h2>
          <p className="text-lg text-muted-foreground">4 passos simples para encontrar seu pet ideal</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="bg-gradient-to-br from-primary to-purple-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Faça Login</h3>
            <p className="text-muted-foreground">Entre rapidamente com sua conta Google</p>
          </div>
          <div className="text-center group">
            <div className="bg-gradient-to-br from-secondary to-orange-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Responda ao Quiz</h3>
            <p className="text-muted-foreground">Conte-nos sobre suas preferências e estilo de vida</p>
          </div>
          <div className="text-center group">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Dê Match</h3>
            <p className="text-muted-foreground">Navegue pelos pets compatíveis com você</p>
          </div>
          <div className="text-center group">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
              <Heart className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold mb-3">4. Adote</h3>
            <p className="text-muted-foreground">Entre em contato com a ONG e complete a adoção</p>
          </div>
        </div>
      </section>

    </div>
  );
}
