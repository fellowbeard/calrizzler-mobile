import { Redirect } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";

export default function NewResourceScreen() {
  const { user } = useAuth();

  if (!canWrite(user)) {
    return <Redirect href="/resources" />;
  }

  return (
    <View style={{ padding: 24 }}>
      <Text>New resource coming soon.</Text>
    </View>
  );
}