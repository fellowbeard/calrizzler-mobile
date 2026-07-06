import {
  createContext,
  ReactNode,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "@/api/client";
import type { User } from "@/types/user";

import {
  getToken,
  saveToken,
  removeToken,
} from "./tokenStorage";

type AuthContextType = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(
  null
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadCurrentUser() {
    const currentUser = await apiFetch<User>("/api/v1/me");
    setUser(currentUser);
  }
  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await getToken();

        if (storedToken) {
          setToken(storedToken);
          await loadCurrentUser();
        }
      } catch (error) {
        console.error("Failed to load token:", error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function signIn(newToken: string) {
    await saveToken(newToken);
    setToken(newToken);

    await loadCurrentUser();
  }

  async function signOut() {
    await removeToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}