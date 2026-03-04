import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal(""));

export const vehicleCreationSchema = z.object({
  vehicle_code: z.string().trim().min(1, "Vehicle code is required"),
  vehicle_reg_no: z.string().trim().min(1, "Vehicle registration number is required"),
  hire_type: z.enum(["OWN", "HIRE"]),
  contractor_id: optionalString,
  supplier_id: optionalString,
  request_id: z.string().min(1, "Request is required"),
  site_id: z.string().min(1, "Site is required"),
  equipment_type_id: z.string().trim().min(1, "Equipment type is required"),
  equipment_model_id: z.string().trim().min(1, "Equipment model is required"),
  permit_expiry: z.string().min(1, "Permit expiry is required"),
  fc_expiry: z.string().min(1, "FC expiry is required"),
  insurance_expiry: z.string().min(1, "Insurance expiry is required"),
  road_tax_expiry: z.string().min(1, "Road tax expiry is required"),
  rental_basis: z.enum(["HOUR", "DAY", "KM"]),
  target_hours: optionalString,
  plant_entry_date: optionalString,
  rc_invoice_date: optionalString,
  is_active: z.boolean(),
});

export type VehicleCreationFormValues = z.infer<typeof vehicleCreationSchema>;
