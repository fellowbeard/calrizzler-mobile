import { useEffect, useState } from "react";

import { apiFetch } from "../api/client";
import type { DashboardData } from "../types/dashboard";

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardData>("/api/v1/dashboard")
      .then(setDashboard)
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return {
    dashboard,
    error,
    isLoading,
  };
}