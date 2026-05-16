import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { Logo } from "./logo";

interface TopBarProps {
  tone?: "light" | "dark";
  right?: ReactNode;
  className?: string;
}

export function TopBar({ tone = "light", right, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-4 px-6 sm:px-10",
        className,
      )}
    >
      <Logo tone={tone} />
      <nav className="hidden items-center gap-1 sm:flex">
        <NavLink href="/dashboard" tone={tone}>
          Dashboard
        </NavLink>
        <NavLink href="/chat" tone={tone}>
          AI chat
        </NavLink>
        <NavLink href="/setup" tone={tone}>
          Baby profile
        </NavLink>
      </nav>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}

function NavLink({
  href,
  tone,
  children,
}: {
  href: string;
  tone: "light" | "dark";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3.5 py-2 text-sm font-medium transition",
        tone === "dark"
          ? "text-white/75 hover:bg-white/10 hover:text-white"
          : "text-brand-800/80 hover:bg-brand-100 hover:text-brand-900",
      )}
    >
      {children}
    </Link>
  );
}
