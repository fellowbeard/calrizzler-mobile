import { useState } from "react";

import { apiFetch } from "@/api/client";
import type { Resource } from "@/types/resource";

type UpdateResourceInput = {
  name: string;
};

export function useUpdateResource(id: string | string[] | undefined) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  async function updateResource(values: UpdateResourceInput) {
    if (!id || Array.isArray(id)) {
      setError("Invalid resource id.");
      return null;
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const updatedResource = await apiFetch<Resource>(`/api/v1/resources/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          resource: values,
        }),
      });

      setResource(updatedResource);
      return updatedResource;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update resource."
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    resource,
    updateResource,
    error,
    isSaving,
  };
}