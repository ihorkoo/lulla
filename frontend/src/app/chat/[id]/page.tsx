import { ChatWindow } from "@/features/chat/chat-window";
import { upstream } from "@/lib/auth/upstream";
import type { ConversationDetail } from "@/lib/api/types";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let initial: ConversationDetail | null = null;
  try {
    initial = await upstream<ConversationDetail>(`/api/v1/chat/conversations/${id}`);
  } catch {
    initial = null;
  }
  return <ChatWindow conversationId={id} initial={initial} />;
}
