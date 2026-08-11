import { useState } from "react";

import {
  ApiError,
  apiFetch,
  type ValidationDetails,
} from "@/api/client";
import type { Appointment } from "@/types/appointment";

type CreateAppointmentInput = {
  client_id: number | null;
  resource_id: number | null;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  duration_overridden: boolean;
  service_ids: number[];
};

export function useCreateAppointment() {
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationDetails>({});
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
      if (error instanceof ApiError) {
        setError(error.message);
        setFieldErrors(error.details ?? {});
      } else {
        setError("Unable to create appointment.");
        setFieldErrors({});
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