import Link from "next/link";

export function Logo({ linked = true }: { linked?: boolean }) {
  const mark = (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-serif text-[2rem] font-semibold leading-none tracking-[-0.06em]">
        Folio
      </span>
      <span className="h-2 w-2 rounded-full bg-vermilion" aria-hidden="true" />
    </span>
  );

  return linked ? (
    <Link href="/documents" aria-label="Folio documents">
      {mark}
    </Link>
  ) : (
    mark
  );
}
