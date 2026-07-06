import { Stack } from "expo-router";

import { ProtectedRoute } from "@/auth/ProtectedRoute";

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <Stack>
        <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Stack.Screen name="clients" options={{ title: "Clients" }} />
        <Stack.Screen name="clients/[id]" options={{ title: "Client Detail" }} />
        <Stack.Screen name="appointments/index" options={{ title: "Appointments" }} />
        <Stack.Screen name="appointments/[id]" options={{ title: "Appointment Detail" }} />
        <Stack.Screen name="services/index" options={{ title: "Services" }} />
        <Stack.Screen name="services/[id]" options={{ title: "Service Detail" }} />
        <Stack.Screen name="resources/index" options={{ title: "Resources" }} />
        <Stack.Screen name="resources/[id]" options={{ title: "Resource Detail" }} />
      </Stack>
    </ProtectedRoute>
  );
}
