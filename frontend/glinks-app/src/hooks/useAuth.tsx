import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/models";
import { storage } from "@/services/storage";
import { setToken, getToken } from "@/services/httpClient";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (
    username: string,
    password: string,
    remember: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY_USER = "erp_session";
const KEY_TOKEN = "erp_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al montar
  useEffect(() => {
    const savedToken =
      localStorage.getItem(KEY_TOKEN) ?? sessionStorage.getItem(KEY_TOKEN);
    const savedUser = storage.get<User | null>(KEY_USER, null);

    if (!savedToken || !savedUser) {
      setLoading(false);
      return;
    }

    // Validar que el token sigue vigente
    setToken(savedToken);

    fetch(
      `${(import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "http://localhost:3000/api"}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Token inválido");
        return res.json();
      })
      .then((json) => {
        if (json.success) {
          setUser(savedUser);
        } else {
          // Limpiar sesión inválida
          setToken(null);
          localStorage.removeItem(KEY_TOKEN);
          localStorage.removeItem(KEY_USER);
          sessionStorage.removeItem(KEY_TOKEN);
          sessionStorage.removeItem(KEY_USER);
        }
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem(KEY_TOKEN);
        localStorage.removeItem(KEY_USER);
        sessionStorage.removeItem(KEY_TOKEN);
        sessionStorage.removeItem(KEY_USER);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    username: string,
    password: string,
    remember: boolean,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const baseUrl =
        (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ??
        "http://localhost:3000/api";

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (!json.success) {
        return { ok: false, error: json.error ?? "Credenciales inválidas" };
      }

      const { token, user: apiUser } = json.data as {
        token: string;
        user: User;
      };

      // Guardar token
      setToken(token);
      if (remember) {
        localStorage.setItem(KEY_TOKEN, token);
      } else {
        sessionStorage.setItem(KEY_TOKEN, token);
      }

      // Guardar usuario
      setUser(apiUser);
      if (remember) {
        storage.set(KEY_USER, apiUser);
      } else {
        sessionStorage.setItem(KEY_USER, JSON.stringify(apiUser));
      }

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Error de conexión con el servidor",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_USER);
    sessionStorage.removeItem(KEY_TOKEN);
    sessionStorage.removeItem(KEY_USER);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
