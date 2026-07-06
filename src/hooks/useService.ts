import { useEffect, useState } from "react";

import { apiFetch } from "@/api/client";
import type { Service } from "@/types/service";

export function useService(id: string | string[] | undefined) {
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || Array.isArray(id)) {
      setError("Service does not exist");
      setIsLoading(false);
      return;
    }

    apiFetch<Service>(`/api/v1/services/${id}`)
      .then(setService)
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load service"
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  return { service, error, isLoading };
}