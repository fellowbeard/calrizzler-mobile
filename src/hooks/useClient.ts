import { useEffect, useState } from "react";

import { apiFetch } from "../api/client";
import type { ClientDetail } from "../types/client";

export function useClient(id: string | string[] | undefined) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || Array.isArray(id)) {
      setError("Invalid client.");
      return;
    }

    apiFetch<ClientDetail>(`/api/v1/clients/${id}`)
      .then(setClient)
      .catch((error) => {
        setError(error instanceof Error ? error.message : "Unable to load client.");
      });
  }, [id]);

  return { client, error };
}