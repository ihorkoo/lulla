import { upstreamRaw } from "@/lib/auth/upstream";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.text();
  const upstream = await upstreamRaw(`/api/v1/chat/conversations/${id}/send`, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
