import { useState } from "react";

import { apiFetch } from "@/api/client";
import type { Resource } from "@/types/resource";

type CreateResourceInput = {
  name: string;
};

export function useCreateResource() {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function createResource(input: CreateResourceInput) {
    setError("");
    setIsSaving(true);

    try {
      return await apiFetch<Resource>("/api/v1/resources", {
        method: "POST",
        body: JSON.stringify({
          resource: input,
        }),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create resource.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return { createResource, error, isSaving };
}