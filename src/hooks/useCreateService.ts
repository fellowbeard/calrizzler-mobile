import { useState } from "react";

import { apiFetch, ApiError } from "@/api/client";
import type { Service } from "@/types/service";

type CreateServiceInput = {
  title: string;
  price: string;
  duration_minutes: string;
  description: string;
};

export function useCreateService() {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function createService(input: CreateServiceInput) {
    setError("");
    setIsSaving(true);

    try {
      return await apiFetch<Service>("/api/v1/services", {
        method: "POST",
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
          error instanceof Error ? error.message : "Unable to create service."
        );
      }

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    createService,
    error,
    isSaving,
  };
}
