import {
  appointmentToPickerDate,
  calculateEndTime,
  formatDate,
  formatTime,
  formatTimezone,
  getCalendarDateParts,
  pickerDateToScheduledAt,
} from "./dateFormatting";

describe("date formatting utilities", () => {
  it("preserves the business calendar date across timezone boundaries", () => {
    expect(getCalendarDateParts("2026-01-15T02:30:00Z", "America/New_York")).toEqual({
      year: 2026,
      month: 1,
      day: 14,
    });
  });

  it("converts an API timestamp to picker wall-clock fields", () => {
    const pickerDate = appointmentToPickerDate("2026-01-15T02:30:00Z", "America/New_York");

    expect(pickerDate.getFullYear()).toBe(2026);
    expect(pickerDate.getMonth()).toBe(0);
    expect(pickerDate.getDate()).toBe(14);
    expect(pickerDate.getHours()).toBe(21);
    expect(pickerDate.getMinutes()).toBe(30);
  });

  it("serializes picker fields without adding an offset", () => {
    const pickerDate = new Date(2026, 0, 14, 21, 30);

    expect(pickerDateToScheduledAt(pickerDate)).toBe("2026-01-14T21:30");
  });

  it("calculates an end time from a duration", () => {
    expect(calculateEndTime("2026-01-15T17:30:00Z", 45).toISOString()).toBe(
      "2026-01-15T18:15:00.000Z"
    );
  });

  it("formats dates, times, and timezone labels", () => {
    expect(formatDate("2026-01-15T17:30:00Z", "America/New_York")).toBe("01/15/2026");
    expect(formatTime("2026-01-15T17:30:00Z", "America/New_York")).toBe("12:30 PM");
    expect(formatTimezone("America/Denver")).toBe("MST");
    expect(formatTimezone("Europe/London")).toBe("Europe/London");
  });
});
