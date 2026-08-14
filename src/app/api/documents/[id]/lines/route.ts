import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError, validationError } from "@/lib/api";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/request-user";
import { lineInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;

  try {
    const input = lineInputSchema.parse(await request.json());
    const existing = await prisma.document.findFirst({
      where: { id, userId: auth.user.id },
    });
    if (!existing) return apiError("Document not found.", 404);
    if (existing.status === "FINALIZED") {
      return apiError("Finalized documents cannot be edited.", 409);
    }

    await prisma.lineItem.create({
      data: {
        ...input,
        documentId: id,
      },
    });
    const document = await prisma.document.findUniqueOrThrow({
      where: { id },
      include: documentWithLines,
    });

    return NextResponse.json(
      { document: serializeDocument(document) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    throw error;
  }
}
