import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export type ServiceFormValues = {
  title: string;
  price: string;
  duration_minutes: string;
  description: string;
};

type ServiceFormInitialValues = {
  title?: string | null;
  price?: string | number | null;
  duration_minutes?: string | number;
  description?: string | null;
};

type ServiceFormProps = {
  initialValues?: ServiceFormInitialValues;
  submitLabel: string;
  isSaving: boolean;
  error?: string;
  onSubmit: (values: ServiceFormValues) => void;
};

export function ServiceForm({
  initialValues,
  submitLabel,
  isSaving,
  error,
  onSubmit,
}: ServiceFormProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!initialValues) return;

    setTitle(initialValues.title || "");
    setPrice(String(initialValues.price ?? ""));
    setDurationMinutes(String(initialValues.duration_minutes ?? ""));
    setDescription(initialValues.description || "");
  }, [initialValues]);

  return (
    <View style={{ gap: 12 }}>
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
        title={isSaving ? "Saving..." : submitLabel}
        onPress={() =>
          onSubmit({
            title,
            price,
            duration_minutes: durationMinutes,
            description,
          })
        }
        disabled={isSaving}
      />
    </View>
  );
}