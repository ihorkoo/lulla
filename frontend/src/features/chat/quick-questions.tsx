"use client";

const SCENARIOS = [
  {
    icon: "🍼",
    title: "Feeding",
    description: "Breastfeeding, formula, and warning signs during feeds.",
    prompt:
      "Explain what to watch for when feeding a preterm baby after discharge: signs that things are going well and signs that mean we should contact a doctor.",
  },
  {
    icon: "⚠️",
    title: "Warning signs",
    description: "When to watch — and when to seek urgent help.",
    prompt:
      "Explain which symptoms in a preterm newborn after discharge are concerning and in which situations we need urgent medical help.",
  },
  {
    icon: "💊",
    title: "Vitamins & supplements",
    description: "Vitamin D, iron, and what to confirm with the doctor.",
    prompt:
      "Help me understand supplements for a preterm baby. If dosing is involved, do not guess and tell me exactly what to confirm with the doctor.",
  },
  {
    icon: "🩺",
    title: "Ask the doctor",
    description: "Prepare key questions for the pediatrician.",
    prompt:
      "Create a short list of questions that parents of a preterm baby should ask the pediatrician or neonatologist after discharge.",
  },
];

const CHIPS = [
  { label: "Vitamin D dosing", q: "How much vitamin D is usually given each day?" },
  { label: "Warning signs", q: "Which warning signs matter after discharge?" },
  { label: "Weight gain", q: "What weight gain is expected?" },
  { label: "Sleep", q: "What is safe sleep for a preterm baby?" },
];

export function QuickQuestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg"
            >
              {s.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-900 group-hover:text-brand-700">
                {s.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-brand-700/75">
                {s.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onPick(c.q)}
            className="rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 text-xs font-medium text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
