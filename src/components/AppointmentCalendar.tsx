import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Appointment } from "@/types/appointment";

type AppointmentCalendarProps = {
  appointments: Appointment[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AppointmentCalendar({
  appointments,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayIndex = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<Date | null> = [];

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
      const appointmentDate = new Date(appointment.scheduled_at);

      return (
        appointmentDate.getFullYear() === dayDate.getFullYear() &&
        appointmentDate.getMonth() === dayDate.getMonth() &&
        appointmentDate.getDate() === dayDate.getDate()
      );
    });
  }

  return (
    <View style={styles.container}>
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

          return (
            <View
              key={dayDate?.toISOString() ?? `empty-${index}`}
              style={[
                styles.dayCell,
                !dayDate ? styles.emptyDayCell : undefined,
              ]}
            >
              {dayDate ? (
                <>
                  <Text style={styles.dayNumber}>{dayDate.getDate()}</Text>

                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <Pressable
                      key={appointment.id}
                      onPress={() =>
                        router.push(`/appointments/${appointment.id}`)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Open appointment for ${appointment.client.first_name} ${appointment.client.last_name}`}
                      style={({ pressed }) => [
                        styles.appointment,
                        pressed ? styles.appointmentPressed : undefined,
                      ]}
                    >
                      <Text numberOfLines={1} style={styles.appointmentTime}>
                        {new Date(
                          appointment.scheduled_at,
                        ).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Text>

                      <Text numberOfLines={1} style={styles.appointmentClient}>
                        {appointment.client.first_name}{" "}
                        {appointment.client.last_name}
                      </Text>
                    </Pressable>
                  ))}

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
  dayNumber: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 3,
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
  appointmentClient: {
    fontSize: 9,
  },
  moreAppointments: {
    fontSize: 9,
    fontWeight: "600",
  },
});