import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import { ConversationList } from "@/features/chat/conversation-list";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-screen grid-cols-[280px_1fr] bg-[var(--color-surface-muted)]">
      <aside className="flex h-screen flex-col border-r border-[var(--color-line)] bg-white">
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <Link
            href="/dashboard"
            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-700/80 hover:bg-brand-100 hover:text-brand-900"
            title="Back to dashboard"
          >
            ←
          </Link>
        </div>
        <ConversationList />
      </aside>
      <section className="flex h-screen flex-col overflow-hidden bg-[var(--color-surface-muted)]">
        {children}
      </section>
    </div>
  );
}
