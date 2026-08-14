import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DocumentEditor } from "@/components/document-editor";
import { getCurrentUser } from "@/lib/auth";
import { documentWithLines, serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Document" };
  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    select: { title: true },
  });
  return { title: document?.title ?? "Document" };
}

export default async function DocumentPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, userId: user.id },
    include: documentWithLines,
  });
  if (!document) notFound();

  return <DocumentEditor initialDocument={serializeDocument(document)} />;
}
