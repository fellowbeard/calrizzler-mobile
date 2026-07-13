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

export default function AppointmentsScreen() {
  const { appointments, error, isLoading } = useAppointments();
  const { user } = useAuth();
  const userCanWrite = canWrite(user);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Finding appointments..." />;
  }

  if (appointments.length === 0) {
    return <EmptyState message="No appointments found." />;
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

      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 24 }}
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
                padding: 16,
                borderBottomWidth: 1,
              }}
            >
              <Text style={{ fontSize: 18 }}>
                {item.client
                  ? `${item.client.first_name} ${item.client.last_name}`
                  : "No client"}
              </Text>

              <Text>
                Start Date: {formatDate(item.scheduled_at)}
              </Text>

              <Text>
                Start Time: {formatTime(item.scheduled_at)}
              </Text>

              <Text>
                End Date: {formatDate(endTime.toISOString())}
              </Text>

              <Text>
                End Time: {formatTime(endTime.toISOString())}
              </Text>

              <Text>{item.status}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}