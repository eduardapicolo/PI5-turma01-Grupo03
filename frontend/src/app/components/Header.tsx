import { Heart, LogOut, User, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  variant?: 'public' | 'adopter' | 'ong';
  showNav?: boolean;
}

export function Header({ variant = 'public', showNav = true }: HeaderProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const bgColor = variant === 'ong'
    ? 'bg-ong-bg'
    : variant === 'adopter'
    ? 'bg-adopter-bg'
    : 'bg-white';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`${bgColor} border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-opacity-95`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/LOGO_PIV.png" alt="Aumigos" className="w-10 h-10 rounded-2xl" />
            <span className="text-xl font-bold text-foreground">Aumigos</span>
          </div>

          {showNav && variant === 'public' && (
            <Link
              to="/login"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-105 transition-transform text-sm"
            >
              Entrar
            </Link>
          )}

          {showNav && variant === 'adopter' && (
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link to="/matches" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span className="hidden sm:inline">Descobrir</span>
              </Link>
              <Link to="/perfil" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium group">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary transition-all" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium">Perfil</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors font-medium text-sm"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </nav>
          )}

          {showNav && variant === 'ong' && (
            <nav className="flex items-center gap-4 sm:gap-6">
              <Link to="/ong" className="text-foreground hover:text-secondary transition-colors font-medium text-sm sm:text-base">Dashboard</Link>
              <Link to="/ong/animais" className="text-foreground hover:text-secondary transition-colors font-medium text-sm sm:text-base">Animais</Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors font-medium text-sm"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
