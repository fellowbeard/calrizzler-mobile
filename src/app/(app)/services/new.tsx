import { Redirect, router } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { ServiceForm } from "@/components/forms/ServiceForm";
import { useCreateService } from "@/hooks/useCreateService";

export default function NewServiceScreen() {
  const { user } = useAuth();
  const { createService, error, isSaving } = useCreateService();

  if (!canWrite(user)) {
    return <Redirect href="/services" />;
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>New Service</Text>

      <ServiceForm
        submitLabel="Create Service"
        isSaving={isSaving}
        error={error}
        onSubmit={async (values) => {
          const service = await createService(values);

          if (service) {
            router.replace(`/services/${service.id}`);
          }
        }}
      />
    </View>
  );
}