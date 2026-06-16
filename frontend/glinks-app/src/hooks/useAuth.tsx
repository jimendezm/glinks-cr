const login = async (
  username: string,
  password: string,
  remember: boolean,
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const json = await res.json();

    // Si es 500, mostrar mensaje genérico
    if (res.status === 500) {
      return { ok: false, error: "Error interno del servidor. Intente más tarde." };
    }

    if (!res.ok || !json?.success) {
      return { ok: false, error: json?.error ?? "Credenciales inválidas" };
    }

    const { token, user: apiUser } = json.data as {
      token: string;
      user: User;
    };

    const userWithName: User = {
      ...apiUser,
      name: apiUser.name || (apiUser as any).username,
    };

    setToken(token);
    setUser(userWithName);

    if (remember) {
      localStorage.setItem(KEY_TOKEN, token);
      localStorage.setItem(KEY_USER, JSON.stringify(userWithName));
    } else {
      sessionStorage.setItem(KEY_TOKEN, token);
      sessionStorage.setItem(KEY_USER, JSON.stringify(userWithName));
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de conexión con el servidor",
    };
  }
};