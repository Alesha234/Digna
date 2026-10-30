import { z } from "zod";

function isValidDueDate(val: string): boolean {
  const match: RegExpExecArray | null = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
  if (!match) return false;
  const year: number = Number(match[1]);
  const month: number = Number(match[2]);
  const day: number = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const dt: Date = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return false;
  const now: Date = new Date();
  const todayUtc: number = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dueUtc: number = dt.getTime();
  if (!(dueUtc > todayUtc)) return false;
  const diffDays: number = (dueUtc - todayUtc) / (1000 * 60 * 60 * 24);
  if (diffDays > 730) return false;
  return true;
}

export const BillExtractionSchema = z
  .object({
    storeName: z
      .string()
      .trim()
      .min(1, { message: "Check the store name." })
      .max(80, { message: "Check the store name." })
      .regex(/^[A-Za-z0-9 '\-.,()&]+$/, { message: "Check the store name." }),
    amountCents: z
      .number()
      .int({ message: "Check the bill amount between $1 and $5,000." })
      .min(100, { message: "Check the bill amount between $1 and $5,000." })
      .max(500000, { message: "Check the bill amount between $1 and $5,000." }),
    dueDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Check the due date." })
      .refine((val: string): boolean => isValidDueDate(val), {
        message: "Check the due date.",
      }),
    suggestedCapCents: z
      .number()
      .int({ message: "Choose a cap between $1 and $5,000." })
      .min(100, { message: "Choose a cap between $1 and $5,000." })
      .max(500000, { message: "Choose a cap between $1 and $5,000." }),
    currency: z.literal("USD").default("USD"),
    scanId: z.string().trim().uuid().optional().nullable(),
  })
  .strict()
  .refine(
    (data: { amountCents: number; suggestedCapCents: number }): boolean =>
      data.suggestedCapCents >= data.amountCents,
    {
      message: "Cap must cover the bill amount.",
      path: ["suggestedCapCents"],
    }
  );

export const BillExtractionConfirmSchema = z
  .object({
    scanId: z.string().trim().uuid({ message: "That scan was not found." }),
    accepted: z.literal(true, { message: "Confirm to make this card." }),
  })
  .strict();

export type BillExtractionInput = z.infer<typeof BillExtractionSchema>;
export type BillExtractionConfirmInput = z.infer<typeof BillExtractionConfirmSchema>;
