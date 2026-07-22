import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const numericString = z.string().optional().or(z.literal(""));
const requiredString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);
const requiredNumericString = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

export const siteSchema = z.object({
  site_name: z.string().min(2, "Site name must be at least 2 characters"),
  state_id: requiredString("State"),
  district_id: requiredString("District"),
  ulb: requiredString("ULB"),
  status: z
    .enum(["Active", "Inactive"])
    .or(z.literal(""))
    .refine((value) => value !== "", "Status is required"),
  site_address: requiredString("Site address"),
  latitude: numericString,
  longitude: numericString,
  project_value: requiredNumericString("Project value"),
  project_type_details: requiredString("Project type details"),
  basic_payment_per_m3: requiredNumericString("Basic payment per m3"),
  dc_invoice_no: requiredString("DC invoice no"),
  min_max_type: requiredString("Min/Max type"),
  screen_name: optionalString,
  weighbridge_count: numericString,
  eb_rate: numericString,
  unit_per_cost: numericString,
  kwh: numericString,
  demand_cost: numericString,
  eb_start_date: optionalString,
  eb_end_date: optionalString,
  no_of_zones: numericString,
  no_of_phases: numericString,
  density_volume: numericString,
  extended_quantity: requiredNumericString("Extended quantity"),
  service_charge: numericString,
  transportation_cost: numericString,
  gst: optionalString,
  bank_name: optionalString,
  account_number: optionalString,
  ifsc_code: optionalString,
  bank_address: optionalString,
  erection_start_date: optionalString,
  commissioning_start_date: optionalString,
  project_completion_date: optionalString,
  weighment_folder_name: optionalString,
  petty_cash: numericString,
  proposed_change: optionalString,
  remarks: optionalString,
});

export type SiteFormValues = z.input<typeof siteSchema>;
