import { router } from "expo-router";
import { FlatList, Pressable, Text, View, Button } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useResources } from "@/hooks/useResources";
import { useAuth } from "@/auth/useAuth";

export default function ResourcesScreen() {
  const { resources, error, isLoading } = useResources();
  const { user } = useAuth();

  const isOwner = user?.role === "owner";

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading resources..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isOwner && (
        <View style={{ padding: 24, paddingBottom: 0 }}>
          <Button
            title="New Resource"
            onPress={() => router.push("/resources/new")}
          />
        </View>
      )}

      {resources.length === 0 ? (
        <EmptyState message="No resources yet." />
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => {
            if (!isOwner) {
              return (
                <View
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{item.name}</Text>
                </View>
              );
            }

            return (
              <Pressable
                onPress={() => router.push(`/resources/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open resource ${item.name}`}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                }}
              >
                <Text style={{ fontSize: 18 }}>{item.name}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
