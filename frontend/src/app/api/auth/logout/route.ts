import { NextResponse } from "next/server";

import { clearAuthCookies, readRefreshToken } from "@/lib/auth/cookies";
import { upstream } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function POST() {
  const refresh = await readRefreshToken();
  try {
    if (refresh) {
      await upstream("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
    }
  } catch {
    // swallow — clearing cookies locally still logs the user out
  }
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
