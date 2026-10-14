import { router } from "expo-router";
import { useState } from "react";
import { Button, FlatList, Pressable, Text, View } from "react-native";

import { apiFetch } from "@/api/client";
import { isOwner } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useServices } from "@/hooks/useServices";
import { formatDuration } from "@/utils/durationFormatting";
import type { Service } from "@/types/service";

export default function ServicesScreen() {
  const { services, archivedServices, error, isLoading, refreshServices } =
    useServices();

  const { user } = useAuth();
  const userCanWrite = isOwner(user);

  const [showArchived, setShowArchived] = useState(false);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [restoreError, setRestoreError] = useState("");

  async function handleToggleArchived() {
    if (!showArchived) {
      await refreshServices(true);
    }

    setShowArchived((current) => !current);
  }

  async function handleRestore(service: Service) {
    try {
      setRestoreError("");
      setIsRestoring(service.id);

      await apiFetch(`/api/v1/services/${service.id}/restore`, {
        method: "PATCH",
      });

      await refreshServices(true);
    } catch (error) {
      setRestoreError(
        error instanceof Error ? error.message : "Unable to restore service."
      );
    } finally {
      setIsRestoring(null);
    }
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <LoadingState message="Loading services..." />;
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      data={services}
      keyExtractor={(service) => String(service.id)}
      contentContainerStyle={{ padding: 24, gap: 12 }}
      ListHeaderComponent={
        userCanWrite ? (
          <Button
            title="New Service"
            onPress={() => router.push("/services/new")}
          />
        ) : null
      }
      ListEmptyComponent={<EmptyState message="No services yet." />}
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
      ListFooterComponent={
        userCanWrite ? (
          <View style={{ marginTop: 24, gap: 12 }}>
            <Button
              title={
                showArchived
                  ? "Hide Archived Services"
                  : "Show Archived Services"
              }
              onPress={handleToggleArchived}
            />

            {showArchived && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                  Archived Services
                </Text>

                {restoreError ? (
                  <Text style={{ color: "red" }}>{restoreError}</Text>
                ) : null}

                {archivedServices.length === 0 ? (
                  <Text>No archived services.</Text>
                ) : (
                  archivedServices.map((service) => (
                    <View
                      key={service.id}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{service.title}</Text>

                      <Text>
                        ${service.price} —{" "}
                        {formatDuration(Number(service.duration_minutes))}
                      </Text>

                      <Button
                        title={
                          isRestoring === service.id
                            ? "Restoring..."
                            : "Restore"
                        }
                        disabled={isRestoring !== null}
                        onPress={() => handleRestore(service)}
                      />
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ) : null
      }
    />
  );
}
