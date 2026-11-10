import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { ValidatedEmailInput } from "@/components/ValidatedEmailInput";
import { formatPhoneNumber } from "@/utils/formValidation";

export type ClientFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
};

type ClientFormInitialValues = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
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

  const [addressLine1, setAddressLine1] = useState(
    initialValues?.address_line1 || ""
  );
  const [addressLine2, setAddressLine2] = useState(
    initialValues?.address_line2 || ""
  );
  const [city, setCity] = useState(initialValues?.city || "");
  const [state, setState] = useState(initialValues?.state || "");
  const [postalCode, setPostalCode] = useState(
    initialValues?.postal_code || ""
  );

  useEffect(() => {
    if (!initialValues) return;

    setFirstName(initialValues.first_name || "");
    setLastName(initialValues.last_name || "");
    setEmail(initialValues.email || "");
    setPhone(formatPhoneNumber(initialValues.phone || ""));

    setAddressLine1(initialValues.address_line1 || "");
    setAddressLine2(initialValues.address_line2 || "");
    setCity(initialValues.city || "");
    setState(initialValues.state || "");
    setPostalCode(initialValues.postal_code || "");
  }, [initialValues]);

  const inputStyle = {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text>First Name</Text>
        <TextInput
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Last Name</Text>
        <TextInput
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
          style={inputStyle}
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
          style={inputStyle}
        />
      </View>

      <Text style={{ fontWeight: "bold", marginTop: 12 }}>
        Address (Optional)
      </Text>

      <View style={{ gap: 6 }}>
        <Text>Street Address</Text>
        <TextInput
          placeholder="Street address"
          value={addressLine1}
          onChangeText={setAddressLine1}
          autoComplete="street-address"
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Apartment / Suite</Text>
        <TextInput
          placeholder="Apartment, suite, unit"
          value={addressLine2}
          onChangeText={setAddressLine2}
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>City</Text>
        <TextInput
          placeholder="City"
          value={city}
          onChangeText={setCity}
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>State</Text>
        <TextInput
          placeholder="State"
          value={state}
          onChangeText={setState}
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>ZIP / Postal Code</Text>
        <TextInput
          placeholder="ZIP / Postal Code"
          value={postalCode}
          onChangeText={setPostalCode}
          autoComplete="postal-code"
          style={inputStyle}
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
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            state,
            postal_code: postalCode,
          })
        }
        disabled={isSaving}
      />
    </View>
  );
}
