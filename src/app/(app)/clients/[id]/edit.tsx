import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { useAuth } from "@/auth/useAuth";
import { ErrorState } from "@/components/ErrorState";
import { ClientForm } from "@/components/forms/ClientForm";
import { LoadingState } from "@/components/LoadingState";
import { useClient } from "@/hooks/useClient";
import { useUpdateClient } from "@/hooks/useUpdateClient";

export default function EditClientScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { client, error: loadError } = useClient(id);
  const { updateClient, error: saveError, isSaving } = useUpdateClient(id);

  if (!canWrite(user)) {
    return <Redirect href="/clients" />;
  }

  if (loadError) {
    return <ErrorState message={loadError} />;
  }

  if (!client) {
    return <LoadingState message="Loading client..." />;
  }

  return (
    <ProtectedRoute>
      <View style={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28 }}>Edit Client</Text>

        <ClientForm
          initialValues={client}
          submitLabel="Save Changes"
          isSaving={isSaving}
          error={saveError}
          onSubmit={async (values) => {
            const updatedClient = await updateClient(values);

            if (updatedClient && !Array.isArray(id)) {
              router.replace(`/clients/${id}`);
            }
          }}
        />
      </View>
    </ProtectedRoute>
  );
}