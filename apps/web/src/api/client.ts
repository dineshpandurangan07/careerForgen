import type { Job, Role, StudentState } from "@careerforge/shared";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  errorCode: string;
  constructor(message: string, status = 0, errorCode = "error") {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "RECRUITER" | "PLACEMENT_OFFICER" | "ADMIN";
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}

async function rawRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(BASE + path, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || json.success === false) {
    throw new ApiError(json.message || res.statusText || "Request failed", res.status, json.errorCode || "error");
  }
  return json.data as T;
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const data = await rawRequest<{ user: PublicUser; accessToken: string }>("POST", "/auth/refresh");
        accessToken = data.accessToken;
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  try {
    return await rawRequest<T>(method, path, body);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && retry && accessToken) {
      const ok = await tryRefresh();
      if (ok) return rawRequest<T>(method, path, body);
    }
    throw err;
  }
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ user: PublicUser; accessToken: string }>("POST", "/auth/register", body, false),
  login: (body: { email: string; password: string }) =>
    request<{ user: PublicUser; accessToken: string }>("POST", "/auth/login", body, false),
  logout: () => request<{ ok: boolean }>("POST", "/auth/logout", undefined, false),
  me: () => request<{ user: PublicUser }>("GET", "/auth/me", undefined, false),
  refresh: () => request<{ user: PublicUser; accessToken: string }>("POST", "/auth/refresh", undefined, false),
  forgot: (email: string) =>
    request<{ ok: boolean; message: string; devToken?: string }>("POST", "/auth/forgot", { email }, false),
  reset: (token: string, password: string) => request<{ ok: boolean }>("POST", "/auth/reset", { token, password }, false),

  getProfile: () => request<{ state: StudentState }>("GET", "/students/profile"),
  putProfile: (state: StudentState) => request<{ state: StudentState }>("PUT", "/students/profile", state),
  resetProfile: () => request<{ state: StudentState }>("POST", "/students/reset"),
  sampleProfile: () => request<{ state: StudentState }>("POST", "/students/sample"),

  listJobs: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return request<{ jobs: Job[]; total: number; page: number; pages: number }>("GET", `/jobs${qs ? `?${qs}` : ""}`);
  },

  apply: (jobId: number | string) => request<{ jobId: number; statusLabel: string }>("POST", `/applications/${jobId}/apply`),
  withdraw: (jobId: number | string) => request<{ jobId: number; statusLabel: string }>("POST", `/applications/${jobId}/withdraw`),

  aiStatus: () => request<{ enabled: boolean }>("GET", "/ai/status"),
  clearChat: () => request<{ ok: boolean }>("POST", "/ai/coach/clear"),
  targetRole: (name: string) => request<{ roleKey: string; role: Role }>("POST", "/ai/target-role", { name }),
  profileReview: () => request<{ text: string }>("POST", "/ai/profile-review"),
  metaRoles: () => request<{ roles: Record<string, Role> }>("GET", "/meta/roles"),
};

export interface StreamHandlers {
  onDelta: (fullText: string) => void;
  signal?: AbortSignal;
}

async function streamSse(path: string, body: unknown, handlers: StreamHandlers): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(BASE + path, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
    signal: handlers.signal,
  });
  if (!res.ok || !res.body) {
    const json = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;
    throw new ApiError(json.message || "Stream failed", res.status, json.errorCode || "error");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const evt = JSON.parse(line.slice(5).trim()) as { type: string; text?: string; message?: string };
        if (evt.type === "delta" && typeof evt.text === "string") {
          full = evt.text;
          handlers.onDelta(full);
        } else if (evt.type === "done" && typeof evt.text === "string") {
          full = evt.text || full;
          handlers.onDelta(full);
        } else if (evt.type === "error") {
          if (typeof evt.text === "string") {
            full = evt.text;
            handlers.onDelta(full);
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  return full;
}

export const aiStream = {
  coach: (message: string, handlers: StreamHandlers) => streamSse("/ai/coach/stream", { message }, handlers),
  guide: (handlers: StreamHandlers) => streamSse("/ai/guide/stream", {}, handlers),
};
