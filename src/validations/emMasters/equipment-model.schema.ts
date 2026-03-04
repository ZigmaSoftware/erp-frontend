import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal(""));

export const equipmentModelSchema = z.object({
  equipment_type: z.string().min(1, "Equipment type is required"),
  manufacturer: z.string().trim().min(1, "Manufacturer is required"),
  model_name: z.string().trim().min(1, "Model name is required"),
  description: optionalString,
  is_active: z.boolean(),
});

export type EquipmentModelFormValues = z.infer<typeof equipmentModelSchema>;
