import { useState } from "react";

import { apiFetch, type ApiError } from "@/api/client";
import type { Appointment } from "@/types/appointment";

type CreateAppointmentInput = {
  client_id: number;
  resource_id?: number | null;
  scheduled_at: string;
  status: string;
  duration_minutes?: number;
  service_ids: number[];
};

type FieldErrors = Record<string, string[]>;

export function useCreateAppointment() {
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  async function createAppointment(input: CreateAppointmentInput) {
    setError("");
    setFieldErrors({});
    setIsSaving(true);

    try {
      return await apiFetch<Appointment>("/api/v1/appointments", {
        method: "POST",
        body: JSON.stringify({
          appointment: input,
        }),
      });
    } catch (error) {
      const apiError = error as ApiError;

      setError(apiError.message || "Unable to create appointment.");

      if (
        apiError.details &&
        typeof apiError.details === "object" &&
        !Array.isArray(apiError.details)
      ) {
        setFieldErrors(apiError.details as FieldErrors);
      }

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    createAppointment,
    error,
    fieldErrors,
    isSaving,
  };
}