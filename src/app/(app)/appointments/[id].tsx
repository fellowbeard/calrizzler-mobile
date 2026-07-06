import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAppointment } from "@/hooks/useAppointment";

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const { appointment, error, isLoading } = useAppointment(id);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading appointment..." />;
  }

  if (!appointment) {
    return <EmptyState message="Appointment not found." />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>Appointment</Text>

      <Text>
        Client:{" "}
        {appointment.client
          ? `${appointment.client.first_name} ${appointment.client.last_name}`
          : "No client"}
      </Text>

      <Text>Scheduled at: {appointment.scheduled_at}</Text>
      <Text>Status: {appointment.status}</Text>
      <Text>Duration: {appointment.duration_minutes ?? "N/A"} minutes</Text>

      <Text style={{ fontSize: 20, marginTop: 16 }}>Services</Text>

      {appointment.services.length === 0 ? (
        <Text>No services.</Text>
      ) : (
        appointment.services.map((service) => (
          <Text key={service.id}>
            {service.title} — ${service.price} — {service.duration_minutes} min
          </Text>
        ))
      )}

      <Text style={{ fontSize: 20, marginTop: 16 }}>Resource</Text>
      <Text>{appointment.resource?.name || "No resource"}</Text>
    </ScrollView>
  );
}