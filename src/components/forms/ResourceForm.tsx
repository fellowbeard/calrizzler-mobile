import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export type ResourceFormValues = {
  name: string;
};

type ResourceFormInitialValues = {
  name?: string | null;
};

type ResourceFormProps = {
  initialValues?: ResourceFormInitialValues;
  submitLabel: string;
  isSaving: boolean;
  error?: string;
  onSubmit: (values: ResourceFormValues) => void | Promise<void>;
};

export function ResourceForm({
  initialValues,
  submitLabel,
  isSaving,
  error,
  onSubmit,
}: ResourceFormProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!initialValues) return;

    setName(initialValues.name || "");
  }, [initialValues]);

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />
      {error ? <Text>{error}</Text> : null}

      <Button
        title={isSaving ? "Saving..." : submitLabel}
        onPress={() =>
          onSubmit({
            name,
          })
        }
        disabled={isSaving}
      />



    </View>
  );
}