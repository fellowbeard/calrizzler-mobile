import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text, TextInput, View } from "react-native";

import { apiFetch } from "@/api/client";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleResetPassword() {
    setError("");

    if (!token) {
      setError("Invalid or missing password reset link.");
      return;
    }

    if (!password || !passwordConfirmation) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await apiFetch<{ message: string }>("/api/v1/password_resets/confirm", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      setIsComplete(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset your password."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isComplete) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>Password Reset</Text>

        <Text>Your password has been reset successfully.</Text>

        <Button title="Back to Login" onPress={() => router.replace("/")} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Reset Password</Text>

      {!token ? (
        <Text style={{ color: "red" }}>
          Invalid or missing password reset link.
        </Text>
      ) : (
        <>
          <TextInput
            placeholder="New Password"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              padding: 12,
              borderRadius: 8,
            }}
          />

          <TextInput
            placeholder="Confirm New Password"
            secureTextEntry
            autoComplete="new-password"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            style={{
              borderWidth: 1,
              padding: 12,
              borderRadius: 8,
            }}
          />

          {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

          <Button
            title={isLoading ? "Resetting..." : "Reset Password"}
            onPress={handleResetPassword}
            disabled={isLoading}
          />
        </>
      )}

      <Button title="Back to Login" onPress={() => router.replace("/")} />
    </View>
  );
}
