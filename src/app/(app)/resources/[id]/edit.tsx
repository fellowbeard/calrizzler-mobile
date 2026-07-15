import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/auth/useAuth";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useResource } from "@/hooks/useResource";
import { useUpdateResource } from "@/hooks/useUpdateResource"
import { ResourceForm } from "@/components/forms/ResourceForm";

export default function EditResourceScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { resource, error: loadError, isLoading } = useResource(id);
  const { updateResource, error: saveError, isSaving } = useUpdateResource(id);

  if (!canWrite(user)) {
    return <Redirect href="/resources" />;
  }
  if (loadError) {
    return <ErrorState message={loadError} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading resource..." />;
  }

  if (!resource) {
    return <EmptyState message="Resource not found." />;
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>Edit Service</Text>

      <ResourceForm
        initialValues={resource}
        submitLabel="Save Changes"
        isSaving={isSaving}
        error={saveError}
        onSubmit={async (values) => {
          const updatedResource = await updateResource(values);

          if (updatedResource && !Array.isArray(id)) {
            router.replace(`/resources/${id}`);
          }
        }}
      />
    </View>
  );
}