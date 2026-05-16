import { NextResponse } from "next/server";

import { upstreamRaw } from "@/lib/auth/upstream";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const upstream = await upstreamRaw(`/api/v1/babies/${id}`);
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const body = await req.text();
  const upstream = await upstreamRaw(`/api/v1/babies/${id}`, {
    method: "PATCH",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const body = await req.text();
  const upstream = await upstreamRaw(`/api/v1/babies/${id}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const upstream = await upstreamRaw(`/api/v1/babies/${id}`, {
    method: "DELETE",
  });
  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
