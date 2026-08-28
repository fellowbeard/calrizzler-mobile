import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { ValidatedEmailInput } from "@/components/ValidatedEmailInput";
import { TIMEZONE_OPTIONS } from "@/utils/dateFormatting";

export default function SettingsScreen() {
  const { user, account, refreshAccount } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState("");

  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!account) return;

    setBusinessName(account.business_name ?? "");
    setTimezone(account.timezone ?? "America/Denver");
  }, [account]);

  if (user?.role !== "owner") {
    return (
      <View style={{ padding: 24 }}>
        <Text>Only account owners can access account settings.</Text>
      </View>
    );
  }

  async function handleSaveSettings() {
    setSettingsError("");
    setSettingsSuccessMessage("");
    setIsSavingSettings(true);

    try {
      await apiFetch("/api/v1/account", {
        method: "PATCH",
        body: JSON.stringify({
          account: {
            business_name: businessName,
            timezone,
          },
        }),
      });

      await refreshAccount();

      setSettingsSuccessMessage("Account settings updated.");
    } catch (requestError: any) {
      setSettingsError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleInvite() {
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

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Account Settings</Text>

      <View style={{ gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text>Business Name</Text>

          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Business name"
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text>Timezone</Text>

          <View
            style={{
              borderWidth: 1,
              borderRadius: 8,
            }}
          >
            <Picker
              selectedValue={timezone}
              onValueChange={(value) => setTimezone(value)}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {settingsError ? (
          <Text style={{ color: "red" }}>{settingsError}</Text>
        ) : null}

        {settingsSuccessMessage ? <Text>{settingsSuccessMessage}</Text> : null}

        <Button
          title={isSavingSettings ? "Saving..." : "Save Settings"}
          onPress={handleSaveSettings}
          disabled={isSavingSettings}
        />
      </View>

      <View
        style={{
          borderTopWidth: 1,
          paddingTop: 24,
          gap: 12,
        }}
      >
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
          disabled={isSending}
        />
      </View>
    </ScrollView>
  );
}
