import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(12).max(255),
});

export const registerSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(12).max(255),
  role: z.enum(["admin", "tecnico"])
});
