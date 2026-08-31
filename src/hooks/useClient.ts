import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../api/client";
import type { ClientDetail } from "../types/client";

export function useClient(id: string | string[] | undefined) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [error, setError] = useState("");

  const fetchClient = useCallback(async () => {
    if (!id || Array.isArray(id)) {
      setError("Invalid client.");
      return;
    }

    try {
      setError("");

      const data = await apiFetch<ClientDetail>(`/api/v1/clients/${id}`);

      setClient(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load client."
      );
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  return {
    client,
    error,
    refetch: fetchClient,
  };
}
