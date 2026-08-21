import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getToken, removeToken, saveToken } from "./tokenStorage";

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("token storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    const values = new Map<string, string>();

    Object.defineProperty(global, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
  });

  it("uses SecureStore on native platforms", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("token-123");

    await saveToken("token-123");
    await expect(getToken()).resolves.toBe("token-123");
    await removeToken();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("calrizzler_token", "token-123");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("calrizzler_token");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("calrizzler_token");
  });

  it("uses localStorage on web", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });

    await saveToken("web-token");

    await expect(getToken()).resolves.toBe("web-token");
    await removeToken();

    expect(localStorage.getItem("calrizzler_token")).toBeNull();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
