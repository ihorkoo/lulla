import Link from "next/link";

import { AuthShell } from "@/components/ui/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep talking to lulla about your baby."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
          >
            Sign up
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
