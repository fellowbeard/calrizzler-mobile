import { useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { ValidatedEmailInput } from "@/components/ValidatedEmailInput";

export default function StaffManagementScreen() {
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleInvite() {
    if (user?.role !== "owner" || isSending) return;

    setInviteError("");
    setInviteSuccessMessage("");
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
      setInviteSuccessMessage("Invitation sent.");
    } catch (requestError: any) {
      setInviteError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );
    } finally {
      setIsSending(false);
    }
  }

  if (user?.role !== "owner") {
    return (
      <View style={{ padding: 24 }}>
        <Text>Only account owners can manage staff.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Staff Management</Text>

      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Invite User</Text>

        <ValidatedEmailInput value={email} onChangeText={setEmail} />

        <View
          style={{
            borderWidth: 1,
            borderRadius: 8,
          }}
        >
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value)}
            enabled={!isSending}
          >
            <Picker.Item label="Staff" value="staff" />
            <Picker.Item label="Read Only" value="read_only" />
          </Picker>
        </View>

        {inviteError ? (
          <Text style={{ color: "red" }}>{inviteError}</Text>
        ) : null}

        {inviteSuccessMessage ? <Text>{inviteSuccessMessage}</Text> : null}

        <Button
          title={isSending ? "Sending..." : "Send Invitation"}
          onPress={handleInvite}
          disabled={isSending || !email.trim()}
        />
      </View>
    </ScrollView>
  );
}
