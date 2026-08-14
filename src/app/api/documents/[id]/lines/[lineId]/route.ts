import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError, validationError } from "@/lib/api";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/request-user";
import { lineInputSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string; lineId: string }>;
};

async function getOwnedDraft(userId: string, id: string) {
  const document = await prisma.document.findFirst({
    where: { id, userId },
  });
  if (!document) return { error: apiError("Document not found.", 404) };
  if (document.status === "FINALIZED") {
    return {
      error: apiError("Finalized documents cannot be edited.", 409),
    };
  }
  return { document };
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id, lineId } = await context.params;

  try {
    const input = lineInputSchema.parse(await request.json());
    const ownership = await getOwnedDraft(auth.user.id, id);
    if (ownership.error) return ownership.error;

    const line = await prisma.lineItem.findFirst({
      where: { id: lineId, documentId: id },
    });
    if (!line) return apiError("Line item not found.", 404);

    await prisma.lineItem.update({
      where: { id: lineId },
      data: input,
    });
    const document = await prisma.document.findUniqueOrThrow({
      where: { id },
      include: documentWithLines,
    });
    return NextResponse.json({ document: serializeDocument(document) });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    throw error;
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id, lineId } = await context.params;
  const ownership = await getOwnedDraft(auth.user.id, id);
  if (ownership.error) return ownership.error;

  const deleted = await prisma.lineItem.deleteMany({
    where: { id: lineId, documentId: id },
  });
  if (deleted.count === 0) return apiError("Line item not found.", 404);

  const document = await prisma.document.findUniqueOrThrow({
    where: { id },
    include: documentWithLines,
  });
  return NextResponse.json({ document: serializeDocument(document) });
}
