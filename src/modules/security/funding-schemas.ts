import { z } from "zod";

export const AddMoneySchema = z
  .object({
    amountCents: z
      .number()
      .int()
      .min(500, { message: "Add between $5 and $2,000." })
      .max(200000, { message: "Add between $5 and $2,000." }),
    currency: z.literal("USD").default("USD"),
    testMode: z.literal(true, { message: "Demo runs in test mode only." }),
    memo: z
      .string()
      .trim()
      .max(100)
      .regex(/^[A-Za-z0-9 .,!?'"()\-_]*$/, {
        message: "Memo contains unsupported characters.",
      })
      .optional()
      .nullable(),
  })
  .strict("Test mode does not use real payments.");

export type AddMoneyInput = z.infer<typeof AddMoneySchema>;
