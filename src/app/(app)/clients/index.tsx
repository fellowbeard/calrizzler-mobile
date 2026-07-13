import { router } from "expo-router";
import { FlatList, Pressable, Text, Button, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/auth/useAuth";
import { canWrite } from "@/auth/permissions";

export default function ClientsScreen() {
  const { clients, error, isLoading } = useClients();
  const { user } = useAuth();
  const userCanWrite = canWrite(user);
  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading clients..." />;
  }

  if (clients.length === 0) {
    return <EmptyState message="No clients yet." />;
  }

  return (
    <View style={{ flex: 1 }}>
      {userCanWrite && (
        <View style={{ padding: 24, paddingBottom: 0 }}>
          <Button
            title="New Client"
            onPress={() => router.push("/clients/new")}
          />
        </View>
      )}
      <FlatList
        data={clients}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/clients/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open client ${item.first_name} ${item.last_name}`}
            style={{
              padding: 16,
              borderBottomWidth: 1,
            }}
          >
            <Text>
              {item.first_name} {item.last_name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
