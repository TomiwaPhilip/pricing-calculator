"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/toast-provider";

export function NewDocumentForm() {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);

    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        customer: data.get("customer"),
        issueDate: data.get("issueDate"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Unable to create the document.");
      setPending(false);
      return;
    }

    toast.success("Draft created. Add line items when you’re ready.");
    router.push(`/documents/${payload.document.id}`);
    router.refresh();
  }

  const inputClass =
    "w-full border-0 border-b border-rule-dark bg-transparent px-0 py-3 text-lg outline-none transition focus:border-vermilion";

  return (
    <form className="mt-12 max-w-3xl space-y-8" onSubmit={submit}>
      {error ? (
        <div className="border-l-2 border-danger px-4 py-3 text-danger" role="alert">
          {error}
        </div>
      ) : null}
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Document title
        </span>
        <input
          className={inputClass}
          name="title"
          placeholder="Q3 Product Launch"
          maxLength={120}
          required
          autoFocus
        />
      </label>
      <div className="grid gap-8 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Customer
          </span>
          <input
            className={inputClass}
            name="customer"
            placeholder="Northstar & Co."
            maxLength={120}
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Issue date
          </span>
          <input
            className={inputClass}
            name="issueDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </label>
      </div>
      <div className="flex items-center gap-5 pt-4">
        <button
          className="bg-ink px-6 py-3.5 font-semibold text-paper-light transition hover:bg-vermilion disabled:opacity-50"
          type="submit"
          disabled={pending}
        >
          {pending ? "Opening document…" : "Create draft"}
        </button>
        <button
          className="font-semibold text-ink-soft hover:text-ink"
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
