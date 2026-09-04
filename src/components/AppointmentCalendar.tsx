import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { formatTime, getCalendarDateParts } from "@/utils/dateFormatting";

type CalendarAppointment = {
  id: number;
  user_id: number;
  user_name: string;
  resource_id: number;
  resource_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
};

type AppointmentCalendarProps = {
  timezone: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AppointmentCalendar({ timezone }: AppointmentCalendarProps) {
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [error, setError] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendar = useCallback(async () => {
    try {
      const data = await apiFetch<CalendarAppointment[]>("/api/v1/calendar");

      setAppointments(data);
      setError("");
    } catch (requestError: any) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayIndex = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: (Date | null)[] = [];

    for (let index = 0; index < startingDayIndex; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [month, year]);

  const todayParts = useMemo(() => {
    return getCalendarDateParts(new Date().toISOString(), timezone);
  }, [timezone]);

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function appointmentsForDay(dayDate: Date | null) {
    if (!dayDate) {
      return [];
    }

    return appointments.filter((appointment) => {
      const appointmentDate = getCalendarDateParts(
        appointment.scheduled_at,
        timezone
      );

      return (
        appointmentDate.year === dayDate.getFullYear() &&
        appointmentDate.month === dayDate.getMonth() + 1 &&
        appointmentDate.day === dayDate.getDate()
      );
    });
  }

  function isToday(dayDate: Date | null) {
    if (!dayDate) {
      return false;
    }

    return (
      dayDate.getFullYear() === todayParts.year &&
      dayDate.getMonth() + 1 === todayParts.month &&
      dayDate.getDate() === todayParts.day
    );
  }

  function isPastDay(dayDate: Date | null) {
    if (!dayDate) {
      return false;
    }

    const dayValue =
      dayDate.getFullYear() * 10000 +
      (dayDate.getMonth() + 1) * 100 +
      dayDate.getDate();

    const todayValue =
      todayParts.year * 10000 + todayParts.month * 100 + todayParts.day;

    return dayValue < todayValue;
  }

  function isPastAppointment(appointment: CalendarAppointment) {
    const startTime = new Date(appointment.scheduled_at);

    const endTime = new Date(
      startTime.getTime() + appointment.duration_minutes * 60 * 1000
    );

    return endTime < new Date();
  }

  function isOwnAppointment(appointment: CalendarAppointment) {
    return appointment.user_id === user?.id;
  }

  function handleAppointmentPress(appointment: CalendarAppointment) {
    if (!isOwnAppointment(appointment) || isPastAppointment(appointment)) {
      return;
    }

    router.push(`/appointments/${appointment.id}`);
  }

  function renderOwnAppointmentContent(appointment: CalendarAppointment) {
    return (
      <>
        <Text numberOfLines={1} style={styles.appointmentTime}>
          {formatTime(appointment.scheduled_at, timezone)}
        </Text>

        <Text numberOfLines={1} style={styles.appointmentClient}>
          {appointment.user_name}
        </Text>

        <Text numberOfLines={1} style={styles.appointmentResource}>
          {appointment.resource_name}
        </Text>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.header}>
        <Pressable
          onPress={previousMonth}
          accessibilityRole="button"
          accessibilityLabel="Show previous month"
          style={styles.monthButton}
        >
          <Text style={styles.monthButtonText}>Previous</Text>
        </Pressable>

        <Text accessibilityRole="header" style={styles.monthTitle}>
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        <Pressable
          onPress={nextMonth}
          accessibilityRole="button"
          accessibilityLabel="Show next month"
          style={styles.monthButton}
        >
          <Text style={styles.monthButtonText}>Next</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((weekday) => (
          <View key={weekday} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{weekday}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarDays.map((dayDate, index) => {
          const dayAppointments = appointmentsForDay(dayDate);
          const dayIsToday = isToday(dayDate);
          const dayIsPast = isPastDay(dayDate);

          return (
            <View
              key={dayDate?.toISOString() ?? `empty-${index}`}
              style={[
                styles.dayCell,
                !dayDate ? styles.emptyDayCell : undefined,
                dayIsPast ? styles.pastDayCell : undefined,
                dayIsToday ? styles.todayCell : undefined,
              ]}
            >
              {dayDate ? (
                <>
                  <Text
                    style={[
                      styles.dayNumber,
                      dayIsPast ? styles.pastDayNumber : undefined,
                      dayIsToday ? styles.todayDayNumber : undefined,
                    ]}
                  >
                    {dayDate.getDate()}
                  </Text>

                  {dayAppointments.slice(0, 2).map((appointment) => {
                    const ownAppointment = isOwnAppointment(appointment);
                    const appointmentIsPast = isPastAppointment(appointment);

                    if (!ownAppointment) {
                      return (
                        <View
                          key={appointment.id}
                          style={[
                            styles.appointment,
                            appointmentIsPast
                              ? styles.pastAppointment
                              : undefined,
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            style={styles.appointmentTime}
                          >
                            {formatTime(appointment.scheduled_at, timezone)}
                          </Text>

                          <Text
                            numberOfLines={1}
                            style={styles.appointmentClient}
                          >
                            {appointment.user_name}
                          </Text>

                          <Text
                            numberOfLines={1}
                            style={styles.appointmentResource}
                          >
                            {appointment.resource_name}
                          </Text>

                          <Text
                            numberOfLines={1}
                            style={styles.appointmentClient}
                          >
                            Busy
                          </Text>
                        </View>
                      );
                    }

                    if (appointmentIsPast) {
                      return (
                        <View
                          key={appointment.id}
                          style={[styles.appointment, styles.pastAppointment]}
                        >
                          {renderOwnAppointmentContent(appointment)}
                        </View>
                      );
                    }

                    return (
                      <Pressable
                        key={appointment.id}
                        onPress={() => handleAppointmentPress(appointment)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open your appointment at ${formatTime(
                          appointment.scheduled_at,
                          timezone
                        )}`}
                        style={({ pressed }) => [
                          styles.appointment,
                          pressed ? styles.appointmentPressed : undefined,
                        ]}
                      >
                        {renderOwnAppointmentContent(appointment)}
                      </Pressable>
                    );
                  })}

                  {dayAppointments.length > 2 ? (
                    <Text style={styles.moreAppointments}>
                      +{dayAppointments.length - 2} more
                    </Text>
                  ) : null}
                </>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  monthButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  monthButtonText: {
    fontSize: 12,
    fontWeight: "600",
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
    alignItems: "center",
    width: "14.2857%",
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
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 88,
    padding: 3,
    width: "14.2857%",
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
  },

  dayNumber: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 3,
  },

  pastDayNumber: {
    color: "#888",
  },

  todayDayNumber: {
    fontSize: 14,
    fontWeight: "900",
  },

  appointment: {
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 3,
    padding: 3,
  },

  appointmentPressed: {
    opacity: 0.6,
  },

  appointmentTime: {
    fontSize: 9,
    fontWeight: "bold",
  },

  appointmentResource: {
    fontSize: 9,
  },

  appointmentClient: {
    fontSize: 9,
  },

  pastAppointment: {
    backgroundColor: "#d9d9d9",
    opacity: 0.65,
  },

  moreAppointments: {
    fontSize: 9,
    fontWeight: "600",
  },

  error: {
    color: "red",
  },
});
