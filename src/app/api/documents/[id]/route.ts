import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError, validationError } from "@/lib/api";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/request-user";
import { documentInputSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;

  const document = await prisma.document.findFirst({
    where: { id, userId: auth.user.id },
    include: documentWithLines,
  });
  if (!document) return apiError("Document not found.", 404);

  return NextResponse.json({ document: serializeDocument(document) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;

  try {
    const input = documentInputSchema.parse(await request.json());
    const existing = await prisma.document.findFirst({
      where: { id, userId: auth.user.id },
    });
    if (!existing) return apiError("Document not found.", 404);
    if (existing.status === "FINALIZED") {
      return apiError("Finalized documents cannot be edited.", 409);
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        title: input.title,
        customer: input.customer,
        issueDate: new Date(`${input.issueDate}T00:00:00.000Z`),
      },
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
  const { id } = await context.params;

  const existing = await prisma.document.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) return apiError("Document not found.", 404);
  if (existing.status === "FINALIZED") {
    return apiError("Finalized documents cannot be deleted.", 409);
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
