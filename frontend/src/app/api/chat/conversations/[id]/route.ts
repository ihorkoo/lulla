import { NextResponse } from "next/server";

import { upstreamRaw } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const upstream = await upstreamRaw(`/api/v1/chat/conversations/${id}`);
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
