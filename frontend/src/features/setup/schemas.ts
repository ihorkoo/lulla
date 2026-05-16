import { z } from "zod";

export const BabyProfileSchema = z.object({
  name: z.string().min(1, "required").max(120),
  dob: z.coerce.date().refine((d) => d <= new Date(), "DOB cannot be in the future"),
  gestational_age_weeks: z.coerce.number().int().min(22).max(41),
});

export type BabyProfileInput = z.infer<typeof BabyProfileSchema>;
