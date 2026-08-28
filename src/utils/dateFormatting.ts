type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export const TIMEZONE_OPTIONS = [
  { label: "EST", value: "America/New_York" },
  { label: "CST", value: "America/Chicago" },
  { label: "MST", value: "America/Denver" },
  { label: "PST", value: "America/Los_Angeles" },
  { label: "Arizona", value: "America/Phoenix" },
  { label: "HST", value: "Pacific/Honolulu" },
  { label: "AKST", value: "America/Anchorage" },
];

function getDatePartsInTimezone(
  dateString: string,
  timezone: string
): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(dateString));

  const values: Record<string, number> = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  });

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

export function formatDate(dateString: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatTime(dateString: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
}

export function calculateEndTime(
  startDateString: string,
  durationMinutes: number
) {
  const start = new Date(startDateString);

  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

export function getCalendarDateParts(dateString: string, timezone: string) {
  const parts = getDatePartsInTimezone(dateString, timezone);

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

/**
 * Converts an API timestamp such as:
 *
 * 2026-08-20T20:00:00Z
 *
 * into a Date whose LOCAL fields represent the business wall-clock
 * time, such as 2:00 PM for America/Denver.
 *
 * This is specifically for DateTimePicker.
 */
export function appointmentToPickerDate(dateString: string, timezone: string) {
  const parts = getDatePartsInTimezone(dateString, timezone);

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
    0
  );
}

/**
 * Gives DateTimePicker a sensible "now" value expressed as
 * the business's wall-clock time.
 */
export function currentTimeForPicker(timezone: string) {
  return appointmentToPickerDate(new Date().toISOString(), timezone);
}

/**
 * DateTimePicker gives us a Date using the phone's local fields.
 *
 * We intentionally send those wall-clock fields WITHOUT an offset.
 * Rails then interprets them using current_account.timezone.
 */
export function pickerDateToScheduledAt(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function formatPickerDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTimezone(timezone: string) {
  const timezoneNames: Record<string, string> = {
    "America/New_York": "EST",
    "America/Chicago": "CST",
    "America/Denver": "MST",
    "America/Los_Angeles": "PST",
    "America/Phoenix": "MST",
    "Pacific/Honolulu": "HST",
    "America/Anchorage": "AKST",
  };

  return timezoneNames[timezone] ?? timezone;
}
