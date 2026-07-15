import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export type ClientFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

type ClientFormInitialValues = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type ClientFormProps = {
  initialValues?: ClientFormInitialValues;
  submitLabel: string;
  isSaving: boolean;
  error?: string;
  onSubmit: (values: ClientFormValues) => void;
};

export function ClientForm({
  initialValues,
  submitLabel,
  isSaving,
  error,
  onSubmit,
}: ClientFormProps) {
  const [firstName, setFirstName] = useState(initialValues?.first_name || "");
  const [lastName, setLastName] = useState(initialValues?.last_name || "");
  const [email, setEmail] = useState(initialValues?.email || "");
  const [phone, setPhone] = useState(initialValues?.phone || "");

  useEffect(() => {
    if (!initialValues) return;

    setFirstName(initialValues.first_name || "");
    setLastName(initialValues.last_name || "");
    setEmail(initialValues.email || "");
    setPhone(initialValues.phone || "");
  }, [initialValues]);

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        placeholder="First name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Last name"
        value={lastName}
        onChangeText={setLastName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      {error ? <Text>{error}</Text> : null}

      <Button
        title={isSaving ? "Saving..." : submitLabel}
        onPress={() =>
          onSubmit({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
          })
        }
        disabled={isSaving}
      />
    </View>
  );
}