import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { validationError } from "@/lib/api";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/request-user";
import { documentInputSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const documents = await prisma.document.findMany({
    where: { userId: auth.user.id },
    include: documentWithLines,
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    documents: documents.map(serializeDocument),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const input = documentInputSchema.parse(await request.json());
    const document = await prisma.document.create({
      data: {
        userId: auth.user.id,
        title: input.title,
        customer: input.customer,
        issueDate: new Date(`${input.issueDate}T00:00:00.000Z`),
      },
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
