import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "calrizzler_token";

export function saveToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return Promise.resolve();
  }

  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function getToken() {
  if (Platform.OS === "web") {
    return Promise.resolve(localStorage.getItem(TOKEN_KEY));
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function removeToken() {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return Promise.resolve();
  }

  return SecureStore.deleteItemAsync(TOKEN_KEY);
}