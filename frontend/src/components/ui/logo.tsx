import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Tone = "light" | "dark";

interface LogoProps {
  tone?: Tone;
  className?: string;
  withTagline?: boolean;
  href?: string | null;
}

export function Logo({
  tone = "light",
  className,
  withTagline = false,
  href = "/",
}: LogoProps) {
  const isDark = tone === "dark";
  const inner = (
    <>
      <span
        aria-hidden
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl text-white shadow-[var(--shadow-card)]",
          isDark ? "bg-white text-brand-900" : "bg-brand-600",
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21s-7-4.6-9.2-9.2C1.4 8.4 3.6 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.7 1.3-1.6 2.8-2.7 4.8-2.7 3.6 0 5.8 3.9 4.4 7.3C19 16.4 12 21 12 21z" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-xl font-semibold",
            isDark ? "text-white" : "text-brand-900",
          )}
        >
          lulla
        </span>
        {withTagline ? (
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em]",
              isDark ? "text-white/60" : "text-brand-700/70",
            )}
          >
            preterm care
          </span>
        ) : null}
      </span>
    </>
  );

  const baseClasses = cn(
    "inline-flex items-center gap-2 font-semibold tracking-tight",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {inner as ReactNode}
      </Link>
    );
  }
  return <div className={baseClasses}>{inner}</div>;
}
