import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await getCurrentUser()) redirect("/documents");

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.72fr)]">
      <section className="relative hidden overflow-hidden border-r border-rule bg-mineral p-12 text-paper-light lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0, transparent 71px, rgba(255,255,255,.28) 72px)",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <Logo linked={false} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-paper/70">
            Pricing documents, precisely kept
          </p>
        </div>
        <blockquote className="relative max-w-xl">
          <p className="font-serif text-5xl font-medium leading-[1.08] tracking-[-0.04em]">
            Every figure has a place. Every total has a reason.
          </p>
          <footer className="mt-8 flex items-center gap-3 text-sm text-paper/70">
            <span className="h-px w-12 bg-vermilion" />
            A calmer way to prepare commercial documents
          </footer>
        </blockquote>
        <p className="relative money text-xs uppercase tracking-[0.12em] text-paper/55">
          Ledger no. 001 / Est. 2026
        </p>
      </section>
      <section className="flex min-h-screen items-center bg-paper-light px-6 py-12 sm:px-12">
        <div className="page-reveal mx-auto w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
