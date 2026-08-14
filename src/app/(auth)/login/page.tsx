import { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <div className="mb-16 lg:hidden">
        <Logo linked={false} />
      </div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-vermilion">
        Welcome back
      </p>
      <h1 className="font-serif text-5xl font-semibold leading-none tracking-[-0.05em]">
        Open your ledger.
      </h1>
      <p className="mt-5 max-w-sm leading-7 text-ink-soft">
        Return to your drafts, finalized documents, and date-range reports.
      </p>
      <AuthForm mode="login" />
    </>
  );
}
