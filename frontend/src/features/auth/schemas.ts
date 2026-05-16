import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Min 10 characters"),
  display_name: z.string().max(120).optional(),
  locale: z.enum(["uk", "en"]).default("uk"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;
