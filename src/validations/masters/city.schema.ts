import { z } from "zod";

export const citySchema = z.object({
  name: z
    .string()
    .min(2, "City name must be at least 2 characters")
    .max(50, "Maximum 50 characters allowed"),

  continent_id: z.string().min(1, "Continent is required"),
  country_id: z.string().min(1, "Country is required"),
  state_id: z.string().min(1, "State is required"),
  district_id: z.string().min(1, "District is required"),

  is_active: z.boolean(),
});

export type CityFormValues = z.infer<typeof citySchema>;
