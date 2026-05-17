"use client";

import { useCallback, useRef, useState } from "react";

import type { Citation, Message } from "@/lib/api/types";

export interface StreamingState {
  assistantText: string;
  citations: Citation[];
  pendingUserMessage: string | null;
  isStreaming: boolean;
  // Holds the assistant message id after the backend persists it.
  // chat-window clears the streaming bubble once it sees this id in the
  // refetched conversation, which avoids the brief blank window between
  // `done` and the React Query refetch settling.
  doneMessageId: string | null;
  error: string | null;
}

export interface StreamHandlers {
  onDone: (payload: { message_id: string; conversation_id: string }) => void;
}

function parseSseLines(buffer: string): Array<{ event: string; data: unknown }> {
  const events: Array<{ event: string; data: unknown }> = [];
  for (const chunk of buffer.split("\n\n")) {
    if (!chunk.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of chunk.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data = line.slice(5).trim();
    }
    if (data) {
      try {
        events.push({ event, data: JSON.parse(data) });
      } catch {
        events.push({ event, data });
      }
    }
  }
  return events;
}

const INITIAL_STATE: StreamingState = {
  assistantText: "",
  citations: [],
  pendingUserMessage: null,
  isStreaming: false,
  doneMessageId: null,
  error: null,
};

export function useChatStream(conversationId: string, handlers: StreamHandlers) {
  const [state, setState] = useState<StreamingState>(INITIAL_STATE);
  const bufferRef = useRef("");

  function applyEvents(events: Array<{ event: string; data: unknown }>) {
    for (const ev of events) {
      if (ev.event === "delta") {
        const text = (ev.data as { text?: string }).text ?? "";
        setState((s) => ({ ...s, assistantText: s.assistantText + text }));
      } else if (ev.event === "citations") {
        const items = ((ev.data as { items?: Citation[] }).items ?? []) as Citation[];
        setState((s) => ({ ...s, citations: items }));
      } else if (ev.event === "done") {
        const data = ev.data as { message_id: string; conversation_id: string };
        setState((s) => ({ ...s, isStreaming: false, doneMessageId: data.message_id }));
        handlers.onDone(data);
      } else if (ev.event === "error") {
        const message = (ev.data as { message?: string }).message ?? "Error";
        setState((s) => ({ ...s, isStreaming: false, error: message }));
      }
    }
  }

  const send = useCallback(
    async (content: string, opts: { baby_id?: string; locale?: "uk" | "en" } = {}) => {
      setState({
        assistantText: "",
        citations: [],
        pendingUserMessage: content,
        isStreaming: true,
        doneMessageId: null,
        error: null,
      });
      bufferRef.current = "";
      const res = await fetch(`/api/chat/conversations/${conversationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, ...opts }),
      });
      if (!res.ok || !res.body) {
        setState((s) => ({ ...s, isStreaming: false, error: "Could not send the message" }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
        const splitIdx = bufferRef.current.lastIndexOf("\n\n");
        if (splitIdx === -1) continue;
        const processable = bufferRef.current.slice(0, splitIdx + 2);
        bufferRef.current = bufferRef.current.slice(splitIdx + 2);
        applyEvents(parseSseLines(processable));
      }
      if (bufferRef.current.trim()) {
        applyEvents(parseSseLines(`${bufferRef.current}\n\n`));
        bufferRef.current = "";
      }
      // Reader closed without an explicit `done` event — make sure we stop
      // showing the streaming spinner.
      setState((s) => (s.isStreaming ? { ...s, isStreaming: false } : s));
    },
    [conversationId, handlers],
  );

  // Call this once the persisted assistant message is visible in the
  // conversation; it tears down the transient streaming bubble.
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { state, send, reset } as const;
}

export type ChatMessage = Message;
