import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { StatusStamp } from "@/components/status-stamp";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/calculations";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Printable document" };

export default async function PrintDocumentPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const record = await prisma.document.findFirst({
    where: { id, userId: user.id },
    include: documentWithLines,
  });
  if (!record) notFound();
  const document = serializeDocument(record);

  return (
    <main className="mx-auto max-w-5xl bg-paper-light p-6 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
      <div className="mb-12 flex items-center justify-between gap-6 border-b-2 border-ink pb-5 print:hidden">
        <Link
          className="font-semibold underline decoration-vermilion decoration-2 underline-offset-4"
          href={`/documents/${document.id}`}
        >
          ← Back to document
        </Link>
        <PrintButton />
      </div>

      <header className="flex flex-col justify-between gap-8 border-b-2 border-ink pb-8 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vermilion">
            Pricing document
          </p>
          <h1 className="mt-3 font-serif text-5xl font-semibold tracking-[-0.05em]">
            {document.title}
          </h1>
          <p className="mt-3 text-lg text-ink-soft">{document.customer}</p>
        </div>
        <dl className="grid min-w-52 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Status
            </dt>
            <dd className="mt-1">
              <StatusStamp status={document.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Issue date
            </dt>
            <dd className="money mt-1">{document.issueDate}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Reference
            </dt>
            <dd className="money mt-1">{document.id.slice(-8)}</dd>
          </div>
        </dl>
      </header>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse border-y border-rule text-left">
          <thead>
            <tr className="border-b border-rule text-xs uppercase tracking-[0.12em] text-ink-soft">
              <th className="px-3 py-3 font-semibold">Description</th>
              <th className="px-3 py-3 text-right font-semibold">Qty</th>
              <th className="px-3 py-3 text-right font-semibold">Unit</th>
              <th className="px-3 py-3 text-right font-semibold">Discount</th>
              <th className="px-3 py-3 text-right font-semibold">Tax</th>
              <th className="px-3 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {document.lines.map((line) => (
              <tr className="border-b border-rule" key={line.id}>
                <td className="px-3 py-5 font-medium">{line.description}</td>
                <td className="money px-3 py-5 text-right">{line.quantity}</td>
                <td className="money px-3 py-5 text-right">
                  {formatMoney(line.unitPriceCents)}
                </td>
                <td className="money px-3 py-5 text-right text-ink-soft">
                  {line.discountCents
                    ? `−${formatMoney(line.discountCents)}`
                    : "—"}
                </td>
                <td className="money px-3 py-5 text-right text-ink-soft">
                  {line.taxCents ? formatMoney(line.taxCents) : "—"}
                </td>
                <td className="money px-3 py-5 text-right font-semibold">
                  {formatMoney(line.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 ml-auto grid max-w-md border-t-2 border-ink">
        {[
          ["Subtotal", document.totals.subtotalCents],
          ["Discounts", -document.totals.discountCents],
          ["Tax", document.totals.taxCents],
        ].map(([label, value]) => (
          <div
            className="flex justify-between border-b border-rule py-3"
            key={String(label)}
          >
            <span className="text-sm text-ink-soft">{label}</span>
            <span className="money text-sm">
              {Number(value) < 0 ? "−" : ""}
              {formatMoney(Math.abs(Number(value)))}
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-b-2 border-ink py-5">
          <strong className="font-serif text-2xl">Grand total</strong>
          <strong className="money text-2xl">
            {formatMoney(document.totals.grandTotalCents)}
          </strong>
        </div>
      </section>
    </main>
  );
}
