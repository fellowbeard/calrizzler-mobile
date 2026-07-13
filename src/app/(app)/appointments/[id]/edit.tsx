import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAppointment } from "@/hooks/useAppointment";
import { useDashboard } from "@/hooks/useDashboard";
import { useUpdateAppointment } from "@/hooks/useUpdateAppointment";
import { AppointmentForm } from "@/components/forms/AppointmentForm";

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const {
    appointment,
    error: appointmentError,
    isLoading: isAppointmentLoading,
  } = useAppointment(id);

  const {
    dashboard,
    error: dashboardError,
    isLoading: isDashboardLoading,
  } = useDashboard();

  const {
    updateAppointment,
    error: saveError,
    isSaving,
  } = useUpdateAppointment(id);

  if (!canWrite(user)) {
    return <Redirect href="/appointments" />;
  }

  if (appointmentError || dashboardError) {
    return (
      <ErrorState
        message={appointmentError || dashboardError || "Could not load appointment."}
      />
    );
  }

  if (isAppointmentLoading || isDashboardLoading) {
    return <LoadingState message="Loading appointment..." />;
  }

  if (!appointment || !dashboard) {
    return <EmptyState message="Appointment not found." />;
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>Edit Appointment</Text>

      <AppointmentForm
        initialValues={appointment}
        clients={dashboard.clients}
        onNewClient={() => router.push("/clients/new")}
        resources={dashboard.resources}
        services={dashboard.services}
        submitLabel="Save Changes"
        isSaving={isSaving}
        error={saveError}
        onSubmit={async (values) => {
          const updatedAppointment = await updateAppointment(values);

          if (updatedAppointment && !Array.isArray(id)) {
            router.replace(`/appointments/${id}`);
          }
        }}
      />
    </View>
  );
}