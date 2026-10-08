/**
 * Centralized HTTP client for the MediCare Spring Boot backend.
 * Base URL comes from VITE_API_BASE_URL. Auth: JWT bearer token kept IN MEMORY only.
 */
export const API_BASE_URL = (
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? ""
).replace(/\/$/, "");

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const hasAccessToken = () => !!accessToken;

let unauthorizedHandler: (() => void) | null = null;
/** Called when the backend rejects the current token (expired/invalid). */
export const onUnauthorized = (fn: (() => void) | null) => {
  unauthorizedHandler = fn;
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public details?: unknown) {
    super(message);
  }
}

type Opts = Omit<RequestInit, "body"> & { body?: unknown; query?: Record<string, string | number | undefined> | undefined };

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  const { body, query, headers, ...rest } = opts;
  const params = query
    ? new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}${params ? `?${params}` : ""}`, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : null,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the MediCare server. It may be starting up, or this site's address isn't allowed by the server yet.");
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
    const code = obj?.["code"] ? String(obj["code"]) : undefined;
    let msg = (obj?.["message"] as string) || (obj?.["error"] as string) || (typeof data === "string" && data) || res.statusText || "Request failed";
    if (res.status === 401) {
      if (accessToken && code !== "INVALID_CREDENTIALS") {
        accessToken = null;
        unauthorizedHandler?.();
        msg = "Your session has expired. Please log in again.";
      } else if (!accessToken) msg = code === "INVALID_CREDENTIALS" ? msg : "Please log in to view this.";
    }
    if (res.status === 403 && msg === "Invalid CORS request") msg = "The server is not accepting requests from this site address (CORS).";
    throw new ApiError(res.status, msg, code, data);
  }
  return data as T;
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}
