import { createContext, ReactNode, useEffect, useState } from "react";

import { apiFetch } from "@/api/client";
import type { Account } from "@/types/account";
import type { User } from "@/types/user";

import { getToken, saveToken, removeToken } from "./tokenStorage";

type AuthContextType = {
  token: string | null;
  user: User | null;
  account: Account | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccount: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadCurrentUser() {
    const currentUser = await apiFetch<User>("/api/v1/me");
    setUser(currentUser);
  }

  async function loadCurrentAccount() {
    const currentAccount = await apiFetch<Account>("/api/v1/account");
    setAccount(currentAccount);
  }

  async function loadCurrentSession() {
    await Promise.all([loadCurrentUser(), loadCurrentAccount()]);
  }

  async function refreshAccount() {
    await loadCurrentAccount();
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await getToken();

        if (storedToken) {
          setToken(storedToken);

          const [currentUser, currentAccount] = await Promise.all([
            apiFetch<User>("/api/v1/me"),
            apiFetch<Account>("/api/v1/account"),
          ]);

          setUser(currentUser);
          setAccount(currentAccount);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);

        await removeToken();
        setToken(null);
        setUser(null);
        setAccount(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function signIn(newToken: string) {
    try {
      await saveToken(newToken);
      setToken(newToken);

      await loadCurrentSession();
    } catch (error) {
      await removeToken();
      setToken(null);
      setUser(null);
      setAccount(null);
      throw error;
    }
  }

  async function signOut() {
    await removeToken();
    setToken(null);
    setUser(null);
    setAccount(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        account,
        isLoading,
        signIn,
        signOut,
        refreshAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
