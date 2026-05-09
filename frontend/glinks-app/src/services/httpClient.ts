const BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "http://localhost:3000/api";

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

export function getToken(): string | null {
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok && res.status === 401) {
    // Token expired or invalid — clear it so the UI can redirect to login
    token = null;
    throw new Error("Sesión expirada. Inicie sesión nuevamente.");
  }

  const json = await res.json().catch(() => null);

  if (!json || !json.success) {
    const msg =
      json?.error ??
      json?.message ??
      `Error del servidor (${res.status})`;
    throw new Error(msg);
  }

  return json.data as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
