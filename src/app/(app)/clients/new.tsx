import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { ClientForm } from "@/components/forms/ClientForm";
import { useCreateClient } from "@/hooks/useCreateClient";

export default function NewClientScreen() {
  const { user } = useAuth();
  const { createClient, error, isSaving } = useCreateClient();
  const { fromAppointment } = useLocalSearchParams<{
    fromAppointment?: string;
  }>();

  if (!canWrite(user)) {
    return <Redirect href="/clients" />;
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>New Client</Text>

      <ClientForm
        submitLabel="Create Client"
        isSaving={isSaving}
        error={error}
        onSubmit={async (values) => {
          const client = await createClient(values);

          if (!client) {
            return;
          }

          if (fromAppointment === "true") {
            router.replace({
              pathname: "/appointments/new",
              params: {
                clientId: String(client.id),
              },
            });
            return;
          }

          router.replace(`/clients/${client.id}`);
        }}
      />
    </View>
  );
}
