import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { apiFetch } from "@/api/client";
import type { Client } from "@/types/client";
import type { DashboardData } from "@/types/dashboard";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      apiFetch<DashboardData>("/api/v1/dashboard")
        .then((data) => setClients(data.clients))
        .catch((error) => {
          setError(
            error instanceof Error ? error.message : "Unable to load clients."
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [])
  );

  return { clients, error, isLoading };
}