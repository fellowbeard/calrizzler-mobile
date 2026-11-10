import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { apiFetch } from "@/api/client";
import type { Client } from "@/types/client";

export function useClients(search = "") {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const query = search ? `?search=${encodeURIComponent(search)}` : "";

      apiFetch<Client[]>(`/api/v1/clients${query}`)
        .then((data) => {
          if (!active) return;

          setClients(data);
          setError("");
        })
        .catch((error) => {
          if (!active) return;

          setClients([]);
          setError(
            error instanceof Error ? error.message : "Unable to load clients."
          );
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [search])
  );

  return { clients, error, isLoading };
}
