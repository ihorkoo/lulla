import Link from "next/link";

import { AuthShell } from "@/components/ui/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="30 seconds to set up — no credit card needed."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline"
          >
            Log in
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
