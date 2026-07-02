import { Redirect } from "expo-router";
import { Text, View } from "react-native";

import { canWrite } from "@/auth/permissions";
import { useAuth } from "@/auth/useAuth";

export default function NewServiceScreen() {
  const { user } = useAuth();

  if (!canWrite(user)) {
    return <Redirect href="/services" />;
  }

  return (
    <View style={{ padding: 24 }}>
      <Text>New service coming soon.</Text>
    </View>
  );
}