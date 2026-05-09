import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "./AppLayout";
import { Loader2 } from "lucide-react";

export function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // Mientras se valida el token al montar, mostrar un spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  return <AppLayout>{children}</AppLayout>;
}
