import { Link, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text } from "react-native";
import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { useClient } from "@/hooks/useClient";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { ProtectedRoute } from "@/auth/ProtectedRoute";

export default function ClientDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const { client, error } = useClient(id);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!client) {
    return <LoadingState message="Loading client..." />;
  }

  return (
    <ProtectedRoute>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28 }}>
          {client.first_name} {client.last_name}
        </Text>

        <Text>{client.email || "No email"}</Text>
        <Text>{client.phone || "No phone"}</Text>
        {canWrite(user) ? (
          <Link href={`/clients/${client.id}/edit`} asChild>
            <Button title="Edit Client" />
          </Link>
        ) : null}

        <Text style={{ fontSize: 20, marginTop: 20 }}>Notes</Text>

        {client.notes.length === 0 ? (
          <Text>No notes yet.</Text>
        ) : (
          client.notes.map((note) => <Text key={note.id}>{note.body}</Text>)
        )}
      </ScrollView>
    </ProtectedRoute>
  );
}
