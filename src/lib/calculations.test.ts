import { describe, expect, it } from "vitest";
import {
  calculateDocument,
  calculateLine,
  parseMoneyToCents,
} from "@/lib/calculations";
import {
  documentInputSchema,
  lineInputSchema,
  reportRangeSchema,
} from "@/lib/validation";

describe("calculateLine", () => {
  it("applies percentage discount before tax", () => {
    const line = calculateLine({
      quantity: 2,
      unitPriceCents: 10_000,
      discountType: "PERCENT",
      discountValue: 1_000,
      taxRateBasis: 500,
    });

    expect(line).toMatchObject({
      subtotalCents: 20_000,
      discountCents: 2_000,
      discountedCents: 18_000,
      taxCents: 900,
      totalCents: 18_900,
    });
  });

  it("supports a fixed discount without tax", () => {
    const line = calculateLine({
      quantity: 1,
      unitPriceCents: 20_000,
      discountType: "FIXED",
      discountValue: 2_000,
      taxRateBasis: 0,
    });

    expect(line.discountCents).toBe(2_000);
    expect(line.totalCents).toBe(18_000);
  });

  it("rounds half a cent upward per line", () => {
    const line = calculateLine({
      quantity: 1,
      unitPriceCents: 1,
      discountType: null,
      discountValue: null,
      taxRateBasis: 5_000,
    });

    expect(line.taxCents).toBe(1);
    expect(line.totalCents).toBe(2);
  });

  it("allows a full percentage discount", () => {
    const line = calculateLine({
      quantity: 1,
      unitPriceCents: 5_000,
      discountType: "PERCENT",
      discountValue: 10_000,
      taxRateBasis: 2_000,
    });

    expect(line.discountedCents).toBe(0);
    expect(line.taxCents).toBe(0);
    expect(line.totalCents).toBe(0);
  });
});

describe("calculateDocument", () => {
  it("matches the assignment sample exactly", () => {
    const result = calculateDocument([
      {
        description: "Widget A",
        quantity: 2,
        unitPriceCents: 10_000,
        discountType: "PERCENT",
        discountValue: 1_000,
        taxRateBasis: 500,
      },
      {
        description: "Widget B",
        quantity: 1,
        unitPriceCents: 5_000,
        discountType: null,
        discountValue: null,
        taxRateBasis: 500,
      },
      {
        description: "Service fee",
        quantity: 1,
        unitPriceCents: 20_000,
        discountType: "FIXED",
        discountValue: 2_000,
        taxRateBasis: 0,
      },
    ]);

    expect(result.totals).toEqual({
      subtotalCents: 45_000,
      discountCents: 4_000,
      taxCents: 1_150,
      grandTotalCents: 42_150,
    });
  });
});

describe("line validation", () => {
  it("returns specific messages for invalid finalization inputs", () => {
    const zeroQuantity = lineInputSchema.safeParse({
      description: "Invalid item",
      quantity: 0,
      unitPriceCents: 1_000,
      discountType: null,
      discountValue: null,
      taxRateBasis: 0,
      position: 0,
    });
    const negativePrice = lineInputSchema.safeParse({
      description: "Invalid item",
      quantity: 1,
      unitPriceCents: -1,
      discountType: null,
      discountValue: null,
      taxRateBasis: 0,
      position: 0,
    });

    expect(zeroQuantity.error?.issues[0].message).toBe(
      "Quantity must be at least 1.",
    );
    expect(negativePrice.error?.issues[0].message).toBe(
      "Unit price cannot be negative.",
    );
  });

  it("rejects a fixed discount above the subtotal", () => {
    const result = lineInputSchema.safeParse({
      description: "Item",
      quantity: 1,
      unitPriceCents: 1_000,
      discountType: "FIXED",
      discountValue: 1_001,
      taxRateBasis: 0,
      position: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects rates above 100 percent", () => {
    const result = lineInputSchema.safeParse({
      description: "Item",
      quantity: 1,
      unitPriceCents: 1_000,
      discountType: "PERCENT",
      discountValue: 10_001,
      taxRateBasis: 10_001,
      position: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("parseMoneyToCents", () => {
  it.each([
    ["0", 0],
    ["12", 1_200],
    ["12.3", 1_230],
    ["12.34", 1_234],
  ])("parses %s", (input, expected) => {
    expect(parseMoneyToCents(input)).toBe(expected);
  });

  it.each(["-1", "12.345", "abc", ""])("rejects %s", (input) => {
    expect(parseMoneyToCents(input)).toBeNull();
  });
});

describe("date validation", () => {
  it("rejects calendar dates that JavaScript would normalize", () => {
    expect(
      documentInputSchema.safeParse({
        title: "Document",
        customer: "Customer",
        issueDate: "2026-02-31",
      }).success,
    ).toBe(false);
  });

  it("rejects reversed report ranges", () => {
    expect(
      reportRangeSchema.safeParse({
        from: "2026-08-15",
        to: "2026-08-14",
      }).success,
    ).toBe(false);
  });
});
