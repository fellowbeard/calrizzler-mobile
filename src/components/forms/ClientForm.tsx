import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { ValidatedEmailInput } from "@/components/ValidatedEmailInput";
import { formatPhoneNumber } from "@/utils/formValidation";

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
  const [phone, setPhone] = useState(
    formatPhoneNumber(initialValues?.phone || "")
  );

  useEffect(() => {
    if (!initialValues) return;

    setFirstName(initialValues.first_name || "");
    setLastName(initialValues.last_name || "");
    setEmail(initialValues.email || "");
    setPhone(formatPhoneNumber(initialValues.phone || ""));
  }, [initialValues]);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text>First Name</Text>
        <TextInput
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Last Name</Text>
        <TextInput
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />
      </View>

      <ValidatedEmailInput value={email} onChangeText={setEmail} />

      <View style={{ gap: 6 }}>
        <Text>Phone</Text>
        <TextInput
          placeholder="Phone"
          value={phone}
          onChangeText={(value) => setPhone(formatPhoneNumber(value))}
          keyboardType="phone-pad"
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />
      </View>

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

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
