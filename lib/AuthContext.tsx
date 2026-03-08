"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, getToken, setToken, removeToken } from "@/lib/api";
import type { ApiUser } from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  loading: boolean;
  loggedIn: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
  setAuthenticated: (user: ApiUser, token: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loggedIn: false,
  refresh: async () => {},
  logout: () => {},
  setAuthenticated: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      // Token inválido ou expirado
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Chamado imediatamente após login/register
  const setAuthenticated = useCallback((user: ApiUser, token: string) => {
    setToken(token);
    setUser(user);
    setLoading(false);
  }, []);

  function logout() {
    removeToken();
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loggedIn: !!user,
        refresh,
        logout,
        setAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Guard: redireciona para /login se não autenticado
export function useRequireAuth() {
  const { loading, loggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !loggedIn) router.replace("/login");
  }, [loading, loggedIn, router]);

  return { loading, loggedIn };
}
