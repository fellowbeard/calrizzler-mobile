import { useState } from "react";

import { apiFetch, ApiError } from "@/api/client";
import type { Service } from "@/types/service";

type UpdateServiceInput = {
  title: string;
  price: string;
  duration_minutes: string;
  description: string;
};

export function useUpdateService(id: string | string[] | undefined) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function updateService(input: UpdateServiceInput) {
    if (!id || Array.isArray(id)) {
      setError("Invalid service id.");
      return null;
    }

    setError("");
    setIsSaving(true);

    try {
      return await apiFetch<Service>(`/api/v1/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          service: {
            title: input.title,
            price: Number(input.price),
            duration_minutes: Number(input.duration_minutes),
            description: input.description,
          },
        }),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const titleErrors = error.details?.title;

        if (titleErrors?.length) {
          setError(
            titleErrors
              .map(({ message }) => {
                if (message === "has already been taken") {
                  return "A service with that name already exists.";
                }

                if (message === "can't be blank") {
                  return "Service name can't be blank.";
                }

                return `Service name ${message}.`;
              })
              .join(" ")
          );
        } else {
          setError(error.message);
        }
      } else {
        setError(
          error instanceof Error ? error.message : "Unable to update service."
        );
      }

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    updateService,
    error,
    isSaving,
  };
}
