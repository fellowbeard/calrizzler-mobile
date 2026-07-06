import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { useCreateService } from "@/hooks/useCreateService";

export default function NewServiceScreen() {
  const { user } = useAuth();
  const { createService, error, isSaving } = useCreateService();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [description, setDescription] = useState("");

  if (!canWrite(user)) {
    return <Redirect href="/services" />;
  }

  async function handleSubmit() {
    const service = await createService({
      title,
      price,
      duration_minutes: durationMinutes,
      description,
    });

    if (service) {
      router.replace(`/services/${service.id}`);
    }
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>New Service</Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Duration in minutes"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        keyboardType="number-pad"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
          minHeight: 100,
          textAlignVertical: "top",
        }}
      />

      {error ? <Text>{error}</Text> : null}

      <Button
        title={isSaving ? "Saving..." : "Create Service"}
        onPress={handleSubmit}
        disabled={isSaving}
      />
    </View>
  );
}