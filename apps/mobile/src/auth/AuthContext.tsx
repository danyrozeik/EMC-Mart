import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoginInput, RegisterCustomerInput } from "@rti/shared";
import { api, clearAccessToken, loadPersistedAccessToken, persistAccessToken } from "../api/client";

type AuthStatus = "loading" | "signed-out" | "signed-in";

interface AuthContextValue {
  status: AuthStatus;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterCustomerInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    (async () => {
      const token = await loadPersistedAccessToken();
      if (!token) {
        setStatus("signed-out");
        return;
      }
      try {
        await api.me();
        setStatus("signed-in");
      } catch {
        await clearAccessToken();
        setStatus("signed-out");
      }
    })();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await api.login(input);
    await persistAccessToken(result.accessToken);
    setStatus("signed-in");
  }, []);

  const register = useCallback(async (input: RegisterCustomerInput) => {
    const result = await api.register(input);
    await persistAccessToken(result.accessToken);
    setStatus("signed-in");
  }, []);

  const logout = useCallback(async () => {
    await clearAccessToken();
    setStatus("signed-out");
  }, []);

  const value = useMemo(() => ({ status, login, register, logout }), [status, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
