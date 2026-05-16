"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import type { Baby, Conversation } from "@/lib/api/types";

async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/chat/conversations");
  if (!res.ok) throw new Error("Failed to load conversations");
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.results ?? []);
}

async function fetchPrimaryBaby(): Promise<Baby | null> {
  const res = await fetch("/api/babies");
  if (!res.ok) return null;
  const data = await res.json();
  const list: Baby[] = Array.isArray(data) ? data : (data?.results ?? []);
  return list[0] ?? null;
}

function formatRelative(dateString: string): string {
  const d = new Date(dateString);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(d);
}

export function ConversationList() {
  const params = useParams<{ id?: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });
  const baby = useQuery({
    queryKey: ["baby", "primary"],
    queryFn: fetchPrimaryBaby,
  });
  const newChatHref = baby.data ? "/chat" : "/setup";
  const newChatLabel = baby.data ? "New conversation" : "Add baby profile";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pt-1 pb-3">
        <Link
          href={newChatHref}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          <span aria-hidden className="text-base">＋</span>
          {newChatLabel}
        </Link>
      </div>

      <div className="px-5 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700/55">
        Conversations
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <p className="px-3 py-2 text-xs text-brand-600">Loading…</p>
        ) : null}
        {!isLoading && (data ?? []).length === 0 ? (
          <p className="px-3 py-2 text-xs text-brand-700/60">
            No conversations yet. Start one above.
          </p>
        ) : null}
        {(data ?? []).map((c) => {
          const active = params.id === c.id;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={cn(
                "block rounded-lg px-3 py-2 transition",
                active
                  ? "bg-brand-100 ring-1 ring-brand-200"
                  : "hover:bg-brand-50",
              )}
            >
              <p
                className={cn(
                  "truncate text-sm",
                  active
                    ? "font-semibold text-brand-900"
                    : "font-medium text-brand-800",
                )}
              >
                {c.title || "Untitled conversation"}
              </p>
              <p className="mt-0.5 text-[11px] text-brand-700/60">
                {formatRelative(c.updated_at)}
              </p>
            </Link>
          );
        })}
      </nav>

      {baby.data ? (
        <div className="m-3 rounded-xl border border-[var(--color-line)] bg-brand-50/60 p-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white"
            >
              {baby.data.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-900">
                {baby.data.name}
              </p>
              <p className="text-[11px] text-brand-700/70">
                GA {baby.data.gestational_age_weeks}w ·{" "}
                {Math.round(baby.data.corrected_age_days / 30.44)} mo corrected
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
