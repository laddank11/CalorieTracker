"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

const PUBLIC_PATHS = ["/login", "/signup"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      let res = await fetch("/api/auth/me");
      // Retry once on transient failure before giving up
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch("/api/auth/me");
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (!PUBLIC_PATHS.includes(pathname)) router.push("/login");
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
