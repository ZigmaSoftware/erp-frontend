import { z } from "zod";

export const plantSchema = z.object({
  plant_name: z.string().min(2, "Plant name is required"),
  site_id: z.string().min(1, "Site is required"),
  is_active: z.boolean(),
});

export type PlantFormValues = z.infer<typeof plantSchema>;
