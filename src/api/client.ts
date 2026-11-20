import { getToken } from "@/auth/tokenStorage";

// Set EXPO_PUBLIC_API_URL in .env.local (gitignored) to reach the API from a phone,
// e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:3000. Must be read with dot notation
// so Expo can inline it at build time.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type ValidationErrorDetail = {
  type: string;
  message: string;
};

export type ValidationDetails = Record<string, ValidationErrorDetail[]>;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: ValidationDetails;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ValidationDetails
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiOptions = RequestInit & {
  auth?: boolean;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, (string | ValidationErrorDetail)[]>;
  };
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { auth = true, headers, ...fetchOptions } = options;

  const token = auth ? await getToken() : null;
  const isFormData = fetchOptions.body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  if (isFormData) {
    delete requestHeaders["Content-Type"];
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw buildApiError(response, data);
  }

  return data as T;
}

function buildApiError(
  response: Response,
  data: ApiErrorResponse | null
): ApiError {
  return new ApiError(
    response.status,
    data?.error?.code ?? "request_failed",
    data?.error?.message ?? response.statusText ?? "Request failed.",
    normalizeValidationDetails(data?.error?.details)
  );
}

function normalizeValidationDetails(
  details: Record<string, (string | ValidationErrorDetail)[]> | undefined
): ValidationDetails | undefined {
  if (!details) return undefined;

  return Object.fromEntries(
    Object.entries(details).map(([field, errors]) => [
      field,
      errors.map((error) =>
        typeof error === "string" ? { type: "invalid", message: error } : error
      ),
    ])
  );
}

// A user-facing message for any thrown error. For validation failures this
// joins the field messages, e.g. "Password is too short (minimum is 8 characters)".
export function errorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) {
    const fieldMessages = Object.values(error.details ?? {})
      .flat()
      .map((detail) => detail.message);

    return fieldMessages.join(", ") || error.message || fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
