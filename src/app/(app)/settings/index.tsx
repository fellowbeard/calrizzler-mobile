import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";

export default function SettingsScreen() {
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (user?.role !== "owner") {
    return (
      <View style={{ padding: 24 }}>
        <Text>Only account owners can access account settings.</Text>
      </View>
    );
  }

  async function handleInvite() {
    setError("");
    setSuccessMessage("");
    setIsSending(true);

    try {
      await apiFetch("/api/v1/user_invitations", {
        method: "POST",
        body: JSON.stringify({
          invitation: {
            email,
            role,
          },
        }),
      });

      setEmail("");
      setRole("staff");
      setSuccessMessage("Invitation sent.");
    } catch (requestError: any) {
      setError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Account Settings</Text>

      <Text style={{ fontSize: 18, fontWeight: "600" }}>Invite User</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
        }}
      />

      <View
        style={{
          borderWidth: 1,
          borderRadius: 8,
        }}
      >
        <Picker selectedValue={role} onValueChange={(value) => setRole(value)}>
          <Picker.Item label="Staff" value="staff" />
          <Picker.Item label="Read Only" value="read_only" />
        </Picker>
      </View>

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      {successMessage ? <Text>{successMessage}</Text> : null}

      <Button
        title={isSending ? "Sending..." : "Send Invitation"}
        onPress={handleInvite}
        disabled={isSending}
      />
    </View>
  );
}
