"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { LoginSchema, type LoginInput } from "./schemas";

export function LoginForm() {
  const t = useTranslations("common");
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), mode: "onBlur" });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      setServerError("Invalid email or password.");
      return;
    }
    const redirect = params.get("redirect") ?? "/dashboard";
    router.replace(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
        ) : null}
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
        {isSubmitting ? "Signing in…" : t("login")}
      </Button>
    </form>
  );
}
