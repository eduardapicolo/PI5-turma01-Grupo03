import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth, QuestionnaireAnswers } from "../context/AuthContext";
import { Link } from "react-router";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "987417699236-lnfnbap1sdtlltjm0dqdbmrgr7mu2aba.apps.googleusercontent.com";

async function fetchRecomendacoes(answers: QuestionnaireAnswers, token: string) {
  const res = await fetch(`${API_URL}/recomendacao`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...answers, topN: 5 }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.recomendacoes ?? null;
}

export function LoginPage() {
  const [userType, setUserType] = useState<"adopter" | "ong">("adopter");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const { loginWithGoogle }     = useAuth();
  const navigate                = useNavigate();
  // Força re-render do botão Google após erro
  const [btnKey, setBtnKey]     = useState(0);
  const handleCredentialRef     = useRef<(r: { credential: string }) => void>();

  useEffect(() => {
    handleCredentialRef.current = handleCredential;
  });

  useEffect(() => {
    const clientId = GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError("Configuração do Google Login ausente: VITE_GOOGLE_CLIENT_ID não foi definida.");
      return;
    }

    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (r: { credential: string }) => handleCredentialRef.current?.(r),
      });
      const btn = document.getElementById("google-btn-container");
      if (btn) {
        btn.innerHTML = "";
        window.google?.accounts.id.renderButton(btn, {
          theme: "outline", size: "large", width: 360,
          text: "signin_with", logo_alignment: "left",
        });
      }
    };

    if (window.google) { init(); }
    else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = init;
      document.body.appendChild(s);
    }
  }, [userType, btnKey]);

  const handleCredential = async (response: { credential: string }) => {
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle(
        response.credential,
        userType === "ong" ? "ong" : "user"
      );

      if (loggedUser.role === "ong" || loggedUser.role === "admin") {
        navigate("/ong", { replace: true });
        return;
      }

      if (loggedUser.lastQuestionnaireAnswers?.tipo) {
        const storedToken = localStorage.getItem("petmatch_token") || "";
        const recs = await fetchRecomendacoes(
          loggedUser.lastQuestionnaireAnswers,
          storedToken
        );
        navigate("/matches", {
          replace: true,
          state: { recomendacoes: recs, tipo: loggedUser.lastQuestionnaireAnswers.tipo },
        });
      } else {
        navigate("/questionario", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao fazer login");
      // Re-renderiza o botão do Google (foi consumido pelo SDK após o clique)
      setBtnKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-adopter-bg via-white to-ong-bg">
      <Header variant="public" showNav={false} />

      <div className="container mx-auto px-6 py-20 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
          <div className="text-center mb-8">
            <img src="/LOGO_PIV.png" alt="Aumigos" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o início
            </Link>
            <h1 className="text-3xl font-bold mb-2">Bem-vindo!</h1>
            <p className="text-muted-foreground">Entre para encontrar seu pet ideal</p>
          </div>

          {/* Selector adotante / ONG */}
          <div className="flex gap-2 mb-8 bg-muted p-1 rounded-2xl">
            <button
              onClick={() => { setUserType("adopter"); setError(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                userType === "adopter"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sou Adotante
            </button>
            <button
              onClick={() => { setUserType("ong"); setError(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                userType === "ong"
                  ? "bg-secondary text-secondary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sou uma ONG
            </button>
          </div>

          <div className="space-y-4">
            {/* Botão Google — sempre visível; spinner sobreposto durante loading */}
            <div className="relative">
              <div
                id="google-btn-container"
                className={`w-full flex justify-center transition-opacity ${loading ? "opacity-40 pointer-events-none" : ""}`}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>

            {error && (
              <div className="text-center text-sm text-destructive bg-destructive/10 p-3 rounded-xl leading-relaxed">
                {error}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
