import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useCreateAppointment } from "@/hooks/useCreateAppointment";
import { useDashboard } from "@/hooks/useDashboard";

export default function NewAppointmentScreen() {
  const { user } = useAuth();
  const { dashboard, error: dashboardError, isLoading } = useDashboard();
  const {
    createAppointment,
    error: saveError,
    fieldErrors,
    isSaving,
  } = useCreateAppointment();
  const { clientId } = useLocalSearchParams<{
    clientId?: string;
  }>();

  if (!canWrite(user)) {
    return <Redirect href="/appointments" />;
  }

  if (dashboardError) {
    return <ErrorState message={dashboardError} />;
  }

  if (isLoading || !dashboard) {
    return <LoadingState message="Loading appointment form..." />;
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>New Appointment</Text>

      <AppointmentForm
        initialClientId={clientId}
        clients={dashboard.clients}
        resources={dashboard.resources}
        services={dashboard.services}
        submitLabel="Create Appointment"
        isSaving={isSaving}
        error={saveError}
        fieldErrors={fieldErrors}
        onNewClient={() =>
          router.push({
            pathname: "/clients/new",
            params: {
              fromAppointment: "true",
            },
          })
        }
        onSubmit={async (values) => {
          const appointment = await createAppointment(values);

          if (appointment) {
            router.replace(`/appointments/${appointment.id}`);
          }
        }}
      />
    </View>
  );
}
