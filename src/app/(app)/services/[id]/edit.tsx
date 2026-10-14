import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Alert, Button, Text, View } from "react-native";

import { isOwner } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ServiceForm } from "@/components/forms/ServiceForm";
import { LoadingState } from "@/components/LoadingState";
import { useService } from "@/hooks/useService";
import { useUpdateService } from "@/hooks/useUpdateService";
import { useArchiveService } from "@/hooks/useArchiveService";

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { service, error: loadError, isLoading } = useService(id);
  const { updateService, error: saveError, isSaving } = useUpdateService(id);
  const {
    archiveService,
    error: archiveError,
    isArchiving,
  } = useArchiveService();

  if (!isOwner(user)) {
    return <Redirect href="/services" />;
  }

  if (loadError) {
    return <ErrorState message={loadError} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading service..." />;
  }

  if (!service) {
    return <EmptyState message="Service not found." />;
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>Edit Service</Text>

      <ServiceForm
        initialValues={service}
        submitLabel="Save Changes"
        isSaving={isSaving}
        error={saveError}
        onSubmit={async (values) => {
          const updatedService = await updateService(values);

          if (updatedService && !Array.isArray(id)) {
            router.replace(`/services/${id}`);
          }
        }}
      />
      {archiveError ? (
        <Text style={{ color: "red" }}>{archiveError}</Text>
      ) : null}

      <Button
        title={isArchiving ? "Archiving..." : "Archive Service"}
        disabled={isArchiving || isSaving}
        onPress={() => {
          Alert.alert(
            "Archive Service",
            "This service will be removed from the active list. You can restore it later.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Archive",
                style: "destructive",
                onPress: async () => {
                  if (Array.isArray(id) || !id) return;

                  const success = await archiveService(Number(id));

                  if (success) {
                    router.replace("/services");
                  }
                },
              },
            ]
          );
        }}
      />
    </View>
  );
}
