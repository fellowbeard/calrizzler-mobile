import { useState } from "react";

import { ApiError, apiFetch, type ValidationDetails } from "@/api/client";
import type { Appointment } from "@/types/appointment";

export type UpdateAppointmentInput = {
  client_id: number | null;
  resource_id: number | null;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  duration_overridden: boolean;
  service_ids: number[];
};

export function useUpdateAppointment(id: string | string[] | undefined) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<ValidationDetails>({});
  const [isSaving, setIsSaving] = useState(false);

  async function updateAppointment(values: UpdateAppointmentInput) {
    if (!id || Array.isArray(id)) {
      setError("Invalid appointment id.");
      setFieldErrors({});
      return null;
    }

    setIsSaving(true);
    setError(undefined);
    setFieldErrors({});

    try {
      const updatedAppointment = await apiFetch<Appointment>(
        `/api/v1/appointments/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            appointment: values,
          }),
        }
      );

      setAppointment(updatedAppointment);
      return updatedAppointment;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.details ?? {});
      } else {
        setError(
          err instanceof Error ? err.message : "Could not update appointment."
        );
        setFieldErrors({});
      }

      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    appointment,
    updateAppointment,
    error,
    fieldErrors,
    isSaving,
  };
}
