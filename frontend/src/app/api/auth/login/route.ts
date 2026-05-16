import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth/cookies";
import { upstream } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const data = await upstream<{ access: string; refresh: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      authorize: false,
    });
    await setAuthCookies(data.access, data.refresh);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json(
      { ok: false, code: "AUTH_INVALID_CREDENTIALS" },
      { status: status === 401 ? 401 : 500 },
    );
  }
}
