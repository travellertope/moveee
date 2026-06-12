import { storage } from "../store/storage";

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

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = storage.getString("auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err?.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

/**
 * Uploads a local file URI as multipart/form-data. `name`/`type` describe the
 * file as React Native's fetch expects for FormData entries.
 */
async function upload<T>(url: string, uri: string, name: string, type: string): Promise<T> {
  const form = new FormData();
  form.append("file", { uri, name, type } as unknown as Blob);

  const headers: Record<string, string> = {};
  const token = storage.getString("auth_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "POST", headers, body: form });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err?.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
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
