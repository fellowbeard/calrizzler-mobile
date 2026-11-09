import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import {
  ActivityIndicator,
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

type ZipLookupResponse = {
  places?: {
    "place name": string;
    "state abbreviation": string;
  }[];
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

function formatStreetAddress(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export default function BusinessInformationScreen() {
  const { user, account, refreshAccount } = useAuth();

  const isOwner = user?.role === "owner";

  const [isEditing, setIsEditing] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [zipError, setZipError] = useState("");

  const zipRequestId = useRef(0);

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoadingHours, setIsLoadingHours] = useState(true);
  const [hoursError, setHoursError] = useState("");

  useEffect(() => {
    if (!account) return;

    setBusinessName(account.business_name ?? "");
    setTimezone(account.timezone ?? "America/Denver");
    setPhone(account.phone ?? "");
    setAddressLine1(account.address_line1 ?? "");
    setAddressLine2(account.address_line2 ?? "");
    setCity(account.city ?? "");
    setState(account.state ?? "");
    setPostalCode(account.postal_code ?? "");
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

  function resetForm() {
    if (!account) return;

    setBusinessName(account.business_name ?? "");
    setTimezone(account.timezone ?? "America/Denver");
    setPhone(account.phone ?? "");
    setAddressLine1(account.address_line1 ?? "");
    setAddressLine2(account.address_line2 ?? "");
    setCity(account.city ?? "");
    setState(account.state ?? "");
    setPostalCode(account.postal_code ?? "");
  }

  function handleCancelEditing() {
    zipRequestId.current += 1;
    setIsLookingUpZip(false);
    setZipError("");
    resetForm();
    setSettingsError("");
    setIsEditing(false);
  }

  async function handleZipChange(value: string) {
    const zip = value.replace(/\D/g, "").slice(0, 5);

    setPostalCode(zip);
    setZipError("");

    zipRequestId.current += 1;
    const requestId = zipRequestId.current;

    if (zip.length !== 5) {
      setIsLookingUpZip(false);
      return;
    }

    setIsLookingUpZip(true);

    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zip}`);

      if (!response.ok) {
        throw new Error("ZIP code not found.");
      }

      const data: ZipLookupResponse = await response.json();
      const place = data.places?.[0];

      if (!place) {
        throw new Error("No city or state found for this ZIP code.");
      }

      if (requestId !== zipRequestId.current) return;

      setCity(place["place name"]);
      setState(place["state abbreviation"]);
    } catch (requestError) {
      if (requestId !== zipRequestId.current) return;

      setZipError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to look up ZIP code."
      );
    } finally {
      if (requestId === zipRequestId.current) {
        setIsLookingUpZip(false);
      }
    }
  }

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
            phone,
            address_line1: formatStreetAddress(addressLine1),
            address_line2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim().toUpperCase(),
            postal_code: postalCode,
          },
        }),
      });

      zipRequestId.current += 1;
      setIsLookingUpZip(false);

      await refreshAccount();

      setIsEditing(false);
      setZipError("");
      setSettingsSuccessMessage("Business information updated.");
    } catch (requestError: any) {
      setSettingsError(
        requestError.validationErrors?.[0]?.message ||
          requestError.message ||
          "Unable to update business information."
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  const hasContactInformation = Boolean(
    account?.phone ||
    account?.address_line1 ||
    account?.address_line2 ||
    account?.city ||
    account?.state ||
    account?.postal_code
  );

  const cityState = [account?.city, account?.state].filter(Boolean).join(", ");

  const cityStateZip = [cityState, account?.postal_code]
    .filter(Boolean)
    .join(" ");

  const addressLines = [
    account?.address_line1,
    account?.address_line2,
    cityStateZip,
  ].filter(Boolean);

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 24,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        Business Information
      </Text>

      {!isOwner && (
        <Text>Only account owners can edit business information.</Text>
      )}

      {!isEditing ? (
        <View style={{ gap: 18 }}>
          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Business Name</Text>
            <Text style={valueStyle}>
              {account?.business_name || "Not provided"}
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Timezone</Text>
            <Text style={valueStyle}>
              {TIMEZONE_OPTIONS.find(
                (option) => option.value === account?.timezone
              )?.label ??
                account?.timezone ??
                "Not provided"}
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Business Phone</Text>
            <Text style={valueStyle}>{account?.phone || "Not provided"}</Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Business Address</Text>

            {addressLines.length > 0 ? (
              <View>
                {addressLines.map((line, index) => (
                  <Text key={index} style={valueStyle}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={valueStyle}>Not provided</Text>
            )}
          </View>

          {settingsSuccessMessage ? (
            <Text style={{ color: "#1A4040" }} accessibilityRole="alert">
              {settingsSuccessMessage}
            </Text>
          ) : null}

          {isOwner && (
            <Pressable
              onPress={() => {
                resetForm();
                setSettingsError("");
                setSettingsSuccessMessage("");
                setZipError("");
                setIsEditing(true);
              }}
              accessibilityRole="button"
              style={primaryButtonStyle}
            >
              <Text style={primaryButtonTextStyle}>
                {hasContactInformation
                  ? "Update Business Information"
                  : "Add Business Information"}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Business Name</Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              editable={!isSavingSettings}
              placeholder="Business name"
              style={inputStyle}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Timezone</Text>
            <View style={{ borderWidth: 1, borderRadius: 8 }}>
              <Picker
                selectedValue={timezone}
                onValueChange={setTimezone}
                enabled={!isSavingSettings}
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

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Business Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              editable={!isSavingSettings}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="Business phone number"
              style={inputStyle}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Street Address</Text>
            <TextInput
              value={addressLine1}
              onChangeText={setAddressLine1}
              editable={!isSavingSettings}
              autoCapitalize="words"
              autoComplete="street-address"
              placeholder="123 Main Street"
              style={inputStyle}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>Address Line 2</Text>
            <TextInput
              value={addressLine2}
              onChangeText={setAddressLine2}
              editable={!isSavingSettings}
              autoCapitalize="words"
              placeholder="Suite, unit, etc. (optional)"
              style={inputStyle}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>ZIP Code</Text>
            <TextInput
              value={postalCode}
              onChangeText={handleZipChange}
              editable={!isSavingSettings}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="70130"
              style={inputStyle}
            />

            {isLookingUpZip ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" />
                <Text>Looking up ZIP code...</Text>
              </View>
            ) : null}

            {zipError ? (
              <Text style={{ color: "red" }}>
                {zipError} You can enter the city and state manually.
              </Text>
            ) : null}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              editable={!isSavingSettings}
              autoCapitalize="words"
              placeholder="City"
              style={inputStyle}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={labelStyle}>State</Text>
            <TextInput
              value={state}
              onChangeText={setState}
              editable={!isSavingSettings}
              autoCapitalize="characters"
              maxLength={2}
              placeholder="LA"
              style={inputStyle}
            />
          </View>

          {settingsError ? (
            <Text style={{ color: "red" }} accessibilityRole="alert">
              {settingsError}
            </Text>
          ) : null}

          <Button
            title={isSavingSettings ? "Saving..." : "Save Changes"}
            onPress={handleSaveSettings}
            disabled={isSavingSettings}
          />

          <Button
            title="Cancel"
            onPress={handleCancelEditing}
            disabled={isSavingSettings}
          />
        </View>
      )}

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
                <Text style={{ fontWeight: "600", flex: 1 }}>{day.label}</Text>

                <View
                  style={{
                    flex: 2,
                    alignItems: "flex-end",
                  }}
                >
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

      {isOwner && (
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
            {workingHours.length > 0
              ? "Update Business Hours"
              : "Add Business Hours"}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
};

const labelStyle = {
  fontSize: 14,
  fontWeight: "600" as const,
};

const valueStyle = {
  fontSize: 16,
};

const primaryButtonStyle = {
  backgroundColor: "#0D0D5B",
  padding: 14,
  borderRadius: 8,
  alignItems: "center" as const,
};

const primaryButtonTextStyle = {
  color: "white",
  fontWeight: "600" as const,
};
