import { z } from "zod";

export const stateSchema = z.object({
  name: z
    .string()
    .min(2, "State name must be at least 2 characters")
    .max(50, "Maximum 50 characters allowed"),

  label: z
    .string()
    .min(2, "State label must be at least 2 characters")
    .max(50, "Maximum 50 characters allowed"),

  continent_id: z.string().min(1, "Continent is required"),
  country_id: z.string().min(1, "Country is required"),

  is_active: z.boolean(),
});

export type StateFormValues = z.infer<typeof stateSchema>;