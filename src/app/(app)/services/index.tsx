import { router } from "expo-router";
import { FlatList, Pressable, Text, View, Button } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/auth/useAuth";
import { canWrite } from "@/auth/permissions";

export default function ServicesScreen() {
  const { services, error, isLoading } = useServices();
  const { user } = useAuth();
  const userCanWrite = canWrite(user);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading services..." />;
  }

  if (services.length === 0) {
    return <EmptyState message="No services found." />;
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
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/services/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open service ${item.title}`}
            style={{ padding: 16, borderBottomWidth: 1 }}
          >
            <Text style={{ fontSize: 18 }}>{item.title}</Text>
            <Text>
              ${item.price} — {item.duration_minutes} min
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}