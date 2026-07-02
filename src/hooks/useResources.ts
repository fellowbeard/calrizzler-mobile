import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { apiFetch } from "@/api/client";
import type { Resource } from "@/types/resource";

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      apiFetch<Resource[]>("/api/v1/resources")
        .then(setResources)
        .catch((error) => {
          setError(
            error instanceof Error ? error.message : "Unable to load resources."
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [])
  );

  return { resources, error, isLoading };
}