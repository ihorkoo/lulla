import { NextResponse } from "next/server";

import { upstream } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function GET() {
  try {
    const me = await upstream("/api/v1/auth/me");
    return NextResponse.json(me);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ ok: false }, { status });
  }
}
