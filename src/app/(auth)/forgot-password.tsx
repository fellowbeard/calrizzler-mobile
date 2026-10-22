import { useState } from "react";
import { router } from "expo-router";
import { Button, Text, TextInput, View } from "react-native";

import { apiFetch } from "@/api/client";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await apiFetch<{ message: string }>(
        "/api/v1/password_resets",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      setMessage(response.message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to request a password reset."
      );
    } finally {
      setIsLoading(false);
    }
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
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>Forgot Password</Text>

      <Text>
        Enter your email address and we will send you password reset
        instructions.
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
        }}
      />

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}

      <Button
        title={isLoading ? "Sending..." : "Send Reset Instructions"}
        onPress={handleSubmit}
        disabled={isLoading}
      />

      <Button title="Back to Login" onPress={() => router.back()} />
    </View>
  );
}
