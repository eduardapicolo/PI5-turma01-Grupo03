import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface QuestionnaireAnswers {
  tipo: string;
  porte: string;
  idade: string;
  local: string;
  cuidados: string;
  sociavel: string;
  sexo: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "ong" | "admin";
  ongName?: string;
  telefone?: string;
  localizacao?: string;
  lastQuestionnaireAnswers?: QuestionnaireAnswers | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithGoogle: (credential: string, role?: "user" | "ong") => Promise<User>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  isOng: boolean;
  hasAnsweredQuestionnaire: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [token, setToken]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("petmatch_token");
    const storedUser  = localStorage.getItem("petmatch_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("petmatch_token");
        localStorage.removeItem("petmatch_user");
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async (
    credential: string,
    role: "user" | "ong" = "user"
  ): Promise<User> => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, role }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Falha no login com Google");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("petmatch_token", data.token);
    localStorage.setItem("petmatch_user", JSON.stringify(data.user));
    return data.user as User;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("petmatch_token");
    localStorage.removeItem("petmatch_user");
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("petmatch_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithGoogle,
        logout,
        updateUser,
        isOng: user?.role === "ong" || user?.role === "admin",
        hasAnsweredQuestionnaire: !!user?.lastQuestionnaireAnswers?.tipo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
