import { apiFetch } from "@/api/client";

type AvailabilityResponse = {
  slots: string[];
};

export async function fetchAvailability({
  date,
  durationMinutes,
  resourceId,
}: {
  date: string;
  durationMinutes: number;
  resourceId: number;
}): Promise<string[]> {
  const params = new URLSearchParams({
    date,
    duration_minutes: String(durationMinutes),
    resource_id: String(resourceId),
  });

  const response = await apiFetch<AvailabilityResponse>(
    `/api/v1/availability?${params.toString()}`
  );

  return response.slots;
}
