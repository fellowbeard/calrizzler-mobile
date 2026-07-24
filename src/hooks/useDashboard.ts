import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../api/client";
import type { DashboardData } from "../types/dashboard";

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await apiFetch<DashboardData>("/api/v1/dashboard");

      setDashboard(data);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    error,
    isLoading,
    refetch: fetchDashboard,
  };
}