import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useResource } from "@/hooks/useResource";

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams();
  const { resource, error, isLoading } = useResource(id);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading resource..." />;
  }

  if (!resource) {
    return <EmptyState message="Resource not found." />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>{resource.name}</Text>
      <Text>Resource ID: {resource.id}</Text>
    </ScrollView>
  );
}