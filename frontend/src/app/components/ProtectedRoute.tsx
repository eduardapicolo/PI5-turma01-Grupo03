import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  requireRole?: "ong" | "user";
}

export function ProtectedRoute({ children, requireRole }: Props) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (requireRole === "ong" && user.role !== "ong" && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate, requireRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-adopter-bg">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (requireRole === "ong" && user.role !== "ong" && user.role !== "admin") return null;

  return <>{children}</>;
}
