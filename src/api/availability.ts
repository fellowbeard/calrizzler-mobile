import { apiFetch } from "@/api/client";

type AvailabilityResponse = {
  slots: string[];
  candidate_slots: string[];
};

export async function fetchAvailability({
  date,
  durationMinutes,
  resourceId,
}: {
  date: string;
  durationMinutes: number;
  resourceId: number;
}): Promise<AvailabilityResponse> {
  const params = new URLSearchParams({
    date,
    duration_minutes: String(durationMinutes),
    resource_id: String(resourceId),
  });

  return apiFetch<AvailabilityResponse>(
    `/api/v1/availability?${params.toString()}`
  );
}
