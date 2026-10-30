import { z } from "zod";

export const NotificationPreferencesSchema = z
  .object({
    lowBalanceAlerts: z.boolean().default(true),
    nearCapAlerts: z.boolean().default(true),
    assistantTips: z.boolean().default(true),
  })
  .strict();

export const ProfileSettingsSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[A-Za-z0-9 '\-.,() ]+$/, {
        message: "Give a name up to 40 characters.",
      })
      .optional(),
    contactEmail: z.string().trim().toLowerCase().email().max(254).optional(),
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^[+0-9\s\-()]+$/)
      .optional()
      .nullable(),
    notifications: NotificationPreferencesSchema.optional(),
  })
  .strict()
  .refine((data: object) => Object.keys(data).length > 0, {
    message: "Change one setting to save.",
  });

export type NotificationPreferencesInput = z.infer<
  typeof NotificationPreferencesSchema
>;
export type ProfileSettingsInput = z.infer<typeof ProfileSettingsSchema>;
