import { z } from "zod";

export const districtSchema = z.object({
  name: z
    .string()
    .min(2, "Country name must be at least 2 characters")
    .max(50, "Maximum 50 characters allowed"),

  mob_code: z
    .string()
    .max(10, "Mobile code too long")
    .optional()
    .or(z.literal("")),

  currency: z
    .string()
    .max(20, "Currency too long")
    .optional()
    .or(z.literal("")),

  continent_id: z.string().min(1, "Continent is required"),
  country_id: z.string().min(1, "Country is required"),
  state_id: z.string().min(1, "State is required"),

  is_active: z.boolean(),
});

export type DistrictFormValues = z.infer<typeof districtSchema>;
