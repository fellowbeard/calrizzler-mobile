import { useState } from "react";
import { apiFetch, ApiError } from "@/api/client";
import type { ClientFormValues } from "@/components/forms/ClientForm";

export function useUpdateClient(id: string | string[] | undefined) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function updateClient(payload: ClientFormValues) {
    if (!id || Array.isArray(id)) {
      setError("Invalid client id.");
      return null;
    }

    setIsSaving(true);
    setError("");

    try {
      return await apiFetch(`/api/v1/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ client: payload }),
      });
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return { updateClient, error, isSaving };
}
