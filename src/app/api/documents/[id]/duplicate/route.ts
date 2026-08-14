import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/request-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;

  const result = await prisma.$transaction(async (transaction) => {
    const source = await transaction.document.findFirst({
      where: { id, userId: auth.user.id },
      include: documentWithLines,
    });
    if (!source) return { error: apiError("Document not found.", 404) };
    if (source.status !== "FINALIZED") {
      return {
        error: apiError("Only finalized documents can be duplicated.", 409),
      };
    }

    const duplicate = await transaction.document.create({
      data: {
        userId: auth.user.id,
        title: `Copy of ${source.title}`.slice(0, 120),
        customer: source.customer,
        issueDate: source.issueDate,
        lines: {
          create: source.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            discountType: line.discountType,
            discountValue: line.discountValue,
            taxRateBasis: line.taxRateBasis,
            position: line.position,
          })),
        },
      },
      include: documentWithLines,
    });

    return { document: duplicate };
  });

  if ("error" in result) return result.error;
  return NextResponse.json(
    { document: serializeDocument(result.document) },
    { status: 201 },
  );
}
