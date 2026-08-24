import { Text, View } from "react-native";

import { useAuth } from "@/auth/useAuth";

export default function SettingsScreen() {
  const { user } = useAuth();

  if (user?.role !== "owner") {
    return (
      <View style={{ padding: 24 }}>
        <Text>Only account owners can access account settings.</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 24 }}>
      <Text>Settings</Text>
    </View>
  );
}
