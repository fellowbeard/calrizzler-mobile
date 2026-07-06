import { router } from "expo-router";
import { Button, Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "@/auth/useAuth";

import { useDashboard } from "@/hooks/useDashboard";

import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

export default function DashboardScreen() {
  const { dashboard, error } = useDashboard();
  const { signOut } = useAuth();

  async function handleLogout() {
    await signOut();
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!dashboard) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <ProtectedRoute>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>{dashboard.account.business_name}</Text>

        <Text>
          Welcome, {dashboard.user.first_name} {dashboard.user.last_name}
        </Text>

        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Recent Clients</Text>

        {dashboard.recent_clients.map((client) => (
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
        ))}

        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Services</Text>

        {dashboard.services.map((service) => (
          <View key={service.id}>
            <Text>
              {service.title} — ${service.price} — {service.duration_minutes} min
            </Text>
          </View>
        ))}

        <Button title="Log out" onPress={handleLogout} />
      </ScrollView>
    </ProtectedRoute>
  );
}
