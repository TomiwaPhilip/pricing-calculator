export type DiscountKind = "FIXED" | "PERCENT";

export type CalculationLine = {
  id?: string;
  description?: string;
  quantity: number;
  unitPriceCents: number;
  discountType: DiscountKind | null;
  discountValue: number | null;
  taxRateBasis: number;
};

export type CalculatedLine = CalculationLine & {
  subtotalCents: number;
  discountCents: number;
  discountedCents: number;
  taxCents: number;
  totalCents: number;
};

export type DocumentTotals = {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  grandTotalCents: number;
};

function roundHalfUp(numerator: number, denominator: number) {
  return Math.floor((numerator + denominator / 2) / denominator);
}

export function calculateLine(line: CalculationLine): CalculatedLine {
  const subtotalCents = line.quantity * line.unitPriceCents;
  let discountCents = 0;

  if (line.discountType === "FIXED") {
    discountCents = line.discountValue ?? 0;
  } else if (line.discountType === "PERCENT") {
    discountCents = roundHalfUp(
      subtotalCents * (line.discountValue ?? 0),
      10_000,
    );
  }

  const discountedCents = subtotalCents - discountCents;
  const taxCents = roundHalfUp(discountedCents * line.taxRateBasis, 10_000);

  return {
    ...line,
    subtotalCents,
    discountCents,
    discountedCents,
    taxCents,
    totalCents: discountedCents + taxCents,
  };
}

export function calculateDocument(lines: CalculationLine[]) {
  const calculatedLines = lines.map(calculateLine);
  const totals = calculatedLines.reduce<DocumentTotals>(
    (result, line) => ({
      subtotalCents: result.subtotalCents + line.subtotalCents,
      discountCents: result.discountCents + line.discountCents,
      taxCents: result.taxCents + line.taxCents,
      grandTotalCents: result.grandTotalCents + line.totalCents,
    }),
    {
      subtotalCents: 0,
      discountCents: 0,
      taxCents: 0,
      grandTotalCents: 0,
    },
  );

  return { lines: calculatedLines, totals };
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function parseMoneyToCents(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function basisPointsToPercent(value: number) {
  return value / 100;
}
