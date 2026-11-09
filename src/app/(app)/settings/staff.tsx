import { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { ValidatedEmailInput } from "@/components/ValidatedEmailInput";

type StaffUser = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: "owner" | "staff" | "read_only";
  active: boolean;
};

export default function StaffManagementScreen() {
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffError, setStaffError] = useState("");
  const [staffSuccessMessage, setStaffSuccessMessage] = useState("");
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== "owner") return;

    let active = true;

    async function loadUsers() {
      try {
        const data = await apiFetch("/api/v1/users");

        if (active) {
          setUsers(data as StaffUser[]);
        }
      } catch (requestError: any) {
        if (active) {
          setStaffError(requestError.message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [user?.role]);

  async function handleInvite() {
    if (user?.role !== "owner" || isSending) return;

    setInviteError("");
    setInviteSuccessMessage("");
    setIsSending(true);

    try {
      await apiFetch("/api/v1/user_invitations", {
        method: "POST",
        body: JSON.stringify({
          invitation: {
            email,
            role: "staff",
          },
        }),
      });

      setEmail("");
      setInviteSuccessMessage("Invitation sent.");
    } catch (requestError: any) {
      setInviteError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleRoleChange(
    staffUser: StaffUser,
    newRole: "owner" | "staff"
  ) {
    if (
      user?.role !== "owner" ||
      staffUser.id === user.id ||
      !staffUser.active ||
      savingUserId !== null ||
      staffUser.role === newRole
    ) {
      return;
    }

    setSavingUserId(staffUser.id);
    setStaffError("");
    setStaffSuccessMessage("");

    try {
      const updatedUser = (await apiFetch(
        `/api/v1/users/${staffUser.id}/update_role`,
        {
          method: "PATCH",
          body: JSON.stringify({
            user: { role: newRole },
          }),
        }
      )) as StaffUser;

      setUsers((previous) =>
        previous.map((item) =>
          item.id === updatedUser.id ? updatedUser : item
        )
      );

      setStaffSuccessMessage("User role updated.");
    } catch (requestError: any) {
      setStaffError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );
    } finally {
      setSavingUserId(null);
    }
  }

  function confirmRoleChange(staffUser: StaffUser, newRole: "owner" | "staff") {
    if (staffUser.role === newRole) return;

    if (newRole === "owner") {
      Alert.alert(
        "Assign Owner Role",
        `Give ${staffUser.email} owner permissions?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Assign Owner",
            onPress: () => handleRoleChange(staffUser, newRole),
          },
        ]
      );
      return;
    }

    handleRoleChange(staffUser, newRole);
  }

  function handleDeactivate(staffUser: StaffUser) {
    if (
      user?.role !== "owner" ||
      staffUser.id === user.id ||
      !staffUser.active ||
      savingUserId !== null
    ) {
      return;
    }

    Alert.alert(
      "Deactivate User",
      `Deactivate ${staffUser.email}? They will no longer be able to access the account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            setSavingUserId(staffUser.id);
            setStaffError("");
            setStaffSuccessMessage("");

            try {
              await apiFetch(`/api/v1/users/${staffUser.id}`, {
                method: "DELETE",
              });

              setUsers((previous) =>
                previous.map((item) =>
                  item.id === staffUser.id ? { ...item, active: false } : item
                )
              );

              setStaffSuccessMessage("User deactivated.");
            } catch (requestError: any) {
              setStaffError(
                requestError.validationErrors?.[0]?.message ||
                  requestError.message
              );
            } finally {
              setSavingUserId(null);
            }
          },
        },
      ]
    );
  }

  if (user?.role !== "owner") {
    return (
      <View style={{ padding: 24 }}>
        <Text>Only account owners can manage staff.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Staff Management</Text>

      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Invite Staff</Text>

        <ValidatedEmailInput value={email} onChangeText={setEmail} />

        {inviteError ? (
          <Text style={{ color: "red" }}>{inviteError}</Text>
        ) : null}

        {inviteSuccessMessage ? <Text>{inviteSuccessMessage}</Text> : null}

        <Button
          title={isSending ? "Sending..." : "Send Invitation"}
          onPress={handleInvite}
          disabled={isSending || !email.trim()}
        />
      </View>

      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Current Staff</Text>

        {staffError ? <Text style={{ color: "red" }}>{staffError}</Text> : null}

        {staffSuccessMessage ? <Text>{staffSuccessMessage}</Text> : null}

        {isLoading ? <Text>Loading staff...</Text> : null}

        {!isLoading && users.length === 0 ? (
          <Text>No staff members found.</Text>
        ) : null}

        {!isLoading &&
          users.map((staffUser) => {
            const isSelf = staffUser.id === user.id;
            const canManage =
              !isSelf && staffUser.active && savingUserId === null;

            const name =
              [staffUser.first_name, staffUser.last_name]
                .filter(Boolean)
                .join(" ") || staffUser.email;

            return (
              <View
                key={staffUser.id}
                style={{
                  borderWidth: 1,
                  borderColor: "#2424B0",
                  borderRadius: 8,
                  padding: 16,
                  gap: 10,
                }}
              >
                <Text style={{ fontWeight: "600", fontSize: 16 }}>{name}</Text>

                <Text>{staffUser.email}</Text>

                <Text>Status: {staffUser.active ? "Active" : "Inactive"}</Text>

                {staffUser.active && !isSelf ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderRadius: 8,
                    }}
                  >
                    <Picker
                      selectedValue={staffUser.role}
                      enabled={canManage}
                      onValueChange={(value) =>
                        confirmRoleChange(staffUser, value as "owner" | "staff")
                      }
                    >
                      <Picker.Item label="Owner" value="owner" />
                      <Picker.Item label="Staff" value="staff" />
                      {staffUser.role === "read_only" && (
                        <Picker.Item
                          label="Read Only (Development)"
                          value="read_only"
                          enabled={false}
                        />
                      )}
                    </Picker>
                  </View>
                ) : (
                  <Text>
                    Role:{" "}
                    {staffUser.role === "owner"
                      ? "Owner"
                      : staffUser.role === "staff"
                        ? "Staff"
                        : "Read Only (Development)"}
                  </Text>
                )}

                {isSelf ? <Text>Your account</Text> : null}

                {!isSelf && staffUser.active ? (
                  <Button
                    title={
                      savingUserId === staffUser.id ? "Saving..." : "Deactivate"
                    }
                    onPress={() => handleDeactivate(staffUser)}
                    disabled={!canManage}
                    color="#FF6B1A"
                  />
                ) : null}
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}
