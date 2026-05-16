import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <Logo />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-700/60">
          Error 404
        </p>
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Page not found
        </h1>
        <p className="text-sm text-brand-700/75">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/">
          <Button variant="primary" size="md">
            Back to home
          </Button>
        </Link>
      </div>
    </main>
  );
}
