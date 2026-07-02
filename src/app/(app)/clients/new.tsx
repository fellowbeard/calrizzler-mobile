import { Redirect } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";

export default function NewClientScreen() {
  const { user } = useAuth();

  if (!canWrite(user)) {
    return <Redirect href="/clients" />;
  }

  return (
    <View style={{ padding: 24 }}>
      <Text>New client coming soon.</Text>
    </View>
  );
}