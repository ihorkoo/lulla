import { NextResponse } from "next/server";

import { readRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { upstream } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function POST() {
  const refresh = await readRefreshToken();
  if (!refresh) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const data = await upstream<{ access: string; refresh?: string }>(
      "/api/v1/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh }), authorize: false },
    );
    await setAuthCookies(data.access, data.refresh ?? refresh);
    return NextResponse.json({ ok: true });
  } catch {
    await clearAuthCookies();
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
