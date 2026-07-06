import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Text, View, Button, TextInput } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";
import { useCreateClient } from "@/hooks/useCreateClient";


export default function NewClientScreen() {
  const { user } = useAuth();
  const { createClient, error, isSaving } = useCreateClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");


  if (!canWrite(user)) {
    return <Redirect href="/clients" />;
  }

  async function handleSubmit() {
    const client = await createClient({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
    });

    if (client) {
      router.replace(`/clients/${client.id}`);
    }
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28 }}>New Client</Text>

      <TextInput placeholder="First name" value={firstName} onChangeText={setFirstName} style={{ borderWidth: 1, padding: 12, borderRadius: 8 }} />

      <TextInput placeholder="Last name" value={lastName} onChangeText={setLastName} style={{ borderWidth: 1, padding: 12, borderRadius: 8 }} />

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ borderWidth: 1, padding: 12, borderRadius: 8 }} />

      <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ borderWidth: 1, padding: 12, borderRadius: 8 }} />

      {error ? <Text>{error}</Text> : null}

      <Button title={isSaving ? "Saving..." : "Create Client"} onPress={handleSubmit} disabled={isSaving} />
    </View>
  );
}