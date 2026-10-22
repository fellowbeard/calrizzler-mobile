import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { apiFetch } from "@/api/client";
import type { Service } from "@/types/service";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [archivedServices, setArchivedServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refreshServices = useCallback(async (includeArchived = false) => {
    try {
      setError("");

      const active = await apiFetch<Service[]>("/api/v1/services");
      setServices(active);

      if (includeArchived) {
        const archived = await apiFetch<Service[]>("/api/v1/services/archived");
        setArchivedServices(archived);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load services."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      refreshServices();
    }, [refreshServices])
  );

  return {
    services,
    archivedServices,
    error,
    isLoading,
    refreshServices,
  };
}
