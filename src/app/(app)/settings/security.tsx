import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiFetch, ApiError } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import type { User } from "@/types/user";

export default function SecurityScreen() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function changePassword() {
    if (!user || isSaving) return;

    setError("");

    if (!currentPassword || !newPassword || !passwordConfirmation) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword !== passwordConfirmation) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);

    try {
      await apiFetch<User>(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          user: {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: passwordConfirmation,
          },
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");

      Alert.alert("Success", "Your password has been updated.");
    } catch (requestError) {
      console.error("Password update failed:", requestError);

      if (requestError instanceof ApiError) {
        setError(
          Object.values(requestError.details ?? {})
            .flat()
            .map((detail) => detail.message)
            .join(", ") || requestError.message
        );
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError(String(requestError));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 16,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Password & Security
      </Text>

      <View style={{ gap: 6 }}>
        <Text>Current Password</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>New Password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Confirm New Password</Text>
        <TextInput
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          style={inputStyle}
        />
      </View>

      {error ? (
        <Text style={{ color: "red" }} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={changePassword}
        disabled={isSaving}
        accessibilityRole="button"
        style={{
          backgroundColor: "#0D0D5B",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          opacity: isSaving ? 0.6 : 1,
        }}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>
            Update Password
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#999",
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
};
