import { router } from "expo-router";
import { FlatList, Pressable, Text, View, Button } from "react-native";

import { isOwner } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useServices } from "@/hooks/useServices";
import { formatDuration } from "@/utils/durationFormatting";

export default function ServicesScreen() {
  const { services, error, isLoading } = useServices();
  const { user } = useAuth();
  const userCanWrite = isOwner(user);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading services..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      {userCanWrite && (
        <View style={{ padding: 24, paddingBottom: 0 }}>
          <Button
            title="New Service"
            onPress={() => router.push("/services/new")}
          />
        </View>
      )}

      {services.length === 0 ? (
        <EmptyState message="No services yet." />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(service) => String(service.id)}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item: service }) => (
            <Pressable
              onPress={() => router.push(`/services/${service.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open service ${service.title}`}
              style={{ padding: 16, borderBottomWidth: 1 }}
            >
              <Text style={{ fontSize: 18 }}>{service.title}</Text>

              <Text>
                ${service.price} —{" "}
                {formatDuration(Number(service.duration_minutes))}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
