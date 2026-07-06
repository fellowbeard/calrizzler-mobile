import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { useCreateResource } from "@/hooks/useCreateResource";

export default function NewResourceScreen() {
  const { user } = useAuth();
  const { createResource, error, isSaving } = useCreateResource();

  const [name, setName] = useState("");


  if (!canWrite(user)) {
    return <Redirect href="/resources" />;
  }
  async function handleSubmit() {
    const resource = await createResource({ name });

    if (resource) {
      router.replace(`/resources/${resource.id}`);
    }
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>New Resource</Text>

      <TextInput
        placeholder="Resource name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      {error ? <Text>{error}</Text> : null}

      <Button
        title={isSaving ? "Saving..." : "Create Resource"}
        onPress={handleSubmit}
        disabled={isSaving}
      />
    </View>
  );
}