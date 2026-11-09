import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import {
  Button,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { apiFetch } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { TIMEZONE_OPTIONS } from "@/utils/dateFormatting";

type WorkingHour = {
  id: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
};

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

function formatTime(value: string) {
  const match = String(value ?? "").match(/(\d{2}):(\d{2})/);

  if (!match) return value;

  const hour = Number(match[1]);
  const minute = match[2];

  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
}

export default function BusinessInformationScreen() {
  const { user, account, refreshAccount } = useAuth();

  const isOwner = user?.role === "owner";

  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState("");

  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoadingHours, setIsLoadingHours] = useState(true);
  const [hoursError, setHoursError] = useState("");

  useEffect(() => {
    if (!account) return;

    setBusinessName(account.business_name ?? "");
    setTimezone(account.timezone ?? "America/Denver");
  }, [account]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setIsLoadingHours(true);
      setHoursError("");

      apiFetch("/api/v1/working_hours")
        .then((response) => {
          if (!active) return;

          setWorkingHours(response as WorkingHour[]);
        })
        .catch((requestError: Error) => {
          if (active) setHoursError(requestError.message);
        })
        .finally(() => {
          if (active) setIsLoadingHours(false);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  async function handleSaveSettings() {
    if (!isOwner || isSavingSettings) return;

    setSettingsError("");
    setSettingsSuccessMessage("");
    setIsSavingSettings(true);

    try {
      await apiFetch("/api/v1/account", {
        method: "PATCH",
        body: JSON.stringify({
          account: {
            business_name: businessName,
            timezone,
          },
        }),
      });

      await refreshAccount();

      setSettingsSuccessMessage("Business information updated.");
    } catch (requestError: any) {
      setSettingsError(
        requestError.validationErrors?.[0]?.message || requestError.message
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Business Information
      </Text>

      {!isOwner && (
        <Text>Only account owners can edit business information.</Text>
      )}

      <View style={{ gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text>Business Name</Text>

          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            editable={isOwner && !isSavingSettings}
            placeholder="Business name"
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              opacity: isOwner ? 1 : 0.6,
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text>Timezone</Text>

          <View
            style={{
              borderWidth: 1,
              borderRadius: 8,
              opacity: isOwner ? 1 : 0.6,
            }}
          >
            <Picker
              selectedValue={timezone}
              onValueChange={(value) => setTimezone(value)}
              enabled={isOwner && !isSavingSettings}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {settingsError ? (
          <Text style={{ color: "red" }}>{settingsError}</Text>
        ) : null}

        {settingsSuccessMessage ? <Text>{settingsSuccessMessage}</Text> : null}

        {isOwner && (
          <Button
            title={isSavingSettings ? "Saving..." : "Save Settings"}
            onPress={handleSaveSettings}
            disabled={isSavingSettings}
          />
        )}
      </View>

      <View
        style={{
          borderTopWidth: 1,
          paddingTop: 24,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "600" }}>Business Hours</Text>

        {isLoadingHours ? (
          <Text>Loading business hours...</Text>
        ) : hoursError ? (
          <Text style={{ color: "red" }}>{hoursError}</Text>
        ) : workingHours.length === 0 ? (
          <Text>No business hours configured.</Text>
        ) : (
          DAYS.map((day) => {
            const ranges = workingHours
              .filter((record) => Number(record.day_of_week) === day.value)
              .sort((a, b) => a.opens_at.localeCompare(b.opens_at));

            return (
              <View
                key={day.value}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {day.label}
                </Text>

                <View style={{ flex: 2, alignItems: "flex-end" }}>
                  {ranges.length === 0 ? (
                    <Text>Closed</Text>
                  ) : (
                    ranges.map((range) => (
                      <Text key={range.id}>
                        {formatTime(range.opens_at)} –{" "}
                        {formatTime(range.closes_at)}
                      </Text>
                    ))
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      <Pressable
        onPress={() => router.push("/settings/business-hours")}
        accessibilityRole="button"
        style={{
          alignSelf: "flex-start",
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            color: "#007AFF",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Edit Business Hours
        </Text>
      </Pressable>
    </ScrollView>
  );
}
