import { Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, Wrench, Package, Receipt, LogOut, Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSync } from "@/hooks/useSync";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, type ReactNode, useEffect } from "react";
import type { Role } from "@/models";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: Role[];
}

const allItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["admin"] },
  { to: "/clientes", label: "Clientes", icon: Users, allowedRoles: ["admin", "tecnico"] },
  { to: "/mantenimiento", label: "Mantenimiento", icon: Wrench, allowedRoles: ["admin", "tecnico"] },
  { to: "/inventario", label: "Inventario", icon: Package, allowedRoles: ["admin"] },
  { to: "/facturacion", label: "Facturación", icon: Receipt, allowedRoles: ["admin"] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing, forceSync } = useSync();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Si es técnico y está en Dashboard, redirigir a Clientes
  if (user?.role === "tecnico" && location.pathname === "/dashboard") {
    return <Navigate to="/clientes" replace />;
  }

  const items = allItems.filter((item) => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  const displayName = user?.name || user?.username || "Usuario";
  const roleLabel = user?.role === "admin" ? "Administrador" : "Técnico";

  const toggleMenu = () => {
    if (open) {
      setIsAnimating(true);
      setTimeout(() => {
        setOpen(false);
        setIsAnimating(false);
      }, 300);
    } else {
      setOpen(true);
    }
  };

  const closeMenu = () => {
    if (open) {
      setIsAnimating(true);
      setTimeout(() => {
        setOpen(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Overlay con animación */}
      {(open || isAnimating) && (
        <div
          className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMenu}
        />
      )}

      {/* Sidebar con animación de deslizamiento */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72 bg-card border-r border-border flex flex-col h-screen
          transition-all duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:w-64
          shadow-2xl md:shadow-none
        `}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">GLinks CR</h1>
              <p className="text-xs text-muted-foreground">Limón, CR</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={closeMenu}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {items.map((it, index) => {
              const active = location.pathname.startsWith(it.to);
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      closeMenu();
                    }
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200
                    ${active 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'hover:bg-accent text-foreground hover:translate-x-1'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-primary-foreground' : ''}`} />
                  {it.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border bg-card/50">
          <div className="text-sm font-medium truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground mb-3 capitalize">{roleLabel}</div>
          
          <div className="mb-3 p-2.5 rounded-md bg-muted/50 transition-all duration-200 hover:bg-muted/70">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-600 animate-pulse" />
                    <span className="text-green-600 font-medium">En línea</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-destructive" />
                    <span className="text-destructive font-medium">Sin conexión</span>
                  </>
                )}
              </div>
              {pendingCount > 0 && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  <CloudOff className="h-3 w-3 mr-1" />
                  {pendingCount} pendiente(s)
                </Badge>
              )}
              {isSyncing && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </div>
            {!isOnline && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Los datos se guardarán localmente y se sincronizarán al recuperar conexión.
              </p>
            )}
            {pendingCount > 0 && isOnline && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-xs h-8 transition-all duration-200 hover:bg-primary/10"
                onClick={forceSync}
                disabled={isSyncing}
              >
                <Cloud className="h-3 w-3 mr-1.5" />
                Sincronizar ahora
              </Button>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Salir
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 hover:bg-accent transition-all duration-200"
              onClick={toggleMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="md:hidden text-sm font-semibold">GLinks CR</span>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            {!isOnline && (
              <Badge variant="destructive" className="gap-1 md:hidden text-xs animate-pulse">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <CloudOff className="h-3 w-3" />
                {pendingCount}
              </Badge>
            )}
            <Badge variant={isOnline ? "default" : "destructive"} className="gap-1.5 hidden md:flex text-xs">
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Sin conexión</span>
                </>
              )}
            </Badge>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}