import { z } from "zod";

export const AlertThresholdsSchema = z
  .object({
    lowBalanceCents: z
      .number()
      .int("Pick a low-balance warning between $5 and $500.")
      .min(500, "Pick a low-balance warning between $5 and $500.")
      .max(50000, "Pick a low-balance warning between $5 and $500.")
      .default(2000),
    nearCapPercent: z
      .number()
      .int("Choose a warning between 50 and 95 percent.")
      .min(50, "Choose a warning between 50 and 95 percent.")
      .max(95, "Choose a warning between 50 and 95 percent.")
      .default(80),
  })
  .strict();

export const AlertPreferencesSchema = z
  .object({
    lowBalanceAlerts: z.boolean().default(true),
    nearCapAlerts: z.boolean().default(true),
    assistantTips: z.boolean().default(true),
  })
  .strict();

export const AcknowledgeAlertSchema = z
  .object({
    alertId: z.string().trim().uuid("That warning was not found."),
    cardId: z.string().trim().uuid("That card was not found."),
    confirmed: z.literal(true, {
      message: "Confirm you saw this warning.",
    }),
  })
  .strict();

export type AlertThresholdsInput = z.infer<typeof AlertThresholdsSchema>;
export type AlertPreferencesInput = z.infer<typeof AlertPreferencesSchema>;
export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertSchema>;
