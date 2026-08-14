"use client";

export function PrintButton() {
  return (
    <button
      className="bg-ink px-5 py-3 font-semibold text-paper-light transition hover:bg-vermilion print:hidden"
      type="button"
      onClick={() => window.print()}
    >
      Print document
    </button>
  );
}
