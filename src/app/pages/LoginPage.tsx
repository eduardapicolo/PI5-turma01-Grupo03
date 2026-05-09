import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { PawPrint } from "lucide-react";

export function LoginPage() {
  const [userType, setUserType] = useState<'adopter' | 'ong'>('adopter');
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    if (userType === 'adopter') {
      navigate('/questionario');
    } else {
      navigate('/ong');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg via-white to-ong-bg">
      <Header variant="public" showNav={false} />

      <div className="container mx-auto px-6 py-20 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-primary text-primary-foreground w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PawPrint className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Bem-vindo!</h1>
            <p className="text-muted-foreground">Entre para encontrar seu pet ideal</p>
          </div>

          <div className="flex gap-2 mb-8 bg-muted p-1 rounded-2xl">
            <button
              onClick={() => setUserType('adopter')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                userType === 'adopter'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sou Adotante
            </button>
            <button
              onClick={() => setUserType('ong')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                userType === 'ong'
                  ? 'bg-secondary text-secondary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sou uma ONG
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 px-6 bg-white border-2 border-border rounded-2xl font-semibold hover:border-primary transition-all flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </button>

            <div className="text-center text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </div>
          </div>

          <div className="mt-8 p-6 bg-adopter-bg rounded-2xl">
            {userType === 'adopter' ? (
              <div>
                <h3 className="font-semibold mb-2 text-sm">Como Adotante:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Encontre pets compatíveis com você</li>
                  <li>✓ Sistema de Match personalizado</li>
                  <li>✓ Contato direto com ONGs</li>
                </ul>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-2 text-sm">Como ONG:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Cadastre e gerencie animais</li>
                  <li>✓ Acompanhe interessados</li>
                  <li>✓ Facilitamos a adoção responsável</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
