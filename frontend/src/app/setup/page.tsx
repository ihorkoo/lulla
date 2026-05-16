import Link from "next/link";

import { Logo } from "@/components/ui/logo";
import { SetupForm } from "@/features/setup/setup-form";
import { upstream } from "@/lib/auth/upstream";
import type { Baby } from "@/lib/api/types";

const HIGHLIGHTS = [
  "AI answers tailored to corrected age",
  "Corrected age calculated automatically",
  "Securely linked to your account",
];

async function loadPrimaryBaby(): Promise<Baby | null> {
  try {
    const data = await upstream<Baby[] | { results: Baby[] }>("/api/v1/babies/");
    const list = Array.isArray(data) ? data : data.results;
    return list[0] ?? null;
  } catch {
    return null;
  }
}

export default async function SetupPage() {
  const baby = await loadPrimaryBaby();
  const isEdit = Boolean(baby);

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 px-12 py-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(187,145,255,0.22),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(99,55,180,0.45),transparent_55%)]"
        />
        <Logo tone="dark" />
        <div className="relative space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              {isEdit ? "Baby profile" : "Quick setup"}
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
              {isEdit ? (
                <>
                  Edit{" "}
                  <span className="italic text-brand-200">
                    {baby!.name}&apos;s
                  </span>{" "}
                  profile
                </>
              ) : (
                <>
                  Tell us about{" "}
                  <span className="italic text-brand-200">your baby</span>
                </>
              )}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/70">
              {isEdit
                ? "Update the details lulla uses to compute corrected age and tailor every answer."
                : "This takes 30 seconds. lulla uses it to calculate corrected age and personalize every answer."}
            </p>
          </div>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h}
                className="flex items-center gap-3 text-sm text-white/80"
              >
                <span
                  aria-hidden
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs text-brand-200"
                >
                  ✓
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/55">
          Purple — World Prematurity Awareness color since 2011.
        </p>
      </aside>

      <section className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/dashboard"
            className="ml-auto text-sm font-medium text-brand-700 hover:text-brand-900"
          >
            ← Back to dashboard
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-xl">
            <SetupForm baby={baby} />
          </div>
        </div>
      </section>
    </main>
  );
}
