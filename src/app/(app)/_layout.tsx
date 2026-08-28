import { router } from "expo-router";
import {
  Drawer,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "expo-router/drawer";
import { Pressable, Text } from "react-native";

import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { useAuth } from "@/auth/useAuth";

const drawerRoutes = [
  {
    name: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "appointments",
    title: "Appointments",
    path: "/appointments",
  },
  {
    name: "clients",
    title: "Clients",
    path: "/clients",
  },
  {
    name: "services",
    title: "Services",
    path: "/services",
  },
  {
    name: "resources",
    title: "Resources",
    path: "/resources",
  },
  {
    name: "settings",
    title: "Settings",
    path: "/settings",
    ownerOnly: true,
  },
] as const;

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />

      <DrawerItem
        label="Logout"
        onPress={handleLogout}
        style={{ marginTop: "auto" }}
      />
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
        {drawerRoutes.map((route) => {
          const isHidden =
            "ownerOnly" in route && route.ownerOnly && user?.role !== "owner";

          return (
            <Drawer.Screen
              key={route.name}
              name={route.name}
              options={{
                title: route.title,
                headerTitle: () => {
                  const isSectionIndex = [
                    "appointments",
                    "clients",
                    "services",
                    "resources",
                  ].includes(route.name);

                  if (!isSectionIndex) {
                    return (
                      <Text style={{ fontSize: 17, fontWeight: "600" }}>
                        {route.title}
                      </Text>
                    );
                  }

                  return (
                    <Pressable
                      onPress={() => router.replace(route.path)}
                      accessibilityRole="button"
                      accessibilityLabel={`Go to ${route.title}`}
                    >
                      <Text style={{ fontSize: 17, fontWeight: "600" }}>
                        {route.title}
                      </Text>
                    </Pressable>
                  );
                },
                drawerLabel: route.title,
                drawerItemStyle: isHidden ? { display: "none" } : undefined,
              }}
              listeners={({ navigation }) => ({
                drawerItemPress: (event) => {
                  event.preventDefault();
                  navigation.closeDrawer();
                  router.replace(route.path);
                },
              })}
            />
          );
        })}
      </Drawer>
    </ProtectedRoute>
  );
}
