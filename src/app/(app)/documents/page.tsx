import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/calculations";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusStamp } from "@/components/status-stamp";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const records = await prisma.document.findMany({
    where: { userId: user.id },
    include: documentWithLines,
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });
  const documents = records.map(serializeDocument);
  const openValue = documents
    .filter((document) => document.status === "DRAFT")
    .reduce((sum, document) => sum + document.totals.grandTotalCents, 0);

  return (
    <main className="page-reveal">
      <div className="flex flex-col justify-between gap-8 border-b border-rule pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vermilion">
            Document register
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Your documents
          </h1>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Draft carefully. Finalize confidently. Every amount is recalculated
            on the server.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-between gap-8 bg-ink px-5 py-3.5 font-semibold text-paper-light transition hover:bg-vermilion"
          href="/documents/new"
        >
          New document <span aria-hidden="true">＋</span>
        </Link>
      </div>

      <section className="grid border-b border-rule sm:grid-cols-3">
        <div className="border-b border-rule py-6 sm:border-b-0 sm:border-r sm:pr-8">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Total records
          </span>
          <strong className="money mt-2 block text-3xl font-medium">
            {documents.length.toString().padStart(2, "0")}
          </strong>
        </div>
        <div className="border-b border-rule py-6 sm:border-b-0 sm:border-r sm:px-8">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Active drafts
          </span>
          <strong className="money mt-2 block text-3xl font-medium">
            {documents
              .filter((document) => document.status === "DRAFT")
              .length.toString()
              .padStart(2, "0")}
          </strong>
        </div>
        <div className="py-6 sm:pl-8">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Draft value
          </span>
          <strong className="money mt-2 block text-3xl font-medium">
            {formatMoney(openValue)}
          </strong>
        </div>
      </section>

      {documents.length === 0 ? (
        <section className="py-24 text-center">
          <p className="font-serif text-3xl">A clean ledger.</p>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            Your first pricing document will appear here with its customer,
            issue date, status, and exact total.
          </p>
          <Link
            className="mt-8 inline-block border-b-2 border-vermilion pb-1 font-semibold"
            href="/documents/new"
          >
            Create the first document
          </Link>
        </section>
      ) : (
        <div className="mt-10 overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule text-xs uppercase tracking-[0.15em] text-ink-soft">
                <th className="px-4 py-4 font-semibold">Document</th>
                <th className="px-4 py-4 font-semibold">Customer</th>
                <th className="px-4 py-4 font-semibold">Issued</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document, index) => (
                <tr
                  className="group border-b border-rule last:border-b-0 hover:bg-paper-light/60"
                  key={document.id}
                >
                  <td className="px-4 py-5">
                    <Link
                      className="flex items-baseline gap-3 font-semibold group-hover:text-vermilion"
                      href={`/documents/${document.id}`}
                    >
                      <span className="money text-xs text-ink-soft">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      {document.title}
                    </Link>
                  </td>
                  <td className="px-4 py-5 text-ink-soft">
                    {document.customer}
                  </td>
                  <td className="money px-4 py-5 text-sm text-ink-soft">
                    {document.issueDate}
                  </td>
                  <td className="px-4 py-5">
                    <StatusStamp status={document.status} />
                  </td>
                  <td className="money px-4 py-5 text-right font-medium">
                    {formatMoney(document.totals.grandTotalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
