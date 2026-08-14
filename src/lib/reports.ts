import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

export async function buildSummaryReport(
  userId: string,
  range: { from: string; to: string },
) {
  const records = await prisma.document.findMany({
    where: {
      userId,
      issueDate: {
        gte: new Date(`${range.from}T00:00:00.000Z`),
        lte: new Date(`${range.to}T00:00:00.000Z`),
      },
    },
    include: documentWithLines,
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });
  const documents = records.map(serializeDocument);
  const summary = documents.reduce(
    (totals, document) => ({
      documentCount: totals.documentCount + 1,
      grandTotalCents:
        totals.grandTotalCents + document.totals.grandTotalCents,
      taxCents: totals.taxCents + document.totals.taxCents,
      discountCents:
        totals.discountCents + document.totals.discountCents,
    }),
    {
      documentCount: 0,
      grandTotalCents: 0,
      taxCents: 0,
      discountCents: 0,
    },
  );

  return { range, summary, documents };
}
