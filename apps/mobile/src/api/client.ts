import * as SecureStore from "expo-secure-store";
import * as Sentry from "@sentry/react-native";

const WP_URL = "https://cms.themoveee.com";
const WP_REST = `${WP_URL}/wp-json`;
const CULTURE_API = `${WP_REST}/culture/v1`;
const MOBILE_API  = `${CULTURE_API}/mobile`;

export { WP_URL, CULTURE_API, MOBILE_API };

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: Record<string, unknown>;
  auth?: boolean;
}

// Called when any authenticated request returns 401 — wired up in authStore.
let _onUnauthorized: (() => void) | null = null;
let _handlingUnauthorized = false;
export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

// In-memory token store — avoids writing the JWT to unencrypted AsyncStorage.
// authStore writes to SecureStore (encrypted) and calls setAuthToken() here.
let _authToken: string | null = null;
export function setAuthToken(token: string | null) { _authToken = token; }
export function getAuthToken(): string | null { return _authToken; }

// Almost every call site in this app swallows its own errors (try/catch with
// a silent `catch {}`, ~140 of them across src/) so the UI can fail quietly
// rather than crashing — but that also meant Sentry.captureException was
// never called anywhere except the top-level render ErrorBoundary in
// App.tsx, so real, recurring failures (a 500, a token-resolution bug like
// the one that force-logged-out users picking a book — see the
// directory/quick-create fix) never showed up in Sentry even though the SDK
// itself was initialized and working correctly. Reporting centrally here,
// at the one function nearly every network call in the app funnels
// through, gets coverage for free regardless of whether the caller catches
// and ignores the resulting ApiError. A breadcrumb is left for every
// failure (cheap, gives context on whatever exception follows); a full
// captureException is only sent for failures that indicate a real bug —
// network/fetch failures and 5xx server errors, not ordinary 4xx responses
// (validation errors, "not found", the expected 401-triggers-logout flow)
// which are normal application flow, not something to page on.
function reportApiFailure(url: string, method: string, status: number | "network_error", message: string) {
  Sentry.addBreadcrumb({
    category: "api",
    message: `${method} ${url} → ${status}`,
    level: "warning",
    data: { message },
  });
  const isServerOrNetworkFailure = status === "network_error" || (typeof status === "number" && status >= 500);
  if (isServerOrNetworkFailure) {
    Sentry.captureException(new Error(`API ${method} ${url} failed (${status}): ${message}`));
  }
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = _authToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    reportApiFailure(url, method, "network_error", networkErr instanceof Error ? networkErr.message : String(networkErr));
    throw networkErr;
  }

  if (!res.ok) {
    // Auto-logout on 401 so the user is sent back to login with a fresh token.
    if (res.status === 401 && auth && _onUnauthorized && !_handlingUnauthorized) {
      _handlingUnauthorized = true;
      _onUnauthorized();
      setTimeout(() => { _handlingUnauthorized = false; }, 5000);
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = err?.message ?? res.statusText;
    reportApiFailure(url, method, res.status, message);
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

async function upload<T>(url: string, uri: string, name: string, type: string): Promise<T> {
  const form = new FormData();
  form.append("file", { uri, name, type } as unknown as Blob);

  const headers: Record<string, string> = {};
  const token = _authToken;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, body: form });
  } catch (networkErr) {
    reportApiFailure(url, "POST", "network_error", networkErr instanceof Error ? networkErr.message : String(networkErr));
    throw networkErr;
  }

  if (!res.ok) {
    if (res.status === 401 && _onUnauthorized && !_handlingUnauthorized) {
      _handlingUnauthorized = true;
      _onUnauthorized();
      setTimeout(() => { _handlingUnauthorized = false; }, 5000);
    }
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = err?.message ?? res.statusText;
    reportApiFailure(url, "POST", res.status, message);
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(sanitizeErrorMessage(message));
    this.name = "ApiError";
  }
}

// WordPress's fatal-error handler returns its message as HTML (e.g. "<p>There has
// been a critical error on this website.</p><p><a href=...>Learn more...</a></p>")
// even inside an otherwise well-formed REST error JSON body. Never show that markup
// to the user — collapse it to a generic message instead.
function sanitizeErrorMessage(message: string): string {
  if (/<[a-z][\s\S]*>/i.test(message)) {
    return "Something went wrong on our end. Please try again in a moment.";
  }
  return message;
}

export const api = {
  get: <T>(url: string, auth = true) => request<T>(url, { auth }),
  post: <T>(url: string, body: Record<string, unknown>, auth = true) =>
    request<T>(url, { method: "POST", body, auth }),
  put: <T>(url: string, body: Record<string, unknown>) =>
    request<T>(url, { method: "PUT", body }),
  patch: <T>(url: string, body: Record<string, unknown>) =>
    request<T>(url, { method: "PATCH", body }),
  delete: <T>(url: string, body?: Record<string, unknown>) => request<T>(url, { method: "DELETE", body }),
  upload: <T>(url: string, uri: string, name: string, type: string) => upload<T>(url, uri, name, type),
};
