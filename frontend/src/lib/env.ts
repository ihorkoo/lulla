import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  INTERNAL_API_URL: z
    .string()
    .url()
    .default("https://back-production-af3c.up.railway.app"),
  JWT_COOKIE_SECRET: z.string().min(32).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .optional()
    .default("http://localhost:8000"),
});

const isServer = typeof window === "undefined";

const parsedClient = clientSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

const parsedServer = isServer
  ? serverSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      INTERNAL_API_URL: process.env.INTERNAL_API_URL,
      JWT_COOKIE_SECRET: process.env.JWT_COOKIE_SECRET,
    })
  : ({} as z.infer<typeof serverSchema>);

export const env = { ...parsedClient, ...parsedServer };
