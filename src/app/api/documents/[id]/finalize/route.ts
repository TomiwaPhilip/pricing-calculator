import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/request-user";
import { lineInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;

  const result = await prisma.$transaction(async (transaction) => {
    const document = await transaction.document.findFirst({
      where: { id, userId: auth.user.id },
      include: documentWithLines,
    });
    if (!document) return { error: apiError("Document not found.", 404) };
    if (document.status === "FINALIZED") {
      return { error: apiError("Document is already finalized.", 409) };
    }
    if (document.lines.length === 0) {
      return {
        error: apiError(
          "Add at least one valid line item before finalizing.",
          400,
        ),
      };
    }

    for (const line of document.lines) {
      const validation = lineInputSchema.safeParse(line);
      if (!validation.success) {
        return {
          error: apiError(
            "Every line item must be valid before finalizing.",
            400,
            validation.error.flatten(),
          ),
        };
      }
    }

    const updated = await transaction.document.updateMany({
      where: { id, userId: auth.user.id, status: "DRAFT" },
      data: { status: "FINALIZED" },
    });
    if (updated.count !== 1) {
      return {
        error: apiError("Document could not be finalized.", 409),
      };
    }

    const finalized = await transaction.document.findUniqueOrThrow({
      where: { id },
      include: documentWithLines,
    });
    return { document: finalized };
  });

  if ("error" in result) return result.error;
  return NextResponse.json({ document: serializeDocument(result.document) });
}
