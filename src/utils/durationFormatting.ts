export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`;
  }

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} ${hours === 1 ? "hour" : "hours"} ${
    remainingMinutes
  } ${remainingMinutes === 1 ? "minute" : "minutes"}`;
}
