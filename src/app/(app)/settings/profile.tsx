import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";

import { apiFetch, ApiError } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import type { User } from "@/types/user";

type AvatarFile = {
  uri: string;
  name: string;
  type: string;
};

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [avatar, setAvatar] = useState<AvatarFile | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url ?? null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photos to select an avatar."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) return;

    const image = result.assets[0];

    const mimeType = image.mimeType ?? "image/jpeg";

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      Alert.alert("Unsupported image", "Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
      Alert.alert("Image too large", "Choose an image smaller than 5 MB.");
      return;
    }

    setAvatar({
      uri: image.uri,
      name: image.fileName ?? `avatar.${mimeType.split("/")[1]}`,
      type: mimeType,
    });

    setAvatarPreview(image.uri);
  }

  async function saveProfile() {
    if (!user || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("user[first_name]", firstName);
      formData.append("user[last_name]", lastName);
      formData.append("user[email]", email);
      formData.append("user[phone]", phone);
      formData.append("user[bio]", bio);

      if (avatar) {
        const file = new File(avatar.uri);

        formData.append("user[avatar]", file);
      }

      await apiFetch<User>(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        body: formData,
      });

      await refreshUser();
      setAvatar(null);

      Alert.alert("Success", "Your profile has been updated.");
    } catch (requestError) {
      console.error("Profile save failed:", requestError);

      if (requestError instanceof ApiError) {
        setError(
          Object.values(requestError.details ?? {})
            .flat()
            .map((detail) => detail.message)
            .join(", ") || requestError.message
        );
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError(String(requestError));
      }
    } finally {
      setIsSaving(false);
    }
  }
  if (!user) {
    return (
      <View style={{ padding: 24 }}>
        <Text>Please log in first.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 16,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>My Profile</Text>

      <View style={{ alignItems: "center", gap: 12 }}>
        {avatarPreview ? (
          <Image
            source={{ uri: avatarPreview }}
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
            }}
          />
        ) : (
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: "#ddd",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text>No Photo</Text>
          </View>
        )}

        <Pressable
          onPress={pickAvatar}
          accessibilityRole="button"
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
          }}
        >
          <Text>Choose Profile Photo</Text>
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <Text>First Name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Last Name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          style={inputStyle}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[inputStyle, { minHeight: 100 }]}
        />
      </View>

      {error ? (
        <Text style={{ color: "red" }} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={saveProfile}
        disabled={isSaving}
        accessibilityRole="button"
        style={{
          backgroundColor: "#0D0D5B",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          opacity: isSaving ? 0.6 : 1,
        }}
      >
        {isSaving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600" }}>
            Save Profile
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#999",
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
};
