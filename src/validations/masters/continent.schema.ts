import { z } from "zod";

export const continentSchema = z.object({
  name: z
    .string()
    .min(2, "Continent name must be at least 2 characters")
    .max(50, "Maximum 50 characters allowed"),
  is_active: z.boolean(),
});

export type ContinentFormValues = z.infer<typeof continentSchema>;