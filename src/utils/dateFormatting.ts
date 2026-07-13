export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function calculateEndTime(
  startDateString: string,
  durationMinutes: number
) {
  const start = new Date(startDateString);

  const end = new Date(
    start.getTime() + durationMinutes * 60 * 1000
  );

  return end;
}