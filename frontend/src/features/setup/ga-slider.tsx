"use client";

import { cn } from "@/lib/utils/cn";

interface Props {
  value: number;
  onChange: (n: number) => void;
}

export function GestationalAgeSlider({ value, onChange }: Props) {
  const weeks = Array.from({ length: 41 - 22 + 1 }, (_, i) => 22 + i);
  return (
    <div className="space-y-3">
      <div
        className="grid grid-cols-10 gap-1.5"
        role="radiogroup"
        aria-label="Gestational age in weeks"
      >
        {weeks.map((w) => {
          const isTerm = w >= 37;
          const isActive = w === value;
          return (
            <button
              key={w}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(w)}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold tabular-nums transition",
                isActive
                  ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/20"
                  : isTerm
                    ? "bg-brand-50/60 text-brand-400 hover:bg-brand-100"
                    : "bg-white text-brand-800 ring-1 ring-[var(--color-line)] hover:bg-brand-50",
              )}
            >
              {w}
            </button>
          );
        })}
      </div>
      <p className="flex items-center gap-2 text-xs text-brand-700/70">
        <span className="inline-block h-2 w-2 rounded-full bg-brand-600" />
        22–36 preterm
        <span className="mx-1 text-brand-300">·</span>
        <span className="inline-block h-2 w-2 rounded-full bg-brand-200" />
        37–41 term
      </p>
    </div>
  );
}
