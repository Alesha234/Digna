import { z } from "zod";

export const SignupSchema = z
  .object({
    email: z
      .string({
        required_error: "Enter your email address.",
        invalid_type_error: "Enter your email address.",
      })
      .trim()
      .toLowerCase()
      .min(1, "Enter your email address.")
      .email("Please check your email address and try again.")
      .max(254, "That email address is too long."),
    password: z
      .string({
        required_error: "Password needs at least 8 characters.",
        invalid_type_error: "Password needs at least 8 characters.",
      })
      .min(8, "Password needs at least 8 characters.")
      .max(72, "Please use a password with 72 characters or fewer."),
  })
  .strict();

export const SigninSchema = z
  .object({
    email: z
      .string({
        required_error: "Enter your email address.",
        invalid_type_error: "Enter your email address.",
      })
      .trim()
      .toLowerCase()
      .min(1, "Enter your email address.")
      .email("Please check your email address and try again.")
      .max(254, "That email address is too long."),
    password: z
      .string({
        required_error: "Enter your password.",
        invalid_type_error: "Enter your password.",
      })
      .min(1, "Enter your password.")
      .max(72, "Enter your password."),
  })
  .strict();

export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
