"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { formatMoney } from "@/lib/calculations";
import type { SerializedDocument } from "@/lib/documents";
import { StatusStamp } from "@/components/status-stamp";
import { useToast } from "@/components/toast-provider";

type Report = {
  range: { from: string; to: string };
  summary: {
    documentCount: number;
    grandTotalCents: number;
    taxCents: number;
    discountCents: number;
  };
  documents: SerializedDocument[];
};

export function ReportView({ initialReport }: { initialReport: Report }) {
  const toast = useToast();
  const initialRange = initialReport.range;
  const [report, setReport] = useState<Report>(initialReport);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load(from: string, to: string) {
    setPending(true);
    setError("");
    const params = new URLSearchParams({ from, to });
    const response = await fetch(`/api/reports/summary?${params}`);
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to prepare the report.");
      setPending(false);
      return;
    }
    setReport(result);
    setPending(false);
    toast.success("Report updated for the selected date range.");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void load(String(data.get("from")), String(data.get("to")));
  }

  return (
    <main className="page-reveal">
      <div className="grid gap-10 border-b border-rule pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vermilion">
            Period summary
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
            The numbers, in period.
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-ink-soft">
            A server-calculated register of every document issued within an
            inclusive date range.
          </p>
        </div>
        <form
          className="grid gap-4 border-l-2 border-vermilion bg-paper-light/65 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={submit}
        >
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              From
            </span>
            <input
              className="money border border-rule-dark bg-paper-light px-3 py-2.5"
              type="date"
              name="from"
              defaultValue={initialRange.from}
              required
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              To
            </span>
            <input
              className="money border border-rule-dark bg-paper-light px-3 py-2.5"
              type="date"
              name="to"
              defaultValue={initialRange.to}
              required
            />
          </label>
          <button
            className="bg-ink px-5 py-3 font-semibold text-paper-light hover:bg-vermilion disabled:opacity-50"
            type="submit"
            disabled={pending}
          >
            {pending ? "Counting…" : "Run report"}
          </button>
        </form>
      </div>

      {error ? (
        <div className="mt-7 border-l-2 border-danger px-4 py-3 text-danger" role="alert">
          {error}
        </div>
      ) : null}

      <section className="grid border-b border-rule sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Documents",
            report.summary.documentCount.toString().padStart(2, "0"),
          ],
          [
            "Grand total",
            formatMoney(report.summary.grandTotalCents),
          ],
          ["Tax collected", formatMoney(report.summary.taxCents)],
          [
            "Discounts given",
            formatMoney(report.summary.discountCents),
          ],
        ].map(([label, value], index) => (
          <div
            className={`py-7 sm:px-7 ${index > 0 ? "sm:border-l sm:border-rule" : ""}`}
            key={label}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
              {label}
            </span>
            <strong className="money mt-3 block text-3xl font-medium tracking-[-0.04em]">
              {value}
            </strong>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vermilion">
              Supporting register
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em]">
              Included documents
            </h2>
          </div>
          <span className="money text-xs text-ink-soft">
            {report.range.from} → {report.range.to}
          </span>
        </div>

        {!pending && report.documents.length === 0 ? (
          <div className="border-y border-rule py-16 text-center">
            <p className="font-serif text-2xl">No entries in this period.</p>
            <p className="mt-2 text-ink-soft">
              Adjust the dates or create a document with an issue date in range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-y border-rule">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-rule text-xs uppercase tracking-[0.13em] text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Issued</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Discount</th>
                  <th className="px-4 py-3 text-right font-semibold">Tax</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.documents.map((document) => (
                  <tr className="border-b border-rule" key={document.id}>
                    <td className="px-4 py-5">
                      <Link
                        className="font-semibold hover:text-vermilion"
                        href={`/documents/${document.id}`}
                      >
                        {document.title}
                      </Link>
                      <span className="mt-1 block text-sm text-ink-soft">
                        {document.customer}
                      </span>
                    </td>
                    <td className="money px-4 py-5 text-sm text-ink-soft">
                      {document.issueDate}
                    </td>
                    <td className="px-4 py-5">
                      <StatusStamp status={document.status} />
                    </td>
                    <td className="money px-4 py-5 text-right text-ink-soft">
                      {formatMoney(document.totals.discountCents)}
                    </td>
                    <td className="money px-4 py-5 text-right text-ink-soft">
                      {formatMoney(document.totals.taxCents)}
                    </td>
                    <td className="money px-4 py-5 text-right font-semibold">
                      {formatMoney(document.totals.grandTotalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
