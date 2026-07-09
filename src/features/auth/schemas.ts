import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address.").max(200),
  password: z.string().min(1, "Password is required.").max(72),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Please enter your full name.").max(100),
  email: z.string().email("Enter a valid email address.").max(200),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address.").max(200),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters.").max(72),
    confirm: z.string().min(8, "Please confirm your password.").max(72),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
