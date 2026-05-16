import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "inverse";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-brand-100 text-brand-900 hover:bg-brand-200/80 active:bg-brand-200",
  outline:
    "border border-brand-200 bg-white text-brand-900 hover:border-brand-300 hover:bg-brand-50",
  ghost: "text-brand-800 hover:bg-brand-100/60",
  inverse:
    "bg-white text-brand-900 shadow-sm hover:bg-brand-50 active:bg-brand-100",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-all",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
