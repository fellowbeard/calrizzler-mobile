import { useState } from "react";

import { apiFetch, ApiError } from "@/api/client";
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
      if (error instanceof ApiError) {
        const nameErrors = error.details?.name;

        if (nameErrors?.length) {
          setError(
            nameErrors
              .map((entry) => {
                const message =
                  typeof entry === "string" ? entry : entry.message;

                return message === "has already been taken"
                  ? "A resource with this name already exists."
                  : `Resource name ${message}.`;
              })
              .join(" ")
          );
        } else {
          setError(error.message);
        }
      } else {
        setError(
          error instanceof Error ? error.message : "Unable to create resource."
        );
      }

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return { createResource, error, isSaving };
}
