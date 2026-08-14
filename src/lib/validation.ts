import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email address is too long.")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string) {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const documentInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a document title.")
    .max(120, "Title must be 120 characters or fewer."),
  customer: z
    .string()
    .trim()
    .min(1, "Enter a customer name.")
    .max(120, "Customer must be 120 characters or fewer."),
  issueDate: z
    .string()
    .regex(datePattern, "Enter an issue date in YYYY-MM-DD format.")
    .refine(isValidIsoDate, "Enter a valid issue date."),
});

export const lineInputSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "Enter a line description.")
      .max(200, "Description must be 200 characters or fewer."),
    quantity: z
      .number()
      .int("Quantity must be a whole number.")
      .min(1, "Quantity must be at least 1.")
      .max(100_000, "Quantity is too large."),
    unitPriceCents: z
      .number()
      .int("Unit price must be expressed in cents.")
      .min(0, "Unit price cannot be negative.")
      .max(999_999_999, "Unit price is too large."),
    discountType: z.enum(["FIXED", "PERCENT"]).nullable(),
    discountValue: z.number().int().nullable(),
    taxRateBasis: z
      .number()
      .int("Tax rate must be expressed in basis points.")
      .min(0, "Tax rate cannot be negative.")
      .max(10_000, "Tax rate cannot exceed 100%."),
    position: z.number().int().min(0).max(10_000).default(0),
  })
  .superRefine((line, context) => {
    if (line.discountType === null && line.discountValue !== null) {
      context.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Choose a discount type or remove the discount value.",
      });
    }

    if (line.discountType !== null && line.discountValue === null) {
      context.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Enter a discount value.",
      });
    }

    if (line.discountType === "PERCENT" && line.discountValue !== null) {
      if (line.discountValue < 0 || line.discountValue > 10_000) {
        context.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Discount percent must be between 0% and 100%.",
        });
      }
    }

    if (line.discountType === "FIXED" && line.discountValue !== null) {
      if (line.discountValue < 0) {
        context.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Fixed discount cannot be negative.",
        });
      } else if (line.discountValue > line.quantity * line.unitPriceCents) {
        context.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Fixed discount cannot exceed the line subtotal.",
        });
      }
    }
  });

export const reportRangeSchema = z
  .object({
    from: z.string().refine(isValidIsoDate, "Enter a valid start date."),
    to: z.string().refine(isValidIsoDate, "Enter a valid end date."),
  })
  .refine((range) => range.from <= range.to, {
    path: ["to"],
    message: "End date must be on or after the start date.",
  });
