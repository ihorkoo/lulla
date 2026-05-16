"use client";

import { useCallback, useRef, useState } from "react";

import type { Citation, Message } from "@/lib/api/types";

export interface StreamingState {
  assistantText: string;
  citations: Citation[];
  pendingUserMessage: string | null;
  isStreaming: boolean;
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

export function useChatStream(conversationId: string, handlers: StreamHandlers) {
  const [state, setState] = useState<StreamingState>({
    assistantText: "",
    citations: [],
    pendingUserMessage: null,
    isStreaming: false,
    error: null,
  });
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
        setState((s) => ({
          ...s,
          assistantText: "",
          citations: [],
          pendingUserMessage: null,
          isStreaming: false,
        }));
        handlers.onDone(ev.data as { message_id: string; conversation_id: string });
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
    },
    [conversationId, handlers],
  );

  return { state, send } as const;
}

export type ChatMessage = Message;
