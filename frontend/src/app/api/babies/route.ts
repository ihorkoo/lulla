import { NextResponse } from "next/server";

import { upstreamRaw } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function GET() {
  const upstream = await upstreamRaw("/api/v1/babies/");
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const upstream = await upstreamRaw("/api/v1/babies/", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
