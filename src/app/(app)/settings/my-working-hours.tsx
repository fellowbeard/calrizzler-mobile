import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";

type WorkingHour = {
  id: number;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed?: boolean;
};

type TimeRange = {
  opens_at: string;
  closes_at: string;
};

type DayMode = "inherit" | "custom" | "closed";

type ScheduleDay = {
  label: string;
  value: number;
  mode: DayMode;
  ranges: TimeRange[];
};

type ScheduleError = {
  day: number;
  message: string;
};

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

const DEFAULT_RANGE: TimeRange = {
  opens_at: "09:00",
  closes_at: "17:00",
};

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;

  return {
    value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    label: `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${
      hour < 12 ? "AM" : "PM"
    }`,
  };
});

function normalizeTime(value: string | null) {
  const match = String(value ?? "").match(/(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "";
}

function formatTime(value: string | null) {
  const normalized = normalizeTime(value);
  const option = TIME_OPTIONS.find((item) => item.value === normalized);

  return option?.label ?? normalized;
}

function emptySchedule(): ScheduleDay[] {
  return DAYS.map((day) => ({
    ...day,
    mode: "inherit",
    ranges: [],
  }));
}

function buildSchedule(records: WorkingHour[]): ScheduleDay[] {
  return DAYS.map((day) => {
    const dayRecords = records.filter(
      (record) => Number(record.day_of_week) === day.value
    );

    if (dayRecords.some((record) => record.is_closed)) {
      return {
        ...day,
        mode: "closed",
        ranges: [],
      };
    }

    if (dayRecords.length === 0) {
      return {
        ...day,
        mode: "inherit",
        ranges: [],
      };
    }

    return {
      ...day,
      mode: "custom",
      ranges: dayRecords
        .map((record) => ({
          opens_at: normalizeTime(record.opens_at),
          closes_at: normalizeTime(record.closes_at),
        }))
        .sort((a, b) => a.opens_at.localeCompare(b.opens_at)),
    };
  });
}

function validateSchedule(schedule: ScheduleDay[]): ScheduleError | null {
  for (const day of schedule) {
    if (day.mode !== "custom") continue;

    if (day.ranges.length === 0) {
      return {
        day: day.value,
        message: `${day.label}: Add at least one time range.`,
      };
    }

    const ranges = [...day.ranges].sort((a, b) =>
      a.opens_at.localeCompare(b.opens_at)
    );

    for (let index = 0; index < ranges.length; index++) {
      const range = ranges[index];

      if (!range.opens_at || !range.closes_at) {
        return {
          day: day.value,
          message: `${day.label}: Select opening and closing times.`,
        };
      }

      if (range.opens_at >= range.closes_at) {
        return {
          day: day.value,
          message: `${day.label}: Closing time must be after opening time.`,
        };
      }

      if (index > 0 && ranges[index - 1].closes_at > range.opens_at) {
        return {
          day: day.value,
          message: `${day.label}: Working hours cannot overlap.`,
        };
      }
    }
  }

  return null;
}

function sameDay(day: ScheduleDay, records: WorkingHour[]) {
  const saved = buildSchedule(records).find((item) => item.value === day.value);

  if (!saved || saved.mode !== day.mode) return false;

  if (day.mode !== "custom") return true;

  const desiredRanges = [...day.ranges].sort((a, b) =>
    a.opens_at.localeCompare(b.opens_at)
  );

  return (
    saved.ranges.length === desiredRanges.length &&
    saved.ranges.every(
      (range, index) =>
        range.opens_at === desiredRanges[index].opens_at &&
        range.closes_at === desiredRanges[index].closes_at
    )
  );
}

function WeeklyScheduleSummary({
  schedule,
  businessHours,
}: {
  schedule: ScheduleDay[];
  businessHours: WorkingHour[];
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Current Weekly Schedule
      </Text>

      {schedule.map((day) => {
        const inheritedRanges = businessHours
          .filter((record) => Number(record.day_of_week) === day.value)
          .sort((a, b) => String(a.opens_at).localeCompare(String(b.opens_at)));

        let description: string;

        if (day.mode === "closed") {
          description = "Not Working";
        } else if (day.mode === "inherit") {
          description =
            inheritedRanges.length === 0
              ? "Closed (Business Hours)"
              : inheritedRanges
                  .map(
                    (range) =>
                      `${formatTime(range.opens_at)} – ${formatTime(range.closes_at)}`
                  )
                  .join(", ") + " (Business Hours)";
        } else {
          description = day.ranges
            .map(
              (range) =>
                `${formatTime(range.opens_at)} – ${formatTime(range.closes_at)}`
            )
            .join(", ");
        }

        return (
          <View
            key={day.value}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text style={{ fontWeight: "600", width: 100 }}>{day.label}</Text>

            <Text style={{ flex: 1, textAlign: "right" }}>{description}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function MyWorkingHoursScreen() {
  const { user } = useAuth();

  const canEdit = user?.role === "owner" || user?.role === "staff";

  const [schedule, setSchedule] = useState(emptySchedule);
  const [businessHours, setBusinessHours] = useState<WorkingHour[]>([]);
  const [savedRecords, setSavedRecords] = useState<WorkingHour[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorDay, setErrorDay] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const dayPositions = useRef<Record<number, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;

      let active = true;

      async function loadHours() {
        setIsLoading(true);
        setError("");

        try {
          const [personal, business] = await Promise.all([
            apiFetch<WorkingHour[]>(
              `/api/v1/users/${user!.id}/user_working_hours`
            ),
            apiFetch<WorkingHour[]>("/api/v1/working_hours"),
          ]);

          if (!active) return;

          setSavedRecords(personal);
          setBusinessHours(business);
          setSchedule(buildSchedule(personal));
        } catch (requestError: any) {
          if (active) {
            setError(requestError.message);
          }
        } finally {
          if (active) setIsLoading(false);
        }
      }

      loadHours();

      return () => {
        active = false;
      };
    }, [user])
  );

  function clearError() {
    setError("");
    setErrorDay(null);
  }

  function updateDay(
    dayIndex: number,
    updater: (day: ScheduleDay) => ScheduleDay
  ) {
    clearError();

    setSchedule((previous) =>
      previous.map((day, index) => (index === dayIndex ? updater(day) : day))
    );
  }

  function changeMode(dayIndex: number, mode: DayMode) {
    updateDay(dayIndex, (day) => {
      if (mode === "custom") {
        const businessRanges = businessHours
          .filter((record) => Number(record.day_of_week) === day.value)
          .map((record) => ({
            opens_at: normalizeTime(record.opens_at),
            closes_at: normalizeTime(record.closes_at),
          }));

        return {
          ...day,
          mode,
          ranges:
            day.ranges.length > 0
              ? day.ranges
              : businessRanges.length > 0
                ? businessRanges
                : [{ ...DEFAULT_RANGE }],
        };
      }

      return {
        ...day,
        mode,
      };
    });
  }

  function updateRange(
    dayIndex: number,
    rangeIndex: number,
    field: "opens_at" | "closes_at",
    value: string
  ) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: day.ranges.map((range, index) =>
        index === rangeIndex ? { ...range, [field]: value } : range
      ),
    }));
  }

  function addRange(dayIndex: number) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: [...day.ranges, { opens_at: "13:00", closes_at: "17:00" }],
    }));
  }

  function removeRange(dayIndex: number, rangeIndex: number) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: day.ranges.filter((_, index) => index !== rangeIndex),
    }));
  }

  function scrollToDay(day: number) {
    const position = dayPositions.current[day];

    if (position === undefined) return;

    scrollRef.current?.scrollTo({
      y: Math.max(0, position - 20),
      animated: true,
    });
  }

  async function handleSave() {
    if (!user?.id || !canEdit || isSaving) return;

    const validationError = validateSchedule(schedule);

    if (validationError) {
      setError(validationError.message);
      setErrorDay(validationError.day);
      scrollToDay(validationError.day);
      return;
    }

    setIsSaving(true);
    clearError();

    try {
      const changedDays = schedule.filter((day) => !sameDay(day, savedRecords));

      for (const day of changedDays) {
        const existing = savedRecords.filter(
          (record) => Number(record.day_of_week) === day.value
        );

        // Remove the previous configuration for this day.
        for (const record of existing) {
          await apiFetch(`/api/v1/user_working_hours/${record.id}`, {
            method: "DELETE",
          });
        }

        if (day.mode === "closed") {
          await apiFetch(`/api/v1/users/${user.id}/user_working_hours`, {
            method: "POST",
            body: JSON.stringify({
              user_working_hour: {
                day_of_week: day.value,
                is_closed: true,
              },
            }),
          });
        }

        if (day.mode === "custom") {
          for (const range of day.ranges) {
            await apiFetch(`/api/v1/users/${user.id}/user_working_hours`, {
              method: "POST",
              body: JSON.stringify({
                user_working_hour: {
                  day_of_week: day.value,
                  opens_at: range.opens_at,
                  closes_at: range.closes_at,
                  is_closed: false,
                },
              }),
            });
          }
        }

        // "inherit" creates no personal records.
      }

      router.replace("/settings");
    } catch (requestError: any) {
      setError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );

      // Requests are not atomic. Reload the actual saved state.
      try {
        const refreshed = await apiFetch<WorkingHour[]>(
          `/api/v1/users/${user.id}/user_working_hours`
        );

        setSavedRecords(refreshed);
        setSchedule(buildSchedule(refreshed));
      } catch {
        // Preserve the original error.
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (!user || !canEdit) {
    return (
      <View style={{ padding: 24 }}>
        <Text>You do not have permission to manage working hours.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ padding: 24 }}>
        <Text>Loading working hours...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{ padding: 24, gap: 20 }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>My Working Hours</Text>

      <Text>
        Set your personal availability. You can use business hours, choose
        custom hours, or mark a day as not working.
      </Text>

      <WeeklyScheduleSummary
        schedule={buildSchedule(savedRecords)}
        businessHours={businessHours}
      />

      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Edit Working Hours
      </Text>

      {error && errorDay === null ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : null}

      {schedule.map((day, dayIndex) => {
        const inheritedRanges = businessHours
          .filter((record) => Number(record.day_of_week) === day.value)
          .sort((a, b) => String(a.opens_at).localeCompare(String(b.opens_at)));

        return (
          <View
            key={day.value}
            onLayout={(event) => {
              dayPositions.current[day.value] = event.nativeEvent.layout.y;
            }}
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 16,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{day.label}</Text>

            <View
              style={{
                borderWidth: 1,
                borderRadius: 8,
              }}
            >
              <Picker
                selectedValue={day.mode}
                enabled={!isSaving}
                onValueChange={(value: DayMode) => changeMode(dayIndex, value)}
              >
                <Picker.Item label="Use Business Hours" value="inherit" />
                <Picker.Item label="Custom Hours" value="custom" />
                <Picker.Item label="Not Working" value="closed" />
              </Picker>
            </View>

            {errorDay === day.value && error ? (
              <Text accessibilityRole="alert" style={{ color: "red" }}>
                {error}
              </Text>
            ) : null}

            {day.mode === "inherit" && (
              <View style={{ gap: 4 }}>
                {inheritedRanges.length === 0 ? (
                  <Text>Business closed</Text>
                ) : (
                  inheritedRanges.map((range) => (
                    <Text key={range.id}>
                      {formatTime(range.opens_at)} –{" "}
                      {formatTime(range.closes_at)}
                    </Text>
                  ))
                )}
              </View>
            )}

            {day.mode === "closed" && (
              <Text>You are not available on this day.</Text>
            )}

            {day.mode === "custom" && (
              <View style={{ gap: 12 }}>
                {day.ranges.map((range, rangeIndex) => (
                  <View
                    key={rangeIndex}
                    style={{
                      borderTopWidth: rangeIndex > 0 ? 1 : 0,
                      paddingTop: rangeIndex > 0 ? 12 : 0,
                      gap: 8,
                    }}
                  >
                    <Text>Opens</Text>

                    <Picker
                      selectedValue={range.opens_at}
                      enabled={!isSaving}
                      onValueChange={(value) =>
                        updateRange(dayIndex, rangeIndex, "opens_at", value)
                      }
                    >
                      {TIME_OPTIONS.map((option) => (
                        <Picker.Item
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Picker>

                    <Text>Closes</Text>

                    <Picker
                      selectedValue={range.closes_at}
                      enabled={!isSaving}
                      onValueChange={(value) =>
                        updateRange(dayIndex, rangeIndex, "closes_at", value)
                      }
                    >
                      {TIME_OPTIONS.map((option) => (
                        <Picker.Item
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Picker>

                    <Button
                      title="Remove Range"
                      disabled={isSaving}
                      onPress={() => removeRange(dayIndex, rangeIndex)}
                    />
                  </View>
                ))}

                <Button
                  title="+ Add Hours"
                  disabled={isSaving}
                  onPress={() => addRange(dayIndex)}
                />
              </View>
            )}
          </View>
        );
      })}

      <Button
        title={isSaving ? "Saving..." : "Save My Working Hours"}
        disabled={isSaving}
        onPress={handleSave}
      />
    </ScrollView>
  );
}
