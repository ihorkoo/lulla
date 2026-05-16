"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { RegisterSchema, type RegisterInput } from "./schemas";

export function RegisterForm() {
  const t = useTranslations("common");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { locale: "en" },
    mode: "onBlur",
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.detail ?? "Could not sign up");
      return;
    }
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email, password: values.password }),
    });
    router.replace("/setup");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="display_name">Your name</Label>
        <Input
          id="display_name"
          autoComplete="given-name"
          placeholder="Oksana"
          {...register("display_name")}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 10 characters"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
        ) : (
          <p className="mt-1.5 text-xs text-brand-700/60">
            10 characters minimum.
          </p>
        )}
      </div>
      {serverError ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? "Creating…" : t("register")}
      </Button>
      <p className="text-xs leading-relaxed text-brand-700/60">
        By signing up you agree to use lulla for guidance only — final medical
        decisions stay with your pediatrician.
      </p>
    </form>
  );
}
