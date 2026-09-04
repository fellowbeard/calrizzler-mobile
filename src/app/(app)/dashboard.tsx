import { router } from "expo-router";
import { Button, Pressable, ScrollView, Text } from "react-native";

import { AppointmentCalendar } from "@/components/AppointmentCalendar";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/auth/useAuth";
import { useDashboard } from "@/hooks/useDashboard";

export default function DashboardScreen() {
  const { dashboard, error } = useDashboard();
  const { account } = useAuth();

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!dashboard) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (!account) {
    return <LoadingState message="Loading account settings..." />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>
        {dashboard.account.business_name}
      </Text>

      <Text>
        Welcome, {dashboard.user.first_name} {dashboard.user.last_name}
      </Text>

      <Button
        title="New Appointment"
        onPress={() => router.push("/appointments/new")}
      />

      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Calendar</Text>

      <AppointmentCalendar timezone={account.timezone} />

      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Recent Clients</Text>

      {dashboard.recent_clients.length > 0 ? (
        dashboard.recent_clients.map((client) => (
          <Pressable
            key={client.id}
            onPress={() => router.push(`/clients/${client.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open client ${client.first_name} ${client.last_name}`}
            style={{
              padding: 16,
              borderWidth: 1,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 18 }}>
              {client.first_name} {client.last_name}
            </Text>
          </Pressable>
        ))
      ) : (
        <Text>No recent clients.</Text>
      )}
    </ScrollView>
  );
}
