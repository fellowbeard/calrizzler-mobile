import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { formatDuration } from "@/utils/durationFormatting";
import { formatTime, getCalendarDateParts } from "@/utils/dateFormatting";

type CalendarAppointment = {
  id: number;
  user_id: number;
  user_name: string;
  resource_id: number;
  resource_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
  services?: { id: number; title: string }[];
};

type AppointmentCalendarProps = {
  timezone: string;
};

type CalendarFilter = "all" | "mine";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AppointmentCalendar({ timezone }: AppointmentCalendarProps) {
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendar = useCallback(async () => {
    try {
      const data = await apiFetch<CalendarAppointment[]>("/api/v1/calendar");
      setAppointments(data);
      setError("");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load calendar."
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCalendar();
    }, [fetchCalendar])
  );

  useEffect(() => {
    const updateNow = () => setNow(Date.now());

    const interval = setInterval(updateNow, 60_000);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        updateNow();
        fetchCalendar();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [fetchCalendar]);

  const visibleAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) => filter === "all" || appointment.user_id === user?.id
    );
  }, [appointments, filter, user?.id]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [year, month]);

  const todayParts = useMemo(
    () => getCalendarDateParts(new Date(now).toISOString(), timezone),
    [now, timezone]
  );

  function appointmentsForDay(dayDate: Date | null) {
    if (!dayDate) return [];

    return visibleAppointments
      .filter((appointment) => {
        const parts = getCalendarDateParts(appointment.scheduled_at, timezone);

        return (
          parts.year === dayDate.getFullYear() &&
          parts.month === dayDate.getMonth() + 1 &&
          parts.day === dayDate.getDate()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );
  }

  function isToday(dayDate: Date) {
    return (
      dayDate.getFullYear() === todayParts.year &&
      dayDate.getMonth() + 1 === todayParts.month &&
      dayDate.getDate() === todayParts.day
    );
  }

  function isPastDay(dayDate: Date) {
    const dateValue =
      dayDate.getFullYear() * 10000 +
      (dayDate.getMonth() + 1) * 100 +
      dayDate.getDate();

    const todayValue =
      todayParts.year * 10000 + todayParts.month * 100 + todayParts.day;

    return dateValue < todayValue;
  }

  function isPastAppointment(appointment: CalendarAppointment) {
    const endTime =
      new Date(appointment.scheduled_at).getTime() +
      appointment.duration_minutes * 60000;

    return endTime < now;
  }

  function canOpenAppointment(appointment: CalendarAppointment) {
    return appointment.user_id === user?.id && !isPastAppointment(appointment);
  }

  function appointmentEndTime(appointment: CalendarAppointment) {
    const end = new Date(
      new Date(appointment.scheduled_at).getTime() +
        appointment.duration_minutes * 60000
    );

    return formatTime(end.toISOString(), timezone);
  }

  function changeMonth(offset: number) {
    setCurrentDate(new Date(year, month + offset, 1));
  }

  function changeDay(offset: number) {
    if (!selectedDay) return;

    const nextDay = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate() + offset
    );

    setSelectedDay(nextDay);
    setCurrentDate(new Date(nextDay.getFullYear(), nextDay.getMonth(), 1));
  }

  const selectedDayAppointments = selectedDay
    ? appointmentsForDay(selectedDay)
    : [];

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter("mine")}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === "mine" }}
          style={[
            styles.filterButton,
            filter === "mine" && styles.activeFilter,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              filter === "mine" && styles.activeFilterText,
            ]}
          >
            My Appointments
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter("all")}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === "all" }}
          style={[styles.filterButton, filter === "all" && styles.activeFilter]}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.activeFilterText,
            ]}
          >
            All Appointments
          </Text>
        </Pressable>
      </View>

      {selectedDay ? (
        <View style={styles.dayView}>
          <Pressable
            onPress={() => setSelectedDay(null)}
            accessibilityRole="button"
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to Month</Text>
          </Pressable>

          <View style={styles.header}>
            <Pressable
              onPress={() => changeDay(-1)}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
              style={styles.navigationButton}
            >
              <Text>‹ Previous</Text>
            </Pressable>

            <Text style={styles.dayTitle}>
              {selectedDay.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>

            <Pressable
              onPress={() => changeDay(1)}
              accessibilityRole="button"
              accessibilityLabel="Next day"
              style={styles.navigationButton}
            >
              <Text>Next ›</Text>
            </Pressable>
          </View>

          <Text style={styles.countHeading}>
            {selectedDayAppointments.length}{" "}
            {selectedDayAppointments.length === 1
              ? "Appointment"
              : "Appointments"}
          </Text>

          {selectedDayAppointments.length === 0 ? (
            <Text style={styles.emptyMessage}>
              No appointments for this day.
            </Text>
          ) : (
            selectedDayAppointments.map((appointment) => {
              const isOwn = appointment.user_id === user?.id;
              const canOpen = canOpenAppointment(appointment);
              const isPast = isPastAppointment(appointment);

              return (
                <Pressable
                  key={appointment.id}
                  disabled={!canOpen}
                  onPress={() => router.push(`/appointments/${appointment.id}`)}
                  accessibilityRole={canOpen ? "button" : undefined}
                  style={({ pressed }) => [
                    styles.dayAppointment,
                    isPast && styles.pastAppointment,
                    pressed && canOpen && styles.pressed,
                  ]}
                >
                  <Text style={styles.appointmentTime}>
                    {formatTime(appointment.scheduled_at, timezone)}
                    {" – "}
                    {appointmentEndTime(appointment)}
                  </Text>

                  {!isOwn && (
                    <Text style={styles.appointmentDetail}>
                      Provider: {appointment.user_name}
                    </Text>
                  )}

                  {isOwn && (
                    <Text style={styles.appointmentDetail}>
                      Services:{" "}
                      {appointment.services
                        ?.map((service) => service.title)
                        .join(", ") || "None"}
                    </Text>
                  )}

                  <Text style={styles.appointmentDetail}>
                    Resource: {appointment.resource_name ?? "Unassigned"}
                  </Text>

                  <Text style={styles.appointmentDetail}>
                    Duration: {formatDuration(appointment.duration_minutes)}
                  </Text>

                  {!isOwn ? (
                    <Text style={styles.occupiedText}>
                      Taken · Other provider
                    </Text>
                  ) : isPast ? (
                    <Text style={styles.mutedText}>Past appointment</Text>
                  ) : (
                    <Text style={styles.openText}>Tap to open appointment</Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Pressable
              onPress={() => changeMonth(-1)}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={styles.navigationButton}
            >
              <Text>Previous</Text>
            </Pressable>

            <Text style={styles.monthTitle}>
              {currentDate.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>

            <Pressable
              onPress={() => changeMonth(1)}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={styles.navigationButton}
            >
              <Text>Next</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((weekday, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{weekday}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((dayDate, index) => {
              if (!dayDate) {
                return (
                  <View
                    key={`empty-${index}`}
                    style={[styles.dayCell, styles.emptyDayCell]}
                  />
                );
              }

              const count = appointmentsForDay(dayDate).length;
              const today = isToday(dayDate);
              const past = isPastDay(dayDate);

              return (
                <Pressable
                  key={`${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`}
                  onPress={() => setSelectedDay(dayDate)}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayDate.toDateString()}, ${count} appointments`}
                  style={({ pressed }) => [
                    styles.dayCell,
                    past && styles.pastDayCell,
                    today && styles.todayCell,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      past && styles.pastDayNumber,
                      today && styles.todayDayNumber,
                    ]}
                  >
                    {dayDate.getDate()}
                  </Text>

                  {count > 0 && (
                    <Text style={styles.dayCount}>
                      {count} {count === 1 ? "appt" : "appts"}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#0D0D5B",
    borderColor: "#0D0D5B",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  navigationButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  monthTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayCell: {
    width: "14.2857%",
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    minHeight: 70,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyDayCell: {
    opacity: 0.3,
  },
  pastDayCell: {
    backgroundColor: "#f2f2f2",
  },
  todayCell: {
    backgroundColor: "#e8f0fe",
    borderWidth: 2,
    borderColor: "#2424B0",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "bold",
  },
  pastDayNumber: {
    color: "#777",
  },
  todayDayNumber: {
    color: "#0D0D5B",
    fontWeight: "900",
  },
  dayCount: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  dayView: {
    gap: 12,
  },
  backButton: {
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 15,
    color: "#2424B0",
    fontWeight: "bold",
  },
  dayTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  countHeading: {
    fontSize: 17,
    fontWeight: "bold",
  },
  dayAppointment: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: "bold",
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  appointmentDetail: {
    fontSize: 13,
  },
  occupiedText: {
    fontSize: 12,
    color: "#777",
  },
  openText: {
    fontSize: 12,
    color: "#2424B0",
    fontWeight: "600",
  },
  mutedText: {
    fontSize: 12,
    color: "#777",
  },
  pastAppointment: {
    backgroundColor: "#d9d9d9",
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.6,
  },
  emptyMessage: {
    paddingVertical: 24,
    textAlign: "center",
    color: "#777",
  },
  error: {
    color: "red",
  },
});
