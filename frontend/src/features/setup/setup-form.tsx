"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { correctedAge, daysToHumanAge } from "@/lib/domain/corrected-age";
import type { Baby } from "@/lib/api/types";

import { GestationalAgeSlider } from "./ga-slider";
import { BabyProfileSchema, type BabyProfileInput } from "./schemas";

interface Props {
  baby?: Baby | null;
}

export function SetupForm({ baby }: Props) {
  const t = useTranslations("setup");
  const router = useRouter();
  const isEdit = Boolean(baby);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const defaultValues: Partial<BabyProfileInput> = baby
    ? {
        name: baby.name,
        // input[type=date] uses YYYY-MM-DD; zod coerces to Date
        dob: new Date(baby.dob),
        gestational_age_weeks: baby.gestational_age_weeks,
      }
    : { gestational_age_weeks: 28 };

  const form = useForm<BabyProfileInput>({
    resolver: zodResolver(BabyProfileSchema),
    defaultValues,
    mode: "onBlur",
  });
  const { register, handleSubmit, control, formState, reset } = form;

  const dob = useWatch({ control, name: "dob" });
  const ga = useWatch({ control, name: "gestational_age_weeks" });

  const ages = useMemo(() => {
    if (!dob || !ga) return null;
    try {
      return correctedAge(new Date(dob), ga);
    } catch {
      return null;
    }
  }, [dob, ga]);

  async function onSubmit(values: BabyProfileInput) {
    setServerError(null);
    setSavedFlash(false);
    const payload = {
      name: values.name,
      dob: values.dob.toISOString().slice(0, 10),
      gestational_age_weeks: values.gestational_age_weeks,
    };
    const res = await fetch(
      isEdit ? `/api/babies/${baby!.id}` : "/api/babies",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.detail ?? "Could not save the profile");
      return;
    }
    if (isEdit) {
      const updated = (await res.json().catch(() => null)) as Baby | null;
      if (updated) {
        reset({
          name: updated.name,
          dob: new Date(updated.dob),
          gestational_age_weeks: updated.gestational_age_weeks,
        });
      }
      setSavedFlash(true);
      router.refresh();
      setTimeout(() => setSavedFlash(false), 2200);
    } else {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!baby) return;
    setServerError(null);
    setIsDeleting(true);
    const res = await fetch(`/api/babies/${baby.id}`, { method: "DELETE" });
    setIsDeleting(false);
    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(() => null);
      setServerError(body?.detail ?? "Could not delete the profile");
      return;
    }
    router.replace("/setup");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700/70">
          {isEdit ? "Edit baby profile" : "About your baby"}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-900">
          {isEdit ? `Update ${baby!.name}'s details` : t("title")}
        </h1>
        <p className="text-sm text-brand-700/80">
          {isEdit
            ? "Changes apply to every future answer right away."
            : t("subtitle")}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="baby_name">{t("babyName")}</Label>
          <Input
            id="baby_name"
            placeholder="e.g. Tymofiy"
            {...register("name")}
          />
          {formState.errors.name ? (
            <p className="mt-1.5 text-xs text-red-600">
              {formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="dob">{t("dob")}</Label>
          <Input
            id="dob"
            type="date"
            defaultValue={baby ? baby.dob : undefined}
            {...register("dob")}
          />
          {formState.errors.dob ? (
            <p className="mt-1.5 text-xs text-red-600">
              {formState.errors.dob.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <Label className="mb-0">{t("ga")}</Label>
          <span className="text-2xl font-semibold tabular-nums text-brand-900">
            {ga ?? 28}
            <span className="ml-1 text-sm font-medium text-brand-700/70">
              weeks
            </span>
          </span>
        </div>
        <Controller
          control={control}
          name="gestational_age_weeks"
          render={({ field }) => (
            <GestationalAgeSlider
              value={field.value ?? 28}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {ages ? (
        <div className="rounded-2xl border border-brand-200/80 bg-brand-50/60 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700/80">
            <span aria-hidden>✦</span> Auto-calculated
          </p>
          <div className="grid grid-cols-3 gap-3">
            <AgeStat
              label="Chronological"
              value={daysToHumanAge(ages.chronologicalDays).label}
            />
            <AgeStat
              label="Corrected"
              value={daysToHumanAge(ages.correctedDays).label}
              accent
            />
            <AgeStat label="Correction" value={`−${ages.correctionWeeks}w`} />
          </div>
        </div>
      ) : null}

      {serverError ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}

      {savedFlash ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          ✓ Saved
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={formState.isSubmitting || (isEdit && !formState.isDirty)}
          size="lg"
          className="w-full sm:flex-1"
        >
          {formState.isSubmitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : `${t("submit")} →`}
        </Button>
        {isEdit ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={formState.isSubmitting || !formState.isDirty}
            onClick={() => reset(defaultValues)}
          >
            Discard
          </Button>
        ) : null}
      </div>

      {isEdit ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-800">
                Delete this profile
              </p>
              <p className="mt-0.5 text-xs text-red-700/80">
                Removes the baby and all linked context. Conversations stay, but
                lose corrected-age personalization.
              </p>
            </div>
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="shrink-0 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                Delete
              </button>
            ) : null}
          </div>
          {confirmingDelete ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function AgeStat({
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
      className={`rounded-xl border px-3 py-2.5 text-center ${
        accent
          ? "border-brand-600 bg-white shadow-sm"
          : "border-transparent bg-white/70"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-700/70">
        {label}
      </div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums ${
          accent ? "text-brand-700" : "text-brand-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
