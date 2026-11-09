import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Button, ScrollView, Switch, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";

type WorkingHour = {
  id: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
};

type TimeRange = {
  id?: number;
  opens_at: string;
  closes_at: string;
};

type ScheduleDay = {
  label: string;
  value: number;
  isOpen: boolean;
  customized: boolean;
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

const DEFAULT_RANGE = {
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

function normalizeTime(value: string) {
  const match = String(value ?? "").match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function initialSchedule(): ScheduleDay[] {
  return DAYS.map((day, index) => ({
    ...day,
    isOpen: index < 5,
    customized: false,
    ranges: [{ ...DEFAULT_RANGE }],
  }));
}

function buildSchedule(records: WorkingHour[]): ScheduleDay[] {
  return DAYS.map((day) => {
    const ranges = records
      .filter((record) => Number(record.day_of_week) === day.value)
      .map((record) => ({
        id: record.id,
        opens_at: normalizeTime(record.opens_at),
        closes_at: normalizeTime(record.closes_at),
      }))
      .sort((a, b) => a.opens_at.localeCompare(b.opens_at));

    return {
      ...day,
      isOpen: ranges.length > 0,
      customized: true,
      ranges: ranges.length ? ranges : [{ ...DEFAULT_RANGE }],
    };
  });
}

function validateSchedule(schedule: ScheduleDay[]): ScheduleError | null {
  for (const day of schedule) {
    if (!day.isOpen) continue;

    if (!day.ranges.length) {
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

function sameRange(
  record: WorkingHour,
  range: TimeRange & { day_of_week: number }
) {
  return (
    record.day_of_week === range.day_of_week &&
    normalizeTime(record.opens_at) === range.opens_at &&
    normalizeTime(record.closes_at) === range.closes_at
  );
}

export default function BusinessHoursScreen() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [schedule, setSchedule] = useState(initialSchedule);
  const [savedRecords, setSavedRecords] = useState<WorkingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorDay, setErrorDay] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const dayPositions = useRef<Record<number, number>>({});

  useEffect(() => {
    let active = true;

    apiFetch("/api/v1/working_hours")
      .then((response) => {
        if (!active) return;

        const records = response as WorkingHour[];

        setSavedRecords(records);
        setSchedule(
          records.length ? buildSchedule(records) : initialSchedule()
        );
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function clearMessages() {
    setError("");
    setErrorDay(null);
  }

  function scrollToDay(day: number) {
    const position = dayPositions.current[day];

    if (position === undefined) return;

    scrollRef.current?.scrollTo({
      y: Math.max(0, position - 20),
      animated: true,
    });
  }

  function updateDay(
    dayIndex: number,
    updater: (day: ScheduleDay) => ScheduleDay
  ) {
    clearMessages();

    setSchedule((previous) => {
      const updated = previous.map((day) => ({
        ...day,
        ranges: day.ranges.map((range) => ({ ...range })),
      }));

      updated[dayIndex] = updater(updated[dayIndex]);

      if (dayIndex === 0) {
        const monday = updated[0];

        return updated.map((day, index) => {
          if (index === 0 || day.customized) return day;

          return {
            ...day,
            isOpen: monday.isOpen,
            ranges: monday.ranges.map((range, rangeIndex) => ({
              id: day.ranges[rangeIndex]?.id,
              opens_at: range.opens_at,
              closes_at: range.closes_at,
            })),
          };
        });
      }

      updated[dayIndex] = {
        ...updated[dayIndex],
        customized: true,
      };

      return updated;
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

  function toggleDay(dayIndex: number, isOpen: boolean) {
    updateDay(dayIndex, (day) => ({
      ...day,
      isOpen,
      ranges:
        isOpen && !day.ranges.length ? [{ ...DEFAULT_RANGE }] : day.ranges,
    }));
  }

  function addRange(dayIndex: number) {
    updateDay(dayIndex, (day) => ({
      ...day,
      ranges: [...day.ranges, { opens_at: "13:00", closes_at: "17:00" }],
    }));
  }

  function removeRange(dayIndex: number, rangeIndex: number) {
    updateDay(dayIndex, (day) => {
      const ranges = day.ranges.filter((_, index) => index !== rangeIndex);

      return {
        ...day,
        isOpen: ranges.length > 0,
        ranges,
      };
    });
  }

  function resetToMonday(dayIndex: number) {
    clearMessages();

    setSchedule((previous) =>
      previous.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              isOpen: previous[0].isOpen,
              customized: false,
              ranges: previous[0].ranges.map((range, rangeIndex) => ({
                id: day.ranges[rangeIndex]?.id,
                opens_at: range.opens_at,
                closes_at: range.closes_at,
              })),
            }
          : day
      )
    );
  }

  async function handleSave() {
    if (!isOwner || isSaving) return;

    const validationError = validateSchedule(schedule);

    if (validationError) {
      setError(validationError.message);
      setErrorDay(validationError.day);
      scrollToDay(validationError.day);
      return;
    }

    setIsSaving(true);
    clearMessages();

    try {
      const desiredRanges = schedule.flatMap((day) =>
        day.isOpen
          ? day.ranges.map((range) => ({
              ...range,
              day_of_week: day.value,
            }))
          : []
      );

      const savedById = new Map(
        savedRecords.map((record) => [record.id, record])
      );

      const desiredIds = new Set(
        desiredRanges
          .filter((range) => range.id != null)
          .map((range) => range.id)
      );

      const recordsToDelete = savedRecords.filter(
        (record) => !desiredIds.has(record.id)
      );

      const rangesToUpdate = desiredRanges.filter((range) => {
        if (range.id == null) return false;

        const saved = savedById.get(range.id);
        return saved && !sameRange(saved, range);
      });

      const rangesToCreate = desiredRanges.filter((range) => range.id == null);

      // Delete removed ranges first.
      for (const record of recordsToDelete) {
        await apiFetch(`/api/v1/working_hours/${record.id}`, {
          method: "DELETE",
        });
      }

      // Replace changed ranges to avoid temporary overlap conflicts.
      for (const range of rangesToUpdate) {
        await apiFetch(`/api/v1/working_hours/${range.id}`, {
          method: "DELETE",
        });
      }

      const newRanges = [...rangesToUpdate, ...rangesToCreate].sort(
        (a, b) =>
          a.day_of_week - b.day_of_week || a.opens_at.localeCompare(b.opens_at)
      );

      for (const range of newRanges) {
        await apiFetch("/api/v1/working_hours", {
          method: "POST",
          body: JSON.stringify({
            working_hour: {
              day_of_week: range.day_of_week,
              opens_at: range.opens_at,
              closes_at: range.closes_at,
            },
          }),
        });
      }

      const refreshed = (await apiFetch(
        "/api/v1/working_hours"
      )) as WorkingHour[];

      setSavedRecords(refreshed);
      setSchedule(buildSchedule(refreshed));

      // Return to the Settings menu after a successful save.
      router.replace("/settings");
    } catch (requestError: any) {
      setError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );

      // Individual API requests are not atomic.
      // Reload the actual saved state after a failure.
      try {
        const refreshed = (await apiFetch(
          "/api/v1/working_hours"
        )) as WorkingHour[];

        setSavedRecords(refreshed);
        setSchedule(buildSchedule(refreshed));
      } catch {
        // Preserve the original error.
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ padding: 24 }}>
        <Text>Loading business hours...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={{ padding: 24, gap: 20 }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Business Hours</Text>

      <Text>
        {isOwner
          ? "Set Monday's hours first. Other days inherit changes until customized."
          : "These are the business's regular operating hours."}
      </Text>

      {error && errorDay === null ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : null}

      {schedule.map((day, dayIndex) => (
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{day.label}</Text>

            {isOwner ? (
              <Switch
                value={day.isOpen}
                onValueChange={(value) => toggleDay(dayIndex, value)}
                disabled={isSaving}
              />
            ) : (
              <Text>{day.isOpen ? "Open" : "Closed"}</Text>
            )}
          </View>

          {errorDay === day.value && error ? (
            <Text accessibilityRole="alert" style={{ color: "red" }}>
              {error}
            </Text>
          ) : null}

          {day.isOpen &&
            day.ranges.map((range, rangeIndex) => (
              <View key={range.id ?? `new-${rangeIndex}`} style={{ gap: 8 }}>
                {isOwner ? (
                  <>
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
                  </>
                ) : (
                  <Text>
                    {TIME_OPTIONS.find(
                      (option) => option.value === range.opens_at
                    )?.label ?? range.opens_at}
                    {" – "}
                    {TIME_OPTIONS.find(
                      (option) => option.value === range.closes_at
                    )?.label ?? range.closes_at}
                  </Text>
                )}
              </View>
            ))}

          {isOwner && day.isOpen && (
            <Button
              title="+ Add Hours"
              disabled={isSaving}
              onPress={() => addRange(dayIndex)}
            />
          )}

          {isOwner && dayIndex > 0 && day.customized && (
            <Button
              title="Use Monday's Hours"
              disabled={isSaving}
              onPress={() => resetToMonday(dayIndex)}
            />
          )}
        </View>
      ))}

      {isOwner && (
        <Button
          title={isSaving ? "Saving..." : "Save Business Hours"}
          disabled={isSaving}
          onPress={handleSave}
        />
      )}
    </ScrollView>
  );
}
