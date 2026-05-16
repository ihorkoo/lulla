import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-card)]",
        className,
      )}
      {...rest}
    />
  );
}
