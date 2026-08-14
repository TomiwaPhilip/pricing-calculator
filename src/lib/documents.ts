import { Prisma } from "@prisma/client";
import { calculateDocument } from "@/lib/calculations";

export const documentWithLines = {
  lines: {
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
  },
} satisfies Prisma.DocumentInclude;

export type DocumentWithLines = Prisma.DocumentGetPayload<{
  include: typeof documentWithLines;
}>;

export function serializeDocument(document: DocumentWithLines) {
  const calculation = calculateDocument(
    document.lines.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      discountType: line.discountType,
      discountValue: line.discountValue,
      taxRateBasis: line.taxRateBasis,
    })),
  );

  return {
    id: document.id,
    title: document.title,
    customer: document.customer,
    issueDate: document.issueDate.toISOString().slice(0, 10),
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    lines: calculation.lines.map((line, index) => ({
      ...line,
      position: document.lines[index].position,
    })),
    totals: calculation.totals,
  };
}

export type SerializedDocument = ReturnType<typeof serializeDocument>;
