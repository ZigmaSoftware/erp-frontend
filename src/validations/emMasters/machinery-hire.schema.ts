import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal(""));

const hireRateSchema = z
  .string()
  .trim()
  .min(1, "Hire rate is required")
  .refine((value) => {
    const parsed = Number(value);
    return !Number.isNaN(parsed) && parsed > 0;
  }, "Hire rate must be greater than 0");

export const machineryHireSchema = z.object({
  site_id: z.string().min(1, "Site selection is required"),
  equipment_type_id: z.string().min(1, "Equipment type is required"),
  equipment_model_id: z.string().min(1, "Equipment model is required"),
  vehicle_id: z.string().min(1, "Vehicle selection is required"),
  date: z.string().min(1, "Date is required"),
  diesel_status: z.enum(["WITH_DIESEL", "WITHOUT_DIESEL"]),
  hire_rate: hireRateSchema,
  unit: z.enum(["HR", "DAY"]),
  is_active: z.boolean(),
});

export type MachineryHireFormValues = z.infer<typeof machineryHireSchema>;
