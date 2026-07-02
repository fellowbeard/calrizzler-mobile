import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { apiFetch } from "@/api/client";
import type { Appointment } from "@/types/appointment";

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      apiFetch<Appointment[]>("/api/v1/appointments")
        .then(setAppointments)
        .catch((error) => {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load appointments."
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [])
  );

  return { appointments, error, isLoading };
}