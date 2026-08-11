import { getToken } from "../auth/tokenStorage";

const API_BASE_URL = "http://localhost:3000";

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
    details?: ValidationDetails;
  };
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

function buildApiError(
  response: Response,
  data: ApiErrorResponse | null
): ApiError {
  return new ApiError(
    response.status,
    data?.error?.code ?? "request_failed",
    data?.error?.message ?? response.statusText ?? "Request failed.",
    data?.error?.details
  );
}