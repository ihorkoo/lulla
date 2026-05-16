import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-950 text-white">
      <BackgroundDecor />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10">
        <header className="flex items-center justify-between">
          <Logo tone="dark" />
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm" variant="inverse">
                Get started
              </Button>
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
              Evidence-based · corrected-age aware
            </span>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Support for every baby{" "}
              <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text italic text-transparent">
                born a little early
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/75">
              Ask anything about your baby&apos;s development, feeding, and care.
              Lulla knows your baby&apos;s corrected age and gives personalized
              answers grounded in clinical evidence.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button variant="inverse" size="lg" className="min-w-44">
                  Start for free
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/10"
                >
                  I already have an account →
                </Button>
              </Link>
            </div>
            <p className="flex items-center gap-2 text-xs text-white/55">
              <span aria-hidden>⚕</span>
              Not medical advice — always consult your pediatrician.
            </p>
          </div>

          <ChatPreview />
        </section>

        <footer className="mt-auto grid gap-4 border-t border-white/10 py-8 sm:grid-cols-3">
          <Stat value="13.4M" label="preterm babies born every year worldwide" />
          <Stat value="70%" label="of parents say they don't know who to ask" />
          <Stat
            value="∞"
            label="questions you can ask — anytime, from anywhere"
          />
        </footer>
      </div>
    </main>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(187,145,255,0.18),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(99,55,180,0.4),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/60">{label}</div>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-400/30 via-brand-600/10 to-transparent blur-2xl"
      />
      <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-sm font-semibold">
              L
            </div>
            <div>
              <div className="text-sm font-semibold">lulla AI assistant</div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online · 4 months corrected
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Bubble side="bot">
            Hi! 👋 I&apos;m here to help with anything — development, feeding,
            medications, or anything on your mind.
          </Bubble>
          <Bubble side="user">
            Should I be worried my baby cries at 4 months?
          </Bubble>
          <Bubble side="bot">
            At 4 months corrected age, crying is completely normal.
          </Bubble>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/50">
          <span>Ask lulla anything…</span>
          <span className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white">
            ↑
          </span>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  side,
  children,
}: {
  side: "bot" | "user";
  children: React.ReactNode;
}) {
  if (side === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-500 px-4 py-2.5 text-sm leading-relaxed text-white shadow">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex">
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/8 px-4 py-2.5 text-sm leading-relaxed text-white/90 ring-1 ring-white/10">
        {children}
      </div>
    </div>
  );
}
