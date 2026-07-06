import { useState } from "react";
import { router } from "expo-router";
import { Button, Text, TextInput, View } from "react-native";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import type { LoginResponse } from "@/types/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();

  async function handleLogin() {
    setError("");
    setIsLoading(true);

    try {
      const data = await apiFetch<LoginResponse>("/api/v1/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          password,
        }),
      });

      await signIn(data.token);

      router.replace("/dashboard");
    } catch (error: any) {
      setError(error.message);
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
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>
        ServiceBook
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
        }}
      />

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      <Button
        title={isLoading ? "Logging in..." : "Log In"}
        onPress={handleLogin}
        disabled={isLoading}
      />
    </View>
  );
}