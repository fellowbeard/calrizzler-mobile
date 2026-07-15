import { router } from "expo-router";
import {
  Drawer,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "expo-router/drawer";

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
  },
] as const;

function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const { signOut } = useAuth();

  async function handleLogout() {
    await signOut();
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1 }}
    >
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
  return (
    <ProtectedRoute>
      <Drawer
        drawerContent={(props) => (
          <CustomDrawerContent {...props} />
        )}
      >
        {drawerRoutes.map((route) => (
          <Drawer.Screen
            key={route.name}
            name={route.name}
            options={{
              title: route.title,
              drawerLabel: route.title,
            }}
            listeners={({ navigation }) => ({
              drawerItemPress: (event) => {
                event.preventDefault();
                navigation.closeDrawer();
                router.replace(route.path);
              },
            })}
          />
        ))}
      </Drawer>
    </ProtectedRoute>
  );
}