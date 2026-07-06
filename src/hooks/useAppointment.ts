import { useEffect, useState } from "react";

import { apiFetch } from "@/api/client";
import type { Appointment } from "@/types/appointment";

export function useAppointment(id: string | string[] | undefined) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || Array.isArray(id)) {
      setError("Invalid appointment.");
      setIsLoading(false);
      return;
    }

    apiFetch<Appointment>(`/api/v1/appointments/${id}`)
      .then(setAppointment)
      .catch((error) => {
        setError(
          error instanceof Error ? error.message : "Unable to load appointment."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  return { appointment, error, isLoading };
}