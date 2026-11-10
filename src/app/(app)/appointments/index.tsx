import { router } from "expo-router";
import { FlatList, Pressable, Text, View, Button } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAppointments } from "@/hooks/useAppointments";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/auth/useAuth";
import { canWrite } from "@/auth/permissions";
import {
  formatDate,
  formatTime,
  calculateEndTime,
} from "@/utils/dateFormatting";
import { formatDuration } from "@/utils/durationFormatting";

export default function AppointmentsScreen() {
  const { appointments, error, isLoading } = useAppointments();
  const { user, account } = useAuth();
  const userCanWrite = canWrite(user);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Finding appointments..." />;
  }

  if (!account) {
    return <LoadingState message="Loading account settings..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      {userCanWrite && (
        <View style={{ padding: 24, paddingBottom: 0 }}>
          <Button
            title="New Appointment"
            onPress={() => router.push("/appointments/new")}
          />
        </View>
      )}

      {appointments.length === 0 ? (
        <EmptyState message="No appointments found." />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: 24,
          }}
          renderItem={({ item }) => {
            const endTime = calculateEndTime(
              item.scheduled_at,
              item.duration_minutes
            );

            return (
              <Pressable
                onPress={() => router.push(`/appointments/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open appointment ${item.id}`}
                style={{
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#333333",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    marginBottom: 6,
                  }}
                >
                  {item.client
                    ? `${item.client.first_name} ${item.client.last_name}`
                    : "No client"}
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  {formatDate(item.scheduled_at, account.timezone)}
                </Text>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  {formatTime(item.scheduled_at, account.timezone)} –{" "}
                  {formatTime(endTime.toISOString(), account.timezone)}
                </Text>

                <Text>
                  Services:{" "}
                  {item.services?.length
                    ? item.services.map((service) => service.title).join(", ")
                    : "None"}
                </Text>

                <Text>Resource: {item.resource?.name ?? "Unassigned"}</Text>

                <Text>Status: {item.status}</Text>

                <Text>Duration: {formatDuration(item.duration_minutes)}</Text>

                {item.notes?.trim() ? (
                  <Text>Appointment Notes: {item.notes}</Text>
                ) : null}

                <Text
                  style={{
                    color: "#2424B0",
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 8,
                  }}
                >
                  Tap to open appointment
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
