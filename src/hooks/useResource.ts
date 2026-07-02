import { useEffect, useState } from "react";

import { apiFetch } from "@/api/client";
import type { Resource } from "@/types/resource";

export function useResource(id: string | string[] | undefined) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || Array.isArray(id)) {
      setError("Invalid resource.");
      setIsLoading(false);
      return;
    }

    apiFetch<Resource>(`/api/v1/resources/${id}`)
      .then(setResource)
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load resource."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  return { resource, error, isLoading };
}