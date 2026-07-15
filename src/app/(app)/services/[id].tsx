import { Link, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text } from "react-native";
import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useService } from "@/hooks/useService";

export default function ServiceDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const { service, error, isLoading } = useService(id);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading service..." />;
  }

  if (!service) {
    return <EmptyState message="Service not found." />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>{service.title}</Text>

      {canWrite(user) ? (
        <Link href={`/services/${service.id}/edit`} asChild>
          <Button title="Edit Service" />
        </Link>
      ) : null}

      <Text>Price: ${service.price}</Text>
      <Text>Duration: {service.duration_minutes} minutes</Text>

      <Text style={{ fontSize: 20, marginTop: 16 }}>Description</Text>
      <Text>{service.description || "No description"}</Text>
    </ScrollView>
  );
}