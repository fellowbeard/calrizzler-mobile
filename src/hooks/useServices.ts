import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { apiFetch } from "@/api/client";
import type { Service } from "@/types/service";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      apiFetch<Service[]>("/api/v1/services")
        .then(setServices)
        .catch((error) => {
          setError(
            error instanceof Error ? error.message : "Unable to load services."
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [])
  );

  return { services, error, isLoading };
}