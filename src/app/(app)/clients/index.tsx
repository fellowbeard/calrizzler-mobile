import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  FlatList,
  Pressable,
  Text,
  Button,
  TextInput,
  View,
} from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/auth/useAuth";
import { canWrite } from "@/auth/permissions";

export default function ClientsScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { clients, error, isLoading } = useClients(debouncedSearch);
  const { user } = useAuth();
  const userCanWrite = canWrite(user);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

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

      <View style={{ padding: 24, paddingBottom: 0 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email, or phone"
          accessibilityLabel="Search clients"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={{
            borderWidth: 1,
            borderColor: "#0D0D5B",
            borderRadius: 8,
            padding: 12,
            backgroundColor: "#F5F5F0",
            color: "#000000",
          }}
        />
      </View>

      {error ? (
        <ErrorState message={error} />
      ) : isLoading ? (
        <LoadingState message="Loading clients..." />
      ) : clients.length === 0 ? (
        <EmptyState
          message={
            debouncedSearch
              ? "No clients match your search."
              : "No clients yet."
          }
        />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
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
      )}
    </View>
  );
}
