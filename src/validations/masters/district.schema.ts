import { z } from "zod";

export const districtSchema = z.object({
  name: z
    .string()
    .min(2, "District name must be at least 2 characters")
    .max(50, "Maximum 50 characters allowed"),

  continent_id: z.string().min(1, "Continent is required"),
  country_id: z.string().min(1, "Country is required"),
  state_id: z.string().min(1, "State is required"),

  is_active: z.boolean(),
});

export type DistrictFormValues = z.infer<typeof districtSchema>;
