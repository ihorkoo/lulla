import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

const HIGHLIGHTS = [
  {
    icon: "🤖",
    title: "Corrected-age aware AI",
    body: "Every answer is grounded in your baby's adjusted timeline.",
  },
  {
    icon: "📚",
    title: "Clinical sources",
    body: "Replies cite the medical guidance they're based on.",
  },
  {
    icon: "🔒",
    title: "Private by default",
    body: "Your data stays linked to your account only.",
  },
];

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 px-12 py-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(187,145,255,0.22),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(99,55,180,0.45),transparent_55%)]"
        />
        <div className="relative">
          <Logo tone="dark" />
        </div>
        <div className="relative space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Why lulla
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
              Care designed for{" "}
              <span className="italic text-brand-200">preterm parents</span>.
            </h2>
          </div>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h.title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-base"
                >
                  {h.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{h.title}</p>
                  <p className="mt-0.5 text-sm text-white/70">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/55">
          Purple — World Prematurity Awareness color since 2011.
        </p>
      </aside>

      <section className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
          <Link
            href="/"
            className="text-sm font-medium text-brand-700 hover:text-brand-900"
          >
            ← Home
          </Link>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="w-full max-w-md space-y-8">
            <header className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900">
                {title}
              </h1>
              <p className="text-sm text-brand-700/80">{subtitle}</p>
            </header>
            {children}
            <div className="text-sm text-brand-700/80">{footer}</div>
          </div>
        </div>
        <div className="hidden text-xs text-brand-700/60 lg:block">
          <Link href="/" className="hover:text-brand-900">
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
