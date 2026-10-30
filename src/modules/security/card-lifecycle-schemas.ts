import { z } from "zod";

const uuidV4Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const safeReasonRegex = /^[A-Za-z0-9\s.,;:'"()\-_!?]*$/;

const cardIdField = z
  .string()
  .trim()
  .regex(uuidV4Regex, { message: "That card was not found." });

export const FreezeCardSchema = z
  .object({
    cardId: cardIdField,
    confirm: z.literal(true, { message: "Confirm to freeze this card." }),
  })
  .strict();

export const UnfreezeCardSchema = z
  .object({
    cardId: cardIdField,
    confirm: z.literal(true, { message: "Confirm to unfreeze this card." }),
  })
  .strict();

export const CloseCardSchema = z
  .object({
    cardId: cardIdField,
    confirm: z.literal(true, { message: "Confirm to close this card." }),
    reason: z
      .string()
      .trim()
      .max(200, { message: "Reason must be 200 characters or fewer." })
      .regex(safeReasonRegex, {
        message: "Reason contains unsupported characters.",
      })
      .optional()
      .nullable(),
  })
  .strict();

export type CardLifecycleInput =
  | z.infer<typeof FreezeCardSchema>
  | z.infer<typeof UnfreezeCardSchema>
  | z.infer<typeof CloseCardSchema>;
