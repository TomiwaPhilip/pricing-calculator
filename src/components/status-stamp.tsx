export function StatusStamp({ status }: { status: "DRAFT" | "FINALIZED" }) {
  const finalized = status === "FINALIZED";
  return (
    <span
      className={`inline-flex rotate-[-1deg] items-center border px-2.5 py-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${
        finalized
          ? "border-mineral text-mineral"
          : "border-vermilion text-vermilion"
      }`}
    >
      {finalized ? "Finalized" : "Draft"}
    </span>
  );
}
