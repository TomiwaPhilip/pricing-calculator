import { Metadata } from "next";
import { NewDocumentForm } from "@/components/new-document-form";

export const metadata: Metadata = { title: "New document" };

export default function NewDocumentPage() {
  return (
    <main className="page-reveal">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vermilion">
        New draft / Step 01
      </p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">
        Name the work before counting it.
      </h1>
      <p className="mt-5 max-w-xl leading-7 text-ink-soft">
        Start with the document details. Line items, discounts, and taxes come
        next.
      </p>
      <NewDocumentForm />
    </main>
  );
}
