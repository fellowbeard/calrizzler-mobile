import { getToken } from "@/auth/tokenStorage";
import { ApiError, apiFetch } from "./client";

jest.mock("@/auth/tokenStorage", () => ({
  getToken: jest.fn(),
}));

describe("apiFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getToken as jest.Mock).mockResolvedValue("token-123");
  });

  it("adds the token and parses a successful response", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(apiFetch<{ id: number }>("/api/v1/me")).resolves.toEqual({ id: 1 });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("omits auth for public requests", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: "new-token" }), { status: 200 })
    );

    await apiFetch("/api/v1/login", { method: "POST", auth: false });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/login",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
    );
    expect(getToken).not.toHaveBeenCalled();
  });

  it("turns API errors into ApiError with validation details", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "validation_failed",
            message: "Validation failed.",
            details: { first_name: [{ type: "blank", message: "First name can't be blank" }] },
          },
        }),
        { status: 422 }
      )
    );

    await expect(apiFetch("/api/v1/clients", { method: "POST" })).rejects.toEqual(
      expect.objectContaining({
        status: 422,
        code: "validation_failed",
        message: "Validation failed.",
        details: { first_name: [{ type: "blank", message: "First name can't be blank" }] },
      })
    );
  });

  it("uses a fallback error when the server returns no JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response("", { status: 503, statusText: "Unavailable" })
    );

    await expect(apiFetch("/api/v1/dashboard")).rejects.toEqual(
      expect.objectContaining({ status: 503, code: "request_failed", message: "Unavailable" })
    );

    try {
      await apiFetch("/api/v1/dashboard");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }
  });
});
