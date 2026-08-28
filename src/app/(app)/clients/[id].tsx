import { useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text, TextInput, View } from "react-native";

import { apiFetch } from "@/api/client";
import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { useClient } from "@/hooks/useClient";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { ProtectedRoute } from "@/auth/ProtectedRoute";

export default function ClientDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();

  const { client, error, refetch } = useClient(id);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState("");

  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState("");

  const [noteError, setNoteError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!client) {
    return <LoadingState message="Loading client..." />;
  }

  const clientId = client.id;

  const sortedNotes = [...client.notes].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  function startAddingNote() {
    setEditingNoteId(null);
    setEditingBody("");
    setNoteError("");
    setNewNoteBody("");
    setIsAddingNote(true);
  }

  function cancelAddingNote() {
    setIsAddingNote(false);
    setNewNoteBody("");
    setNoteError("");
  }

  async function addNote() {
    if (!newNoteBody.trim()) {
      setNoteError("Note cannot be blank.");
      return;
    }

    setNoteError("");
    setIsSavingNote(true);

    try {
      await apiFetch("/api/v1/notes", {
        method: "POST",
        body: JSON.stringify({
          note: {
            client_id: clientId,
            body: newNoteBody.trim(),
          },
        }),
      });

      await refetch();

      setNewNoteBody("");
      setIsAddingNote(false);
    } catch (requestError: any) {
      setNoteError(
        requestError.validationErrors?.[0]?.message ||
          requestError.message ||
          "Unable to add note."
      );
    } finally {
      setIsSavingNote(false);
    }
  }

  function startEditingNote(noteId: number, body: string) {
    setIsAddingNote(false);
    setNewNoteBody("");
    setEditingNoteId(noteId);
    setEditingBody(body);
    setNoteError("");
  }

  function cancelEditingNote() {
    setEditingNoteId(null);
    setEditingBody("");
    setNoteError("");
  }

  async function saveNote(noteId: number) {
    if (!editingBody.trim()) {
      setNoteError("Note cannot be blank.");
      return;
    }

    setNoteError("");
    setIsSavingNote(true);

    try {
      await apiFetch(`/api/v1/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify({
          note: {
            body: editingBody.trim(),
          },
        }),
      });

      await refetch();

      setEditingNoteId(null);
      setEditingBody("");
    } catch (requestError: any) {
      setNoteError(
        requestError.validationErrors?.[0]?.message ||
          requestError.message ||
          "Unable to update note."
      );
    } finally {
      setIsSavingNote(false);
    }
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

        <View
          style={{
            marginTop: 20,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 20 }}>Notes</Text>

          {canWrite(user) && !isAddingNote ? (
            <Button title="Add Note" onPress={startAddingNote} />
          ) : null}

          {isAddingNote ? (
            <View style={{ gap: 8 }}>
              <TextInput
                placeholder="Add a note..."
                value={newNoteBody}
                onChangeText={setNewNoteBody}
                multiline
                style={{
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 90,
                  textAlignVertical: "top",
                }}
              />

              {noteError ? (
                <Text style={{ color: "red" }}>{noteError}</Text>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Button
                    title={isSavingNote ? "Saving..." : "Save Note"}
                    onPress={addNote}
                    disabled={isSavingNote}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    onPress={cancelAddingNote}
                    disabled={isSavingNote}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {sortedNotes.length === 0 ? (
            <Text>No notes yet.</Text>
          ) : (
            sortedNotes.map((note) => {
              const isEditing = editingNoteId === note.id;

              return (
                <View
                  key={note.id}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#ddd",
                    gap: 8,
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>
                    {new Date(note.created_at).toLocaleDateString()}
                  </Text>

                  {isEditing ? (
                    <>
                      <TextInput
                        value={editingBody}
                        onChangeText={setEditingBody}
                        multiline
                        style={{
                          borderWidth: 1,
                          borderRadius: 8,
                          padding: 12,
                          minHeight: 90,
                          textAlignVertical: "top",
                        }}
                      />

                      {noteError ? (
                        <Text style={{ color: "red" }}>{noteError}</Text>
                      ) : null}

                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Button
                            title={isSavingNote ? "Saving..." : "Save"}
                            onPress={() => saveNote(note.id)}
                            disabled={isSavingNote}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Button
                            title="Cancel"
                            onPress={cancelEditingNote}
                            disabled={isSavingNote}
                          />
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text>{note.body}</Text>

                      {canWrite(user) ? (
                        <Button
                          title="Edit"
                          onPress={() => startEditingNote(note.id, note.body)}
                        />
                      ) : null}
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
}
