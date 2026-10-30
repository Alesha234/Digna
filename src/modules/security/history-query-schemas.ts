import { z } from "zod";

const safeSearchPattern = /^[A-Za-z0-9\s\-_.,@'#:;()]*$/;

export const HistoryQuerySchema = z
  .object({
    cardId: z.string().trim().uuid("That card was not found."),
    result: z.enum(["all", "charge", "decline"]).default("all"),
    search: z
      .string()
      .trim()
      .max(80)
      .regex(safeSearchPattern)
      .optional()
      .default(""),
    dateFrom: z
      .string()
      .refine((val: string): boolean => !Number.isNaN(Date.parse(val)), {
        message: "Pick a valid date.",
      })
      .nullable()
      .optional(),
    dateTo: z
      .string()
      .refine((val: string): boolean => !Number.isNaN(Date.parse(val)), {
        message: "Pick a valid date.",
      })
      .nullable()
      .optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(5).max(50).default(20),
  })
  .strict()
  .refine(
    (data: { dateFrom?: string | null; dateTo?: string | null }): boolean => {
      if (!data.dateFrom || !data.dateTo) return true;
      return new Date(data.dateTo).getTime() >= new Date(data.dateFrom).getTime();
    },
    {
      message: "Pick an end date after the start date.",
      path: ["dateTo"],
    }
  );

export type HistoryQueryInput = z.infer<typeof HistoryQuerySchema>;
