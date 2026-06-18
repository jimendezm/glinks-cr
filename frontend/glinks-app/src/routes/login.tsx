import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Network, Loader2, Eye, EyeOff } from "lucide-react";
import { showError, showToast } from "@/lib/swal";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Activar animación al montar el componente
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      showError("Por favor ingrese usuario y contraseña", "Campos requeridos");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const result = await login(username, password, remember);
      
      if (!result.ok) {
        let errorMsg = result.error ?? "Credenciales inválidas";
        
        if (errorMsg.includes("12") || errorMsg.toLowerCase().includes("length")) {
          errorMsg = "La contraseña debe tener al menos 12 caracteres";
        } else if (errorMsg.includes("invalid") || errorMsg.includes("credencial")) {
          errorMsg = "Usuario o contraseña incorrectos";
        } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
          errorMsg = "Error de conexión con el servidor. Verifique su internet.";
        } else if (errorMsg.includes("500") || errorMsg.includes("internal")) {
          errorMsg = "Error interno del servidor. Intente más tarde.";
        }
        
        showError(errorMsg, "Error de autenticación");
        setError(errorMsg);
      } else {
        showToast("Bienvenido al sistema", "success");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error de conexión con el servidor";
      showError(errorMessage, "Error de conexión");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 overflow-hidden">
      <div 
        className={`
          w-full max-w-md transition-all duration-700 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <Card className="w-full p-8 shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">GLinks CR</h1>
              <p className="text-sm text-muted-foreground">Sistema de gestión</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
                autoFocus
                placeholder="Ingrese su usuario"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="Ingrese su contraseña (mínimo 12 caracteres)"
                  className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(!!checked)}
                disabled={loading}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none">
                Recordarme
              </Label>
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 animate-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]" 
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}