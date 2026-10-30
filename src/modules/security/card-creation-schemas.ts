import { z } from "zod";

const NAME_MESSAGE = "Name your card, like Google Cloud.";
const CAP_MESSAGE = "Choose a cap between $1 and $5,000.";
const DATE_MESSAGE = "Pick an end date in the future, within 2 years.";

function parseIsoDateUtc(value: string): Date | null {
  const parts: string[] = value.split("-");
  if (parts.length !== 3) return null;
  const year: number = Number(parts[0]);
  const month: number = Number(parts[1]);
  const day: number = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const date: Date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function startOfTodayUtc(): Date {
  const now: Date = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export const CardCreationSchema = z
  .object({
    name: z
      .string({ required_error: NAME_MESSAGE, invalid_type_error: NAME_MESSAGE })
      .trim()
      .min(1, NAME_MESSAGE)
      .max(60, NAME_MESSAGE)
      .regex(/^[A-Za-z0-9 '\-.,()&]+$/, NAME_MESSAGE),
    spendingCapCents: z
      .number({ required_error: CAP_MESSAGE, invalid_type_error: CAP_MESSAGE })
      .int(CAP_MESSAGE)
      .min(100, CAP_MESSAGE)
      .max(500000, CAP_MESSAGE),
    endDate: z
      .string({ required_error: DATE_MESSAGE, invalid_type_error: DATE_MESSAGE })
      .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_MESSAGE)
      .refine((val: string): boolean => {
        return parseIsoDateUtc(val) !== null;
      }, DATE_MESSAGE)
      .refine((val: string): boolean => {
        const parsed: Date | null = parseIsoDateUtc(val);
        if (parsed === null) return false;
        return parsed.getTime() > startOfTodayUtc().getTime();
      }, DATE_MESSAGE)
      .refine((val: string): boolean => {
        const parsed: Date | null = parseIsoDateUtc(val);
        if (parsed === null) return false;
        const maxTime: number = startOfTodayUtc().getTime() + 730 * 24 * 60 * 60 * 1000;
        return parsed.getTime() <= maxTime;
      }, DATE_MESSAGE),
    currency: z.literal("USD").default("USD"),
  })
  .strict();

export type CardCreationInput = z.infer<typeof CardCreationSchema>;
