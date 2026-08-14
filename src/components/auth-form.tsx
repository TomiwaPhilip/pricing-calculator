"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/toast-provider";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Something went wrong.");
      setPending(false);
      return;
    }

    toast.success(isSignup ? "Account created. Welcome to Folio." : "Signed in successfully.");
    router.push("/documents");
    router.refresh();
  }

  return (
    <form className="mt-10 space-y-6" onSubmit={submit}>
      {error ? (
        <div
          className="border-l-2 border-danger bg-white/45 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Email address
        </span>
        <input
          className="w-full border-0 border-b border-rule-dark bg-transparent px-0 py-3 text-lg outline-none transition focus:border-vermilion"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Password
        </span>
        <input
          className="w-full border-0 border-b border-rule-dark bg-transparent px-0 py-3 text-lg outline-none transition focus:border-vermilion"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={8}
          required
        />
        {isSignup ? (
          <span className="mt-2 block text-xs text-ink-soft">
            At least 8 characters.
          </span>
        ) : null}
      </label>

      <button
        className="group flex w-full items-center justify-between bg-ink px-5 py-4 text-left font-semibold text-paper-light transition hover:bg-vermilion disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        <span>
          {pending
            ? "Preparing your ledger…"
            : isSignup
              ? "Create your workspace"
              : "Enter your workspace"}
        </span>
        <span
          className="text-xl transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </button>

      <p className="text-sm text-ink-soft">
        {isSignup ? "Already have an account?" : "New to Folio?"}{" "}
        <Link
          className="font-semibold text-ink underline decoration-vermilion decoration-2 underline-offset-4"
          href={isSignup ? "/login" : "/signup"}
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
