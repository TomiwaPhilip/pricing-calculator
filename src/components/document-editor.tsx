"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/toast-provider";
import {
  basisPointsToPercent,
  formatMoney,
  parseMoneyToCents,
} from "@/lib/calculations";
import type { SerializedDocument } from "@/lib/documents";
import { StatusStamp } from "@/components/status-stamp";

type Line = SerializedDocument["lines"][number];

function parsePercent(value: FormDataEntryValue | null) {
  const input = String(value ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(input)) return null;
  const basis = Math.round(Number(input) * 100);
  return basis >= 0 && basis <= 10_000 ? basis : null;
}

function linePayload(form: FormData, position: number) {
  const unitPriceCents = parseMoneyToCents(String(form.get("unitPrice")));
  const quantity = Number(form.get("quantity"));
  const discountTypeValue = String(form.get("discountType"));
  const discountType =
    discountTypeValue === "FIXED" || discountTypeValue === "PERCENT"
      ? discountTypeValue
      : null;
  const discountValueRaw = String(form.get("discountValue") ?? "");
  const discountValue =
    discountType === "FIXED"
      ? parseMoneyToCents(discountValueRaw)
      : discountType === "PERCENT"
        ? parsePercent(discountValueRaw)
        : null;
  const taxRateBasis = parsePercent(form.get("taxRate"));

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    unitPriceCents === null ||
    taxRateBasis === null ||
    (discountType !== null && discountValue === null)
  ) {
    return null;
  }

  return {
    description: String(form.get("description")),
    quantity,
    unitPriceCents,
    discountType,
    discountValue,
    taxRateBasis,
    position,
  };
}

function LineForm({
  line,
  endpoint,
  position,
  onSaved,
  onCancel,
}: {
  line?: Line & { documentId: string };
  endpoint?: string;
  position: number;
  onSaved: (document: SerializedDocument) => void;
  onCancel?: () => void;
}) {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [discountType, setDiscountType] = useState(
    line?.discountType ?? "NONE",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = linePayload(new FormData(event.currentTarget), position);
    if (!payload) {
      setError("Enter valid amounts and percentages between 0 and 100.");
      return;
    }

    setPending(true);
    setError("");
    const response = await fetch(
      line
        ? `/api/documents/${line.documentId}/lines/${line.id}`
        : endpoint!,
      {
        method: line ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to save the line item.");
      setPending(false);
      return;
    }
    onSaved(result.document);
    toast.success(line ? "Line item updated." : "Line item added.");
  }

  const fieldClass =
    "w-full border border-rule-dark bg-paper-light px-3 py-2.5 outline-none transition focus:border-vermilion";

  return (
    <form
      className="grid gap-4 border-l-2 border-vermilion bg-paper-light/70 p-5 lg:grid-cols-12"
      onSubmit={submit}
    >
      {error ? (
        <p className="text-sm text-danger lg:col-span-12" role="alert">
          {error}
        </p>
      ) : null}
      <label className="lg:col-span-3">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Description
        </span>
        <input
          className={fieldClass}
          name="description"
          defaultValue={line?.description}
          maxLength={200}
          required
        />
      </label>
      <label className="lg:col-span-1">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Qty
        </span>
        <input
          className={fieldClass}
          name="quantity"
          type="number"
          min="1"
          step="1"
          defaultValue={line?.quantity ?? 1}
          required
        />
      </label>
      <label className="lg:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Unit price
        </span>
        <input
          className={`${fieldClass} money`}
          name="unitPrice"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={
            line ? (line.unitPriceCents / 100).toFixed(2) : undefined
          }
          required
        />
      </label>
      <label className="lg:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Discount
        </span>
        <select
          className={fieldClass}
          name="discountType"
          value={discountType}
          onChange={(event) => setDiscountType(event.target.value)}
        >
          <option value="NONE">None</option>
          <option value="PERCENT">Percent</option>
          <option value="FIXED">Fixed amount</option>
        </select>
      </label>
      <label className="lg:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {discountType === "FIXED" ? "Amount" : "Percent"}
        </span>
        <input
          className={`${fieldClass} money disabled:opacity-40`}
          name="discountValue"
          inputMode="decimal"
          placeholder={discountType === "FIXED" ? "0.00" : "0"}
          disabled={discountType === "NONE"}
          defaultValue={
            line?.discountValue !== null && line?.discountValue !== undefined
              ? line.discountType === "FIXED"
                ? (line.discountValue / 100).toFixed(2)
                : basisPointsToPercent(line.discountValue)
              : undefined
          }
          required={discountType !== "NONE"}
        />
      </label>
      <label className="lg:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          Tax %
        </span>
        <input
          className={`${fieldClass} money`}
          name="taxRate"
          inputMode="decimal"
          defaultValue={line ? basisPointsToPercent(line.taxRateBasis) : "0"}
          required
        />
      </label>
      <div className="flex items-center gap-4 lg:col-span-12">
        <button
          className="bg-ink px-4 py-2.5 text-sm font-semibold text-paper-light hover:bg-vermilion disabled:opacity-50"
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving…" : line ? "Save changes" : "Add line"}
        </button>
        {onCancel ? (
          <button
            className="text-sm font-semibold text-ink-soft hover:text-ink"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function EditableLine({
  line,
  documentId,
  onChanged,
}: {
  line: Line;
  documentId: string;
  onChanged: (document: SerializedDocument) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lineWithDocument = { ...line, documentId };

  async function remove() {
    setPending(true);
    setError("");
    const response = await fetch(
      `/api/documents/${documentId}/lines/${line.id}`,
      { method: "DELETE" },
    );
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to remove the line item.");
      setPending(false);
      return;
    }
    onChanged(result.document);
    toast.success("Line item removed.");
  }

  if (editing) {
    return (
      <tr>
        <td className="py-3" colSpan={8}>
          <LineForm
            line={lineWithDocument}
            position={line.position}
            onSaved={(document) => {
              onChanged(document);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="border-b border-rule align-top">
        <td className="px-3 py-5 font-medium">{line.description}</td>
        <td className="money px-3 py-5 text-right">{line.quantity}</td>
        <td className="money px-3 py-5 text-right">
          {formatMoney(line.unitPriceCents)}
        </td>
        <td className="money px-3 py-5 text-right text-ink-soft">
          {line.discountCents ? `−${formatMoney(line.discountCents)}` : "—"}
        </td>
        <td className="money px-3 py-5 text-right text-ink-soft">
          {line.taxCents ? formatMoney(line.taxCents) : "—"}
        </td>
        <td className="money px-3 py-5 text-right font-semibold">
          {formatMoney(line.totalCents)}
        </td>
        <td className="px-3 py-5 text-right">
          <div className="flex justify-end gap-3">
            <button
              className="min-h-11 px-1 text-xs font-semibold uppercase tracking-[0.1em] hover:text-vermilion"
              type="button"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              className="min-h-11 px-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft hover:text-danger disabled:opacity-50"
              type="button"
              onClick={remove}
              disabled={pending}
            >
              {pending ? "Removing" : "Remove"}
            </button>
          </div>
        </td>
      </tr>
      {error ? (
        <tr>
          <td className="pb-3 text-sm text-danger" colSpan={7}>
            {error}
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function DocumentEditor({
  initialDocument,
}: {
  initialDocument: SerializedDocument;
}) {
  const router = useRouter();
  const toast = useToast();
  const [document, setDocument] = useState(initialDocument);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const editable = document.status === "DRAFT";

  function updateDocument(next: SerializedDocument) {
    setDocument(next);
    setAddKey((value) => value + 1);
    router.refresh();
  }

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        customer: data.get("customer"),
        issueDate: data.get("issueDate"),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to save document details.");
      setPending(false);
      return;
    }
    updateDocument(result.document);
    setPending(false);
    toast.success("Document details saved.");
  }

  async function finalize() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/documents/${document.id}/finalize`, {
      method: "POST",
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to finalize the document.");
      setPending(false);
      setConfirmFinalize(false);
      return;
    }
    updateDocument(result.document);
    setPending(false);
    setConfirmFinalize(false);
    toast.success("Document finalized. It is now read-only.");
  }

  async function duplicateDocument() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/documents/${document.id}/duplicate`, {
      method: "POST",
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Unable to duplicate the document.");
      setPending(false);
      return;
    }
    toast.success("Finalized document copied to a new draft.");
    router.push(`/documents/${result.document.id}`);
    router.refresh();
  }

  async function deleteDocument() {
    if (!window.confirm("Delete this draft permanently?")) return;
    setPending(true);
    const response = await fetch(`/api/documents/${document.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast.success("Draft deleted.");
      router.push("/documents");
      router.refresh();
      return;
    }
    const result = await response.json();
    setError(result.error ?? "Unable to delete the draft.");
    setPending(false);
  }

  const inputClass =
    "w-full border-0 border-b border-rule-dark bg-transparent px-0 py-2 text-lg outline-none focus:border-vermilion disabled:opacity-70";

  return (
    <main className="page-reveal">
      <div className="flex flex-col justify-between gap-8 border-b border-rule pb-8 lg:flex-row lg:items-start">
        <form
          className="grid flex-1 gap-7 md:grid-cols-2"
          onSubmit={saveMetadata}
        >
          <div className="md:col-span-2">
            <div className="mb-5 flex items-center gap-4">
              <StatusStamp status={document.status} />
              <span className="money text-xs uppercase tracking-[0.12em] text-ink-soft">
                Ref. {document.id.slice(-8)}
              </span>
            </div>
            <label>
              <span className="sr-only">Document title</span>
              <input
                className="w-full border-0 bg-transparent p-0 font-serif text-5xl font-semibold tracking-[-0.05em] outline-none placeholder:text-rule-dark sm:text-6xl"
                name="title"
                defaultValue={document.title}
                disabled={!editable}
                maxLength={120}
                required
              />
            </label>
          </div>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Customer
            </span>
            <input
              className={inputClass}
              name="customer"
              defaultValue={document.customer}
              disabled={!editable}
              required
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
              Issue date
            </span>
            <input
              className={`${inputClass} money`}
              name="issueDate"
              type="date"
              defaultValue={document.issueDate}
              disabled={!editable}
              required
            />
          </label>
          {editable ? (
            <div className="md:col-span-2">
              <button
                className="border-b-2 border-vermilion pb-1 text-sm font-semibold disabled:opacity-50"
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving…" : "Save document details"}
              </button>
            </div>
          ) : (
            <section className="mt-14 flex flex-col justify-between gap-5 border-t border-rule pt-7 sm:flex-row sm:items-center">
              <p className="max-w-md text-sm leading-6 text-ink-soft">
                Need another version? Duplicate this locked record into a fully
                editable draft, or open a clean printable view.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  className="border-b-2 border-vermilion pb-1 text-sm font-semibold"
                  href={`/documents/${document.id}/print`}
                >
                  Printable view
                </Link>
                <button
                  className="bg-mineral px-6 py-3.5 font-semibold text-paper-light transition hover:bg-ink disabled:opacity-50"
                  type="button"
                  onClick={duplicateDocument}
                  disabled={pending}
                >
                  {pending ? "Duplicating…" : "Duplicate as draft"}
                </button>
              </div>
            </section>
          )}
        </form>

        <aside className="w-full border-l-2 border-ink pl-5 lg:w-72">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Grand total
          </span>
          <strong className="money mt-2 block text-4xl font-medium tracking-[-0.04em]">
            {formatMoney(document.totals.grandTotalCents)}
          </strong>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            {editable
              ? "Live server-calculated total for this draft."
              : "Finalized amount. This record is now read-only."}
          </p>
        </aside>
      </div>

      {error ? (
        <div
          className="mt-7 border-l-2 border-danger bg-paper-light px-4 py-3 text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vermilion">
              Schedule of work
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em]">
              Line items
            </h2>
          </div>
          <span className="money text-xs text-ink-soft">
            {document.lines.length.toString().padStart(2, "0")} entries
          </span>
        </div>

        {document.lines.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse border-y border-rule text-left">
              <thead>
                <tr className="border-b border-rule text-xs uppercase tracking-[0.12em] text-ink-soft">
                  <th className="px-3 py-3 font-semibold">Description</th>
                  <th className="px-3 py-3 text-right font-semibold">Qty</th>
                  <th className="px-3 py-3 text-right font-semibold">Unit</th>
                  <th className="px-3 py-3 text-right font-semibold">Discount</th>
                  <th className="px-3 py-3 text-right font-semibold">Tax</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {document.lines.map((line) =>
                  editable ? (
                    <EditableLine
                      key={line.id}
                      line={line}
                      documentId={document.id}
                      onChanged={updateDocument}
                    />
                  ) : (
                    <tr className="border-b border-rule" key={line.id}>
                      <td className="px-3 py-5 font-medium">{line.description}</td>
                      <td className="money px-3 py-5 text-right">{line.quantity}</td>
                      <td className="money px-3 py-5 text-right">
                        {formatMoney(line.unitPriceCents)}
                      </td>
                      <td className="money px-3 py-5 text-right text-ink-soft">
                        {line.discountCents
                          ? `−${formatMoney(line.discountCents)}`
                          : "—"}
                      </td>
                      <td className="money px-3 py-5 text-right text-ink-soft">
                        {line.taxCents ? formatMoney(line.taxCents) : "—"}
                      </td>
                      <td className="money px-3 py-5 text-right font-semibold">
                        {formatMoney(line.totalCents)}
                      </td>
                      <td />
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-y border-rule py-10 text-center text-ink-soft">
            No line items yet. Add the first item below.
          </div>
        )}

        {editable ? (
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
              Add another line
            </p>
            <div key={addKey}>
              <LineForm
                endpoint={`/api/documents/${document.id}/lines`}
                position={document.lines.length}
                onSaved={updateDocument}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-12 ml-auto grid max-w-xl border-t border-ink">
        {[
          ["Subtotal", document.totals.subtotalCents],
          ["Discounts", -document.totals.discountCents],
          ["Tax", document.totals.taxCents],
        ].map(([label, value]) => (
          <div
            className="flex justify-between border-b border-rule py-3"
            key={String(label)}
          >
            <span className="text-sm text-ink-soft">{label}</span>
            <span className="money text-sm">
              {Number(value) < 0 ? "−" : ""}
              {formatMoney(Math.abs(Number(value)))}
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-b-2 border-ink py-5">
          <strong className="font-serif text-2xl">Grand total</strong>
          <strong className="money text-2xl">
            {formatMoney(document.totals.grandTotalCents)}
          </strong>
        </div>
      </section>

      {editable ? (
        <section className="mt-14 flex flex-col justify-between gap-6 border-t border-rule pt-7 sm:flex-row sm:items-center">
          <button
            className="text-left text-sm font-semibold text-danger hover:underline disabled:opacity-50"
            type="button"
            onClick={deleteDocument}
            disabled={pending}
          >
            Delete draft
          </button>
          {confirmFinalize ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm text-ink-soft">
                This cannot be undone. Finalize?
              </p>
              <button
                className="bg-vermilion px-5 py-3 font-semibold text-white hover:bg-vermilion-dark disabled:opacity-50"
                type="button"
                onClick={finalize}
                disabled={pending}
              >
                {pending ? "Finalizing…" : "Yes, finalize"}
              </button>
              <button
                className="text-sm font-semibold"
                type="button"
                onClick={() => setConfirmFinalize(false)}
              >
                Not yet
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-5">
              <Link
                className="border-b-2 border-vermilion pb-1 text-sm font-semibold"
                href={`/documents/${document.id}/print`}
              >
                Printable view
              </Link>
              <button
                className="bg-mineral px-6 py-3.5 font-semibold text-paper-light transition hover:bg-ink"
                type="button"
                onClick={() => setConfirmFinalize(true)}
              >
                Finalize document →
              </button>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
