import { useState } from "react";

import { apiFetch } from "@/api/client";
import type { Appointment } from "@/types/appointment";

export type UpdateAppointmentInput = {
  client_id: number;
  resource_id: number;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  service_ids: number[];
};

export function useUpdateAppointment(id: string | string[] | undefined) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  async function updateAppointment(values: UpdateAppointmentInput) {
    if (!id || Array.isArray(id)) {
      setError("Invalid appointment id.");
      return null;
    }

    setIsSaving(true);
    setError(undefined);

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
      setError(
        err instanceof Error ? err.message : "Could not update appointment."
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    appointment,
    updateAppointment,
    error,
    isSaving,
  };
}