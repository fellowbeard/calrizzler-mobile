import { Redirect } from "expo-router";

import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/auth/useAuth";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Checking login..." />;
  }

  if (!token) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}