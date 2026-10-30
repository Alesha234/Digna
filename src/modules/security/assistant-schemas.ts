import { z } from "zod";

const cardNotFoundMessage = "That card was not found.";
const paymentNotFoundMessage = "That payment was not found.";
const questionMessage = "Ask a question up to 500 characters.";
const safeCharsMessage = "Please use letters, numbers, and ?!'-.,()$ only.";
const safeCharsPattern = /^[A-Za-z0-9\s?!'\-.,()$]*$/;

export const AssistantQuerySchema = z
  .object({
    question: z
      .string({ required_error: questionMessage })
      .trim()
      .min(1, { message: questionMessage })
      .max(500, { message: questionMessage }),
    cardId: z
      .string()
      .trim()
      .uuid({ message: cardNotFoundMessage })
      .optional()
      .nullable()
      .default(null),
    transactionId: z
      .string()
      .trim()
      .uuid({ message: paymentNotFoundMessage })
      .optional()
      .nullable()
      .default(null),
  })
  .strict()
  .refine(
    (val: { question: string }): boolean => val.question.trim().length > 0,
    { message: questionMessage, path: ["question"] }
  );

export const DeclineExplanationSchema = z
  .object({
    transactionId: z
      .string({ required_error: paymentNotFoundMessage })
      .trim()
      .uuid({ message: paymentNotFoundMessage }),
    cardId: z
      .string()
      .trim()
      .uuid({ message: cardNotFoundMessage })
      .optional()
      .nullable()
      .default(null),
    question: z
      .string()
      .trim()
      .max(500, { message: questionMessage })
      .regex(safeCharsPattern, { message: safeCharsMessage })
      .optional()
      .default("Why was this declined?"),
  })
  .strict();

export type AssistantQueryInput = z.infer<typeof AssistantQuerySchema>;
export type DeclineExplanationInput = z.infer<typeof DeclineExplanationSchema>;
