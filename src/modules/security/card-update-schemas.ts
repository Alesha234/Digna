import { z } from "zod";

const SAFE_NAME_PATTERN = /^[A-Za-z0-9\s'’\-&().,]+$/;

const EndDateSchema = z
  .string()
  .trim()
  .min(1, { message: "Pick a valid future date." })
  .superRefine((val: string, ctx: z.RefinementCtx): void => {
    const parsed: number = Date.parse(val);
    if (Number.isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a valid future date.",
      });
      return;
    }
    const now: number = Date.now();
    if (parsed <= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a valid future date.",
      });
      return;
    }
    const max: number = now + 730 * 24 * 60 * 60 * 1000;
    if (parsed > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be within 2 years.",
      });
    }
  })
  .optional();

export const CardUpdateSchema = z
  .object({
    cardId: z.string().trim().uuid({ message: "That card was not found." }),
    name: z
      .string()
      .trim()
      .min(1, { message: "Give the card a name." })
      .max(60, { message: "Keep the name under 60 characters." })
      .regex(SAFE_NAME_PATTERN, {
        message: "Use letters, numbers, spaces, and basic punctuation only.",
      })
      .optional(),
    spendingCapCents: z
      .number()
      .int({ message: "Choose a cap between $1 and $5,000." })
      .min(100, { message: "Choose a cap between $1 and $5,000." })
      .max(500000, { message: "Choose a cap between $1 and $5,000." })
      .optional(),
    endDate: EndDateSchema,
  })
  .strict()
  .refine(
    (data: { name?: string; spendingCapCents?: number; endDate?: string }): boolean => {
      return (
        data.name !== undefined ||
        data.spendingCapCents !== undefined ||
        data.endDate !== undefined
      );
    },
    { message: "Change a name, cap, or end date to save." }
  );

export type CardUpdateInput = z.infer<typeof CardUpdateSchema>;
