import { ApiError, errorMessage } from "@/api/client";
import { formatRanges, formatTime, normalizeTime, validateRanges } from "@/utils/hours";

describe("hours helpers", () => {
  it("normalizes API timestamps to HH:MM", () => {
    expect(normalizeTime("2000-01-01T09:30:00.000Z")).toBe("09:30");
    expect(normalizeTime(null)).toBe("");
  });

  it("formats times for display", () => {
    expect(formatTime("00:15")).toBe("12:15 AM");
    expect(formatTime("13:05")).toBe("1:05 PM");
  });

  it("formats ranges in start-time order", () => {
    expect(
      formatRanges([
        { opens_at: "13:00", closes_at: "17:00" },
        { opens_at: "09:00", closes_at: "12:00" },
      ])
    ).toBe("9:00 AM – 12:00 PM, 1:00 PM – 5:00 PM");
  });

  it("reports the first problem in a day's ranges", () => {
    expect(validateRanges([])).toBe("Add at least one time range.");
    expect(
      validateRanges([
        { opens_at: "09:00", closes_at: "12:00" },
        { opens_at: "11:00", closes_at: "14:00" },
      ])
    ).toBe("Working hours cannot overlap.");
    expect(validateRanges([{ opens_at: "09:00", closes_at: "17:00" }])).toBeNull();
  });
});

describe("errorMessage", () => {
  it("joins validation messages from the API", () => {
    const error = new ApiError(422, "validation_failed", "Validation failed.", {
      password: [{ type: "too_short", message: "Password is too short" }],
    });

    expect(errorMessage(error)).toBe("Password is too short");
  });

  it("falls back to the error message, then the fallback", () => {
    expect(errorMessage(new ApiError(404, "not_found", "Client not found."))).toBe("Client not found.");
    expect(errorMessage("weird", "Try again.")).toBe("Try again.");
  });
});
