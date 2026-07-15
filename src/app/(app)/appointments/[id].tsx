import { Link, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text } from "react-native";
import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAppointment } from "@/hooks/useAppointment";
import {
  calculateEndTime,
  formatDate,
  formatTime,
} from "@/utils/dateFormatting";

export default function AppointmentDetailScreen() {
  const { user } = useAuth();
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

  const endTime = calculateEndTime(
    appointment.scheduled_at,
    appointment.duration_minutes
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>Appointment</Text>
      {canWrite(user) ? (
      <Link href={`/appointments/${appointment.id}/edit`} asChild>
      <Button title="Edit Appointment"/>
          </Link>
        ) : null}
      <Text>
        Client:{" "}
        {appointment.client
          ? `${appointment.client.first_name} ${appointment.client.last_name}`
          : "No client"}
      </Text>
      <Text>Start Date: {formatDate(appointment.scheduled_at)}</Text>
      <Text>Start Time: {formatTime(appointment.scheduled_at)}</Text>
      <Text>End Date: {formatDate(endTime.toISOString())}</Text>
      <Text>End Time: {formatTime(endTime.toISOString())}</Text>
      <Text>Status: {appointment.status}</Text>
      <Text>
        Duration: {appointment.duration_minutes} minutes
      </Text>
      <Text style={{ fontSize: 20, marginTop: 16 }}>Services</Text>
      {appointment.services.length === 0 ? (
        <Text>No services.</Text>
      ) : (
        appointment.services.map((service) => (
          <Text key={service.id}>
            {service.title} — ${service.price} —{" "}
            {service.duration_minutes} min
          </Text>
        ))
      )}
      <Text style={{ fontSize: 20, marginTop: 16 }}>Resource</Text>
      <Text>{appointment.resource?.name || "No resource"}</Text>
    </ScrollView>
  );
}