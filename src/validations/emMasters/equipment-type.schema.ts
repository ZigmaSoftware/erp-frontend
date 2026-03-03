import { z } from "zod";

export const equipmentTypeSchema = z.object({
  name: z.string().min(2, "Equipment type name is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional().or(z.literal("")),
  is_active: z.boolean(),
});

export type EquipmentTypeFormValues = z.infer<typeof equipmentTypeSchema>;
