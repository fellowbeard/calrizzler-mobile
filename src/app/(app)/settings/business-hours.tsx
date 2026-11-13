import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Button, ScrollView, Switch, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch, errorMessage } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import {
  DAYS,
  DEFAULT_RANGE,
  TIME_OPTIONS,
  normalizeTime,
  validateRanges,
  type TimeRange,
} from "@/utils/hours";

type WorkingHour = {
  id: number;
  day_of_week: number;
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

    const message = validateRanges(day.ranges);

    if (message) return { day: day.value, message: `${day.label}: ${message}` };
  }

  return null;
}

export default function BusinessHoursScreen() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [schedule, setSchedule] = useState(initialSchedule);
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
            ranges: monday.ranges.map((range) => ({ ...range })),
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
              ranges: previous[0].ranges.map((range) => ({ ...range })),
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
      const workingHours = schedule.flatMap((day) =>
        day.isOpen
          ? day.ranges.map(({ opens_at, closes_at }) => ({
              day_of_week: day.value,
              opens_at,
              closes_at,
            }))
          : []
      );

      // One request; the server swaps the whole week in a transaction,
      // so a failure leaves the saved hours untouched.
      await apiFetch("/api/v1/working_hours/replace", {
        method: "PUT",
        body: JSON.stringify({ working_hours: workingHours }),
      });

      router.replace("/settings");
    } catch (requestError) {
      setError(errorMessage(requestError));
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
              <View key={rangeIndex} style={{ gap: 8 }}>
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
