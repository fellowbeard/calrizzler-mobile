import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAuth } from "@/auth/useAuth";

type SettingsItem = {
  title: string;
  description: string;
  path: string;
};

export default function SettingsScreen() {
  const { user } = useAuth();

  const isOwner = user?.role === "owner";
  const canManageSchedule = user?.role === "owner" || user?.role === "staff";

  const items: SettingsItem[] = [
    {
      title: "Business Information",
      description: isOwner
        ? "Manage business information and timezone"
        : "View business information",
      path: "/settings/business",
    },
    {
      title: "Business Hours",
      description: isOwner
        ? "Manage business operating hours"
        : "View business operating hours",
      path: "/settings/business-hours",
    },
    ...(canManageSchedule
      ? [
          {
            title: "My Working Hours",
            description: "Manage your personal availability",
            path: "/settings/my-working-hours",
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            title: "Staff Management",
            description: "Manage staff and invitations",
            path: "/settings/staff",
          },
        ]
      : []),
    {
      title: "My Profile",
      description: "Manage your personal information",
      path: "/settings/profile",
    },
    {
      title: "Password & Security",
      description: "Manage your password",
      path: "/settings/security",
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>
        Settings
      </Text>

      {items.map((item) => (
        <Pressable
          key={item.path}
          onPress={() => router.push(item.path as never)}
          accessibilityRole="button"
          style={{
            borderWidth: 1,
            borderRadius: 8,
            padding: 16,
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "600" }}>{item.title}</Text>

          <Text style={{ opacity: 0.7 }}>{item.description}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
