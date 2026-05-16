"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <Logo />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-700/60">
          Unexpected error
        </p>
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Something went wrong
        </h1>
        <p className="text-sm text-brand-700/75">
          Try again, or head back home if the problem persists.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
