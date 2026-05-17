"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { MedicalDisclaimer } from "@/components/ui/disclaimer";
import { cn } from "@/lib/utils/cn";
import type { Baby, ConversationDetail } from "@/lib/api/types";

import { QuickQuestions } from "./quick-questions";
import { useChatStream } from "./use-chat-stream";

// Strip inline reference markers like [1], [2,3], [1-3] from streamed text.
const INLINE_REF = /\s?\[\d+(?:\s*[-,]\s*\d+)*\]/g;
function cleanContent(text: string): string {
  return text.replace(INLINE_REF, "").trim();
}

interface Props {
  conversationId: string;
  initial?: ConversationDetail | null;
}

async function fetchConversation(id: string): Promise<ConversationDetail | null> {
  const res = await fetch(`/api/chat/conversations/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

async function fetchPrimaryBaby(): Promise<Baby | null> {
  const res = await fetch("/api/babies");
  if (!res.ok) return null;
  const data = await res.json();
  const list: Baby[] = Array.isArray(data) ? data : (data?.results ?? []);
  return list[0] ?? null;
}

export function ChatWindow({ conversationId, initial }: Props) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const baby = useQuery({ queryKey: ["baby", "primary"], queryFn: fetchPrimaryBaby });

  const detail = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId),
    initialData: initial ?? undefined,
    enabled: Boolean(conversationId),
  });

  const { state, send, reset } = useChatStream(conversationId, {
    onDone: () => {
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.assistantText, detail.data?.messages.length]);

  // Once the persisted assistant message lands in the conversation, drop the
  // transient streaming bubble. This avoids the brief blank window between
  // `done` and the React Query refetch.
  useEffect(() => {
    if (!state.doneMessageId) return;
    const persisted = detail.data?.messages.some(
      (m) => m.id === state.doneMessageId,
    );
    if (persisted) reset();
  }, [state.doneMessageId, detail.data?.messages, reset]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  async function submit(content: string) {
    if (!content.trim() || state.isStreaming) return;
    setDraft("");
    await send(content, { baby_id: baby.data?.id, locale: "en" });
  }

  const messages = detail.data?.messages ?? [];
  const isEmpty = messages.length === 0 && !state.pendingUserMessage;
  // While streaming or right after `done`, we may have the user message both
  // in the streaming state and in the refetched conversation. De-dupe.
  const lastPersistedUserContent = [...messages]
    .reverse()
    .find((m) => m.role === "user")?.content;
  const showPendingUser =
    state.pendingUserMessage !== null &&
    state.pendingUserMessage !== lastPersistedUserContent;
  // Likewise hide the streaming assistant bubble once its persisted twin shows
  // up in `messages` — `reset()` will run on next effect tick.
  const persistedAssistantPresent =
    state.doneMessageId !== null &&
    messages.some((m) => m.id === state.doneMessageId);
  const showStreamingAssistant =
    (state.assistantText.length > 0 || state.isStreaming) &&
    !persistedAssistantPresent;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between border-b border-[var(--color-line)] bg-white px-6">
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-semibold text-brand-900">
            {detail.data?.title || "New conversation"}
          </h2>
          {baby.data ? (
            <p className="truncate text-xs text-brand-700/65">
              {baby.data.name} · GA {baby.data.gestational_age_weeks}w · corrected{" "}
              {Math.round(baby.data.corrected_age_days / 30.44)} mo
            </p>
          ) : (
            <p className="text-xs text-brand-700/65">No baby profile yet</p>
          )}
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          lulla online
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {isEmpty ? (
            <EmptyState onPick={submit} />
          ) : (
            <div className="space-y-5">
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              {showPendingUser ? (
                <MessageBubble
                  role="user"
                  content={state.pendingUserMessage!}
                />
              ) : null}
              {showStreamingAssistant ? (
                <MessageBubble
                  role="assistant"
                  content={state.assistantText}
                  isStreaming={state.isStreaming}
                />
              ) : null}
              {state.error ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              ) : null}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="border-t border-[var(--color-line)] bg-white">
        <div className="mx-auto w-full max-w-3xl px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(draft);
            }}
            className="flex items-end gap-2 rounded-2xl border border-[var(--color-line-strong)] bg-white p-2 shadow-sm transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15"
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(draft);
                }
              }}
              placeholder="Ask lulla anything…"
              disabled={state.isStreaming}
              rows={1}
              className="block max-h-48 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-brand-900 placeholder:text-brand-400 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={state.isStreaming || !draft.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-3 px-1">
            <MedicalDisclaimer />
            <span className="hidden text-[11px] text-brand-700/55 sm:inline">
              Press <kbd className="rounded bg-brand-100 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> to send · <kbd className="rounded bg-brand-100 px-1.5 py-0.5 font-mono text-[10px]">Shift</kbd> + <kbd className="rounded bg-brand-100 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> for newline
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="space-y-8 pt-4">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-[var(--shadow-card)]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s-7-4.6-9.2-9.2C1.4 8.4 3.6 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.7 1.3-1.6 2.8-2.7 4.8-2.7 3.6 0 5.8 3.9 4.4 7.3C19 16.4 12 21 12 21z" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-brand-900">
          How can lulla help today?
        </h3>
        <p className="mt-1.5 text-sm text-brand-700/75">
          Pick a starting point — or type your own question below.
        </p>
      </div>
      <QuickQuestions onPick={onPick} />
    </div>
  );
}

function MessageBubble({
  role,
  content,
  isStreaming = false,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}) {
  if (role === "system") return null;
  const isUser = role === "user";
  const showLoader = !isUser && isStreaming && !content.trim();
  const text = isUser ? content : cleanContent(content);

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white"
        >
          L
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
          isUser
            ? "rounded-br-md bg-brand-600 text-white shadow-sm"
            : "rounded-bl-md bg-white text-brand-900 ring-1 ring-[var(--color-line)] shadow-sm",
        )}
      >
        {showLoader ? (
          <div className="flex items-center gap-2 text-brand-700">
            <span className="flex items-center gap-1">
              <Dot delay="0ms" />
              <Dot delay="120ms" />
              <Dot delay="240ms" />
            </span>
            <span className="text-sm font-medium">lulla is thinking…</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400"
      style={{ animationDelay: delay }}
    />
  );
}
