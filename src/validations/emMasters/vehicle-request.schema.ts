import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal(""));
const STATUS_OPTIONS = ["draft", "requested", "pending", "approved", "rejected"] as const;

const quantitySchema = z.string().trim().refine((value) => {
  if (!value) return false;
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed > 0;
}, "Item quantity must be greater than 0");

export const vehicleRequestSchema = z.object({
  description: optionalString,
  site_id: z.string().min(1, "Site selection is required"),
  request_status: z.enum(STATUS_OPTIONS),
  items: z
    .array(
      z.object({
        equipment_model_id: z.string().min(1, "Equipment model is required"),
        qty: quantitySchema,
        unit: optionalString,
        purpose: optionalString,
      })
    )
    .min(1, "Add at least one item"),
});

export type VehicleRequestFormValues = z.infer<typeof vehicleRequestSchema>;
