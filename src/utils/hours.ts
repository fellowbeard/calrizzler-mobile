// Shared helpers for business hours and provider working hours.
// The API returns times like "2000-01-01T09:00:00.000Z"; the UI works with "HH:MM".

export type TimeRange = {
  opens_at: string;
  closes_at: string;
};

export const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

export const DEFAULT_RANGE: TimeRange = {
  opens_at: "09:00",
  closes_at: "17:00",
};

export function normalizeTime(value: string | null | undefined) {
  const match = String(value ?? "").match(/(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "";
}

export function formatTime(value: string | null | undefined) {
  const normalized = normalizeTime(value);

  if (!normalized) return "";

  const [hour, minute] = normalized.split(":").map(Number);

  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

// Every 15 minutes across the day, for pickers.
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const value = `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`;

  return { value, label: formatTime(value) };
});

type RangeLike = {
  opens_at: string | null;
  closes_at: string | null;
};

export function sortRanges<T extends RangeLike>(ranges: T[]) {
  return [...ranges].sort((a, b) => normalizeTime(a.opens_at).localeCompare(normalizeTime(b.opens_at)));
}

export function formatRanges(ranges: RangeLike[]) {
  return sortRanges(ranges)
    .map((range) => `${formatTime(range.opens_at)} – ${formatTime(range.closes_at)}`)
    .join(", ");
}

// Returns a message describing the first problem in one day's ranges, or null if they are valid.
export function validateRanges(ranges: TimeRange[]) {
  if (ranges.length === 0) return "Add at least one time range.";

  const sorted = sortRanges(ranges);

  for (let index = 0; index < sorted.length; index += 1) {
    const range = sorted[index];

    if (!range.opens_at || !range.closes_at) return "Select both opening and closing times.";
    if (range.opens_at >= range.closes_at) return "Closing time must be after opening time.";
    if (index > 0 && sorted[index - 1].closes_at > range.opens_at) return "Working hours cannot overlap.";
  }

  return null;
}
