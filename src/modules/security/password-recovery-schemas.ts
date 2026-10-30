import { z } from "zod";

export const PasswordResetRequestSchema = z
  .object({
    email: z
      .string({ message: "Enter your email address." })
      .trim()
      .toLowerCase()
      .min(1, { message: "Enter your email address." })
      .email({ message: "Enter your email address." })
      .max(254, { message: "Enter your email address." }),
  })
  .strict();

export const PasswordResetConfirmSchema = z
  .object({
    token: z
      .string({ message: "Invalid reset link." })
      .trim()
      .min(10, { message: "Invalid reset link." })
      .max(500, { message: "Invalid reset link." }),
    newPassword: z
      .string({ message: "Choose a password with at least 8 characters." })
      .min(8, { message: "Choose a password with at least 8 characters." })
      .max(72, { message: "Choose a password with at least 8 characters." }),
    confirmPassword: z.string({ message: "Passwords need to match." }),
  })
  .strict()
  .refine(
    (data: { newPassword: string; confirmPassword: string }): boolean =>
      data.newPassword === data.confirmPassword,
    {
      message: "Passwords need to match.",
      path: ["confirmPassword"],
    }
  );

export type PasswordResetRequestInput = z.infer<
  typeof PasswordResetRequestSchema
>;

export type PasswordResetConfirmInput = z.infer<
  typeof PasswordResetConfirmSchema
>;
