import { Heart, Menu, PawPrint } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

interface HeaderProps {
  variant?: 'public' | 'adopter' | 'ong';
  showNav?: boolean;
}

export function Header({ variant = 'public', showNav = true }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const bgColor = variant === 'ong'
    ? 'bg-ong-bg'
    : variant === 'adopter'
    ? 'bg-adopter-bg'
    : 'bg-white';

  return (
    <header className={`${bgColor} border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-2xl group-hover:scale-110 transition-transform">
              <PawPrint className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-foreground">PetMatch</span>
          </Link>

          {showNav && variant === 'public' && (
            <>
              <nav className="hidden md:flex items-center gap-8">
                <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors">Como Funciona</a>
                <a href="#destaques" className="text-foreground hover:text-primary transition-colors">Pets em Destaque</a>
                <Link to="/login" className="text-foreground hover:text-primary transition-colors">Para ONGs</Link>
              </nav>
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="hidden md:block px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-105 transition-transform"
                >
                  Entrar
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </>
          )}

          {showNav && variant === 'adopter' && (
            <nav className="flex items-center gap-6">
              <Link to="/swipe" className="text-foreground hover:text-primary transition-colors font-medium">Descobrir</Link>
              <Link to="/matches" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Matches
              </Link>
              <Link to="/perfil" className="text-foreground hover:text-primary transition-colors font-medium">Perfil</Link>
            </nav>
          )}

          {showNav && variant === 'ong' && (
            <nav className="flex items-center gap-6">
              <Link to="/ong" className="text-foreground hover:text-secondary transition-colors font-medium">Dashboard</Link>
              <Link to="/ong/animais" className="text-foreground hover:text-secondary transition-colors font-medium">Animais</Link>
              <Link to="/ong/interessados" className="text-foreground hover:text-secondary transition-colors font-medium">Interessados</Link>
            </nav>
          )}
        </div>

        {mobileMenuOpen && variant === 'public' && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors">Como Funciona</a>
              <a href="#destaques" className="text-foreground hover:text-primary transition-colors">Pets em Destaque</a>
              <Link to="/login" className="text-foreground hover:text-primary transition-colors">Para ONGs</Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-center"
              >
                Entrar
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
