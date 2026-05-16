/** Server-only helpers to talk to Django from Route Handlers / Server Components. */
import "server-only";

import {
  clearAuthCookies,
  readAccessToken,
  readRefreshToken,
  setAuthCookies,
} from "./cookies";

// Backend URL is intentionally hardcoded so it cannot be overridden by a
// stale/wrong INTERNAL_API_URL env var. For local dev, docker-compose maps
// localhost:8000 → backend service, so we pick the right value at runtime.
const INTERNAL =
  process.env.NODE_ENV === "production"
    ? "https://back-production-af3c.up.railway.app"
    : "http://backend:8000";

export interface UpstreamOptions extends RequestInit {
  authorize?: boolean;
}

async function fetchJson(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${INTERNAL}${path}`, {
    ...options,
    cache: "no-store",
  });
}

async function tryPersistAuthCookies(access: string, refresh: string): Promise<void> {
  try {
    await setAuthCookies(access, refresh);
  } catch {
    // Server Components can read cookies but cannot always mutate them.
  }
}

async function tryClearAuthCookies(): Promise<void> {
  try {
    await clearAuthCookies();
  } catch {
    // Best effort only; mutation may be unavailable in some server contexts.
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await readRefreshToken();
  if (!refresh) return null;

  const res = await fetchJson("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    await tryClearAuthCookies();
    return null;
  }

  const data = (await res.json()) as { access: string; refresh?: string };
  const nextRefresh = data.refresh ?? refresh;
  await tryPersistAuthCookies(data.access, nextRefresh);
  return data.access;
}

async function resolveAccessToken(): Promise<string | null> {
  const token = await readAccessToken();
  if (token) return token;
  return refreshAccessToken();
}

export async function upstream<T = unknown>(path: string, options: UpstreamOptions = {}): Promise<T> {
  let token: string | null = null;
  const baseHeaders = new Headers(options.headers);
  baseHeaders.set("Content-Type", "application/json");

  if (options.authorize !== false) {
    token = await resolveAccessToken();
    if (token) baseHeaders.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetchJson(path, {
    ...options,
    headers: baseHeaders,
  });

  if (res.status === 401 && options.authorize !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed && refreshed !== token) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Content-Type", "application/json");
      retryHeaders.set("Authorization", `Bearer ${refreshed}`);
      res = await fetchJson(path, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(`Upstream ${path} → ${res.status}: ${text}`);
    (error as Error & { status?: number }).status = res.status;
    throw error;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function upstreamRaw(path: string, options: UpstreamOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.authorize !== false) {
    const token = await resolveAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  let res = await fetchJson(path, { ...options, headers });
  if (res.status === 401 && options.authorize !== false) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Authorization", `Bearer ${refreshed}`);
      res = await fetchJson(path, { ...options, headers: retryHeaders });
    }
  }
  return res;
}
