import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MedicalDisclaimer } from "@/components/ui/disclaimer";
import { TopBar } from "@/components/ui/top-bar";
import { upstream } from "@/lib/auth/upstream";
import { daysToHumanAge } from "@/lib/domain/corrected-age";
import type { Baby, Conversation, UserMe } from "@/lib/api/types";

async function loadDashboard(): Promise<{
  me: UserMe | null;
  baby: Baby | null;
  conversations: Conversation[];
}> {
  const [meRes, babies, convs] = await Promise.allSettled([
    upstream<UserMe>("/api/v1/auth/me"),
    upstream<Baby[] | { results: Baby[] }>("/api/v1/babies/"),
    upstream<Conversation[] | { results: Conversation[] }>(
      "/api/v1/chat/conversations",
    ),
  ]);
  const me = meRes.status === "fulfilled" ? meRes.value : null;
  const babyList =
    babies.status === "fulfilled"
      ? Array.isArray(babies.value)
        ? babies.value
        : babies.value.results
      : [];
  const convList =
    convs.status === "fulfilled"
      ? Array.isArray(convs.value)
        ? convs.value
        : convs.value.results
      : [];
  return { me, baby: babyList[0] ?? null, conversations: convList };
}

function formatDob(dateString: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default async function DashboardPage() {
  const { me, baby, conversations } = await loadDashboard();
  const greetingName = me?.display_name?.split(" ")[0];
  const greeting = greetingName ? `Hello, ${greetingName}` : "Hello";
  const correctedLabel = baby
    ? daysToHumanAge(baby.corrected_age_days).label
    : "—";
  const chronologicalLabel = baby
    ? daysToHumanAge(baby.chronological_age_days).label
    : "—";
  const chatHref = baby ? "/chat" : "/setup";
  const latest = conversations[0] ?? null;

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto max-w-7xl space-y-8 px-6 pb-16 sm:px-10">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="relative overflow-hidden border-transparent bg-brand-900 p-8 text-white shadow-[var(--shadow-lift)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(187,145,255,0.28),transparent_45%),radial-gradient(circle_at_10%_110%,rgba(99,55,180,0.45),transparent_60%)]"
            />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  {greeting}
                </p>
                <h1 className="font-display text-4xl font-semibold leading-tight">
                  {baby
                    ? `${baby.name} is ${correctedLabel}`
                    : "Set up a baby profile to get started"}
                  <span className="block text-brand-200 italic">
                    {baby ? "corrected age today" : "with personalized care"}
                  </span>
                </h1>
                <p className="text-sm leading-relaxed text-white/70">
                  {baby
                    ? "Ask about feeding, sleep, warning signs, and follow-up care — lulla keeps corrected age in view."
                    : "lulla needs your baby's birth date and gestational age to tailor answers."}
                </p>
              </div>
              <Link href={chatHref} className="shrink-0">
                <Button size="lg" variant="inverse" className="min-w-48">
                  {baby ? "Ask AI assistant →" : "Create profile →"}
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="space-y-5 bg-gradient-to-br from-brand-50 via-white to-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700/70">
                  My baby
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-brand-900">
                  {baby ? baby.name : "No profile yet"}
                </h2>
                <p className="mt-1 text-sm text-brand-700/75">
                  {baby
                    ? `Born ${formatDob(baby.dob)} · GA ${baby.gestational_age_weeks}w · ${baby.is_preterm ? "preterm" : "term"}`
                    : "Add birth details so answers adapt to corrected age."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Kpi label="Chronological" value={chronologicalLabel} />
              <Kpi label="Corrected" value={correctedLabel} accent />
            </div>

            <Link href="/setup" className="block">
              <Button variant="outline" className="w-full">
                {baby ? "Update profile" : "Create profile"}
              </Button>
            </Link>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <StatCard
            label="Birth profile"
            value={baby ? `${baby.gestational_age_weeks}w` : "—"}
            hint={
              baby
                ? baby.is_preterm
                  ? "Marked as preterm"
                  : "Marked as term"
                : "No gestational age yet"
            }
          />
          <StatCard
            label="Conversations"
            value={String(conversations.length)}
            hint={
              latest
                ? `Last update ${formatDateTime(latest.updated_at)}`
                : "Start your first chat"
            }
          />
          <StatCard
            label="Corrected age"
            value={correctedLabel}
            hint={
              baby
                ? "Used for developmental context"
                : "Available once a profile exists"
            }
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700/70">
                  Recent conversations
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-brand-900">
                  Pick up where you left off
                </h3>
              </div>
              <Link href={chatHref}>
                <Button variant="secondary" size="sm">
                  + New chat
                </Button>
              </Link>
            </div>

            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-5 py-10 text-center">
                <p className="text-2xl">💬</p>
                <p className="mt-3 text-sm font-medium text-brand-900">
                  No conversations yet
                </p>
                <p className="mt-1 text-sm text-brand-700/70">
                  Ask about feeding, warning signs, sleep, or follow-up care.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-line)]">
                {conversations.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/chat/${c.id}`}
                      className="group flex items-center justify-between gap-4 py-3 transition hover:px-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-900 group-hover:text-brand-700">
                          {c.title || "Untitled conversation"}
                        </p>
                        <p className="mt-0.5 text-xs text-brand-700/70">
                          {formatDateTime(c.updated_at)}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className="text-brand-300 transition group-hover:translate-x-0.5 group-hover:text-brand-700"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-4 border-transparent bg-brand-950 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Stay grounded
            </p>
            <h3 className="font-display text-xl font-semibold leading-tight">
              Guidance, not prescriptions
            </h3>
            <p className="text-sm leading-relaxed text-white/70">
              Use lulla to prepare questions and understand context. Always
              confirm medications, dosing, and urgent symptoms with your care
              team.
            </p>
            <div className="rounded-xl bg-white/[0.06] px-4 py-3 text-sm text-white/80">
              Answers cite the clinical source they&apos;re based on.
            </div>
          </Card>
        </section>

        <MedicalDisclaimer />
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 ${
        accent ? "bg-brand-600 text-white" : "bg-white/70 ring-1 ring-[var(--color-line)]"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          accent ? "text-white/70" : "text-brand-700/70"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-base font-semibold ${
          accent ? "text-white" : "text-brand-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700/70">
        {label}
      </p>
      <p className="font-display text-3xl font-semibold tabular-nums text-brand-900">
        {value}
      </p>
      <p className="text-sm text-brand-700/70">{hint}</p>
    </Card>
  );
}
