import { getToken } from "../auth/tokenStorage";

const API_BASE_URL = "http://localhost:3000";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details: unknown;
};

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { auth = true, headers, ...fetchOptions } = options;

  const token = auth ? await getToken() : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw buildApiError(response, data);
  }

  return data as T;
}

function buildApiError(response: Response, data: any): ApiError {
  return {
    status: response.status,
    code: data?.error?.code || "request_failed",
    message:
      data?.error?.message ||
      data?.error ||
      data?.message ||
      response.statusText ||
      "Request failed.",
    details: data?.error?.details || null,
  };
}