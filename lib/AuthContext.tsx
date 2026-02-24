"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  isLoggedIn as checkLoggedIn,
  logout as storageLogout,
  getUser,
} from "@/lib/storage";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loggedIn: boolean;
  refresh: () => void;
  logout: () => void;
  setAuthenticated: () => void; // chama após login/register
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loggedIn: false,
  refresh: () => {},
  logout: () => {},
  setAuthenticated: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(() => {
    const logged = checkLoggedIn();
    const u = logged ? getUser() : null;
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Chamado imediatamente após login/register para evitar redirect falso no dashboard
  const setAuthenticated = useCallback(() => {
    const u = getUser();
    setUser(u);
    setLoading(false);
  }, []);

  function logout() {
    storageLogout();
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
