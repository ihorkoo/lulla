import { cookies } from "next/headers";

const ACCESS = "lulla_access";
const REFRESH = "lulla_refresh";

const SECURE = process.env.NODE_ENV === "production";
const ACCESS_MAX_AGE = 60 * 60 * 24 * 7;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export const cookieNames = { access: ACCESS, refresh: REFRESH };

const baseOpts = {
  httpOnly: true,
  secure: SECURE,
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(access: string, refresh: string) {
  const jar = await cookies();
  jar.set(ACCESS, access, { ...baseOpts, maxAge: ACCESS_MAX_AGE });
  jar.set(REFRESH, refresh, { ...baseOpts, maxAge: REFRESH_MAX_AGE });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

export async function readAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH)?.value ?? null;
}
