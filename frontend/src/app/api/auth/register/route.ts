import { NextResponse } from "next/server";

import { upstreamRaw } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const upstream = await upstreamRaw("/api/v1/auth/register", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    authorize: false,
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}
