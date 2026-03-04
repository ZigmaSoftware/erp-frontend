import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));
const numericString = z.string().optional().or(z.literal(""));

export const siteSchema = z.object({
  site_name: z.string().min(2, "Site name must be at least 2 characters"),
  state_id: z.string().min(1, "State is required"),
  district_id: z.string().min(1, "District is required"),
  ulb: optionalString,
  status: z.enum(["Active", "Inactive"]).optional().or(z.literal("")),
  site_address: optionalString,
  latitude: numericString,
  longitude: numericString,
  project_value: numericString,
  project_type_details: optionalString,
  basic_payment_per_m3: numericString,
  dc_invoice_no: optionalString,
  min_max_type: optionalString,
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
  extended_quantity: numericString,
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

export type SiteFormValues = z.infer<typeof siteSchema>;
