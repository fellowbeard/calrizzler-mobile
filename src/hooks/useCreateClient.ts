import { useState } from "react";

import { apiFetch } from "@/api/client";
import type { Client } from "@/types/client";

type CreateClientInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export function useCreateClient() {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function createClient(input: CreateClientInput) {
    setError("");
    setIsSaving(true);

    try {
      return await apiFetch<Client>("/api/v1/clients", {
        method: "POST",
        body: JSON.stringify({
          client: input,
        }),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create client.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return { createClient, error, isSaving };
}