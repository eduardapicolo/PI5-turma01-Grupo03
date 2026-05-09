import { ArrowRight, Heart, Search, Sparkles, Users } from "lucide-react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { PetCard } from "../components/PetCard";
import { mockPets } from "../data/mockPets";

export function HomePage() {
  const featuredPets = mockPets.slice(0, 3);

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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#como-funciona"
              className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-full font-semibold text-lg hover:scale-105 transition-transform"
            >
              Como Funciona
            </a>
          </div>
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

      <section id="destaques" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Pets em Destaque</h2>
            <p className="text-lg text-muted-foreground">Conheça alguns dos pets esperando por um lar</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {featuredPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} compact showMatch />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:scale-105 transition-transform"
            >
              Ver Todos os Pets
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">PetMatch</h4>
              <p className="text-sm text-gray-400">Conectando pets e pessoas através da tecnologia e amor.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Úteis</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Para ONGs</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>contato@petmatch.com</li>
                <li>(11) 99999-9999</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 PetMatch. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
