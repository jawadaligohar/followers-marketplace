import { z } from "zod";
const emailSchema = z.string().trim().toLowerCase().max(254).email("Enter a valid email");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72).refine(value => new TextEncoder().encode(value).length <= 72, "Password must be at most 72 UTF-8 bytes");

export const signupSchema = z.object({
  orderToken: z.string().max(512).optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f\d]{64}$/i),
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
