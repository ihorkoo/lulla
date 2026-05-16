import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "block h-11 w-full rounded-xl border border-[var(--color-line-strong)] bg-white px-3.5 text-[15px] text-brand-900 placeholder:text-brand-400 shadow-sm transition",
          "hover:border-brand-300",
          "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15",
          "disabled:cursor-not-allowed disabled:bg-brand-50 disabled:text-brand-400",
          className,
        )}
        {...rest}
      />
    );
  },
);
