import type { SelectOption } from "@/types/forms";

export * from "./keys";

export type ContinentRecord = {
  unique_id: string | number;
  name: string;
  is_active: boolean;
};

export type CountryRecord = {
  unique_id: string | number;
  name: string;
  continent_id?: string | number | null;
  continent?: string | number | null;
  continent_name?: string;
  is_active: boolean;
  mob_code?: string;
  currency?: string;
};

export type NormalizedCountry = {
  id: string;
  name: string;
  continentId: string | null;
  isActive: boolean;
};

export const normalizeCountryData = (
  countries: CountryRecord[]
): NormalizedCountry[] =>
  countries.map((country) => {
    const rawContinentId = country.continent_id ?? country.continent;
    const continentId =
      rawContinentId &&
      typeof rawContinentId === "object" &&
      ("unique_id" in rawContinentId || "id" in rawContinentId)
        ? String(
            (rawContinentId as { unique_id?: string | number; id?: string | number })
              .unique_id ??
              (rawContinentId as { unique_id?: string | number; id?: string | number })
                .id
          )
        : rawContinentId == null
          ? null
          : String(rawContinentId);

    return {
      id: String(country.unique_id),
      name: country.name,
      continentId,
      isActive: country.is_active !== false,
    };
  });

export type StateRecord = {
  unique_id: string | number;
  name: string;
  label: string;
  is_active: boolean;
  continent_id?: string | number | null;
  country_id?: string | number | null;
  continent_name?: string;
  country_name?: string;
};

export type DistrictRecord = {
  unique_id: string | number;
  name: string;
  is_active: boolean;
  continent_id?: string | number | null;
  country_id?: string | number | null;
  state_id?: string | number | null;
  country_name?: string;
  state_name?: string;
};

export type CityRecord = {
  unique_id: string | number;
  name: string;
  is_active: boolean;
  continent_id?: string | number | null;
  continent?: string | number | null;
  country_id?: string | number | null;
  country?: string | number | null;
  state_id?: string | number | null;
  state?: string | number | null;
  district_id?: string | number | null;
  district?: string | number | null;
  continent_name?: string;
  country_name?: string;
  state_name?: string;
  district_name?: string;
};

type MasterSelectOption<Value = string> = SelectOption<Value> & {
  isActive: boolean;
};

export type CountrySelectOption = MasterSelectOption<string> & {
  continentId: string | null;
};

export type StateSelectOption = MasterSelectOption<string> & {
  countryId: string | null;
  continentId: string | null;
};

export type DistrictSelectOption = MasterSelectOption<string> & {
  stateId: string | null;
  countryId: string | null;
  continentId: string | null;
};

export type CitySelectOption = MasterSelectOption<string> & {
  districtId: string | null;
  stateId: string | null;
  countryId: string | null;
  continentId: string | null;
};

export type SiteRecord = {
  unique_id: string | number;
  site_name?: string;
  is_active: boolean;
  state_id?: string | number | null;
  district_id?: string | number | null;
  state_name?: string;
  district_name?: string;
  ulb?: string;
  state?: string;
  district?: string;
  status?: string;
  site_address?: string;
  latitude?: string | number;
  longitude?: string | number;
  project_value?: string | number;
  project_type_details?: string;
  basic_payment_per_m3?: string | number;
  dc_invoice_no?: string;
  min_max_type?: string;
  screen_name?: string;
  weighbridge_count?: string | number;
  eb_rate?: string | number;
  unit_per_cost?: string | number;
  kwh?: string | number;
  demand_cost?: string | number;
  eb_start_date?: string;
  eb_end_date?: string;
  no_of_zones?: string | number;
  no_of_phases?: string | number;
  density_volume?: string | number;
  extended_quantity?: string | number;
  service_charge?: string | number;
  transportation_cost?: string | number;
  gst?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_address?: string;
  erection_start_date?: string;
  commissioning_start_date?: string;
  project_completion_date?: string;
  weighment_folder_name?: string;
  petty_cash?: string | number;
  proposed_change?: string;
  remarks?: string;
  verification_document?: string;
  document_view?: string;
};

export type SiteSelectOption = MasterSelectOption<string> & {
  stateId: string | null;
  districtId: string | null;
};

export type PlantRecord = {
  unique_id: string | number;
  plant_name?: string;
  site_name?: string;
  site_id?: string | number | null;
  is_active: boolean;
};

export type PlantSelectOption = MasterSelectOption<string> & {
  siteId: string | null;
};

export type EquipmentTypeRecord = {
  unique_id: string | number;
  name?: string;
  equipment_type_name?: string;
  description?: string;
  category?: string;
  image?: string;
  image_url?: string;
  is_active?: boolean;
};

export type EquipmentTypeSelectOption = SelectOption<string> & {
  isActive: boolean;
};

export type MachineryHireRecord = {
  unique_id: string | number;
  site_id?: string | number | null;
  site_name?: string;
  equipment_type_id?: string | number | null;
  equipment_type_name?: string;
  equipment_model_id?: string | number | null;
  equipment_model_name?: string;
  vehicle_id?: string | number | null;
  vehicle_code?: string;
  date?: string;
  diesel_status?: string;
  hire_rate?: string | number;
  unit?: string;
  is_active?: boolean | string | number | null;
  is_deleted?: boolean | string | number | null;
};

export type ContractorRecord = {
  unique_id: string | number;
  id?: string | number;
  contractor_name?: string;
  contact_person?: string;
  mobile_no?: string;
  gst_type?: string;
  gst_no?: string;
  pan_no?: string;
  is_active?: boolean | string | number | null;
};

export type ContractorSelectOption = MasterSelectOption<string>;

export type EquipmentModelRecord = {
  unique_id: string | number;
  id?: string | number;
  equipment_type_id?: string | number | null;
  equipment_type_name?: string;
  manufacturer?: string;
  model_name?: string;
  description?: string;
  is_active?: boolean | string | number | null;
};

export type EquipmentModelSelectOption = MasterSelectOption<string>;

export type VehicleSupplierRecord = {
  unique_id: string | number;
  id?: string | number;
  supplier_name?: string;
  proprietor_name?: string;
  mobile_no?: string;
  gst_type?: string;
  transport_medium?: string;
  image?: string;
  is_active?: boolean | string | number | null;
};

export type VehicleSupplierSelectOption = MasterSelectOption<string>;

export type VehicleCreationRecord = {
  unique_id: string | number;
  id?: string | number;
  vehicle_code?: string;
  vehicle_reg_no?: string;
  hire_type?: string;
  rental_basis?: string;
  request_no?: string;
  site_name?: string;
  equipment_type_name?: string;
  equipment_model_name?: string;
  contractor_name?: string;
  supplier_name?: string;
  is_active?: boolean | string | number | null;
};

export type VehicleCreationSelectOption = MasterSelectOption<string>;

export type VehicleRequestRecord = {
  unique_id: string | number;
  id?: string | number;
  description?: string;
  request_status?: string;
  site_id?: string | number | null;
  site?: string | number | null;
  staff_id?: string | number | null;
  staff?: string | number | null;
  items?: unknown[];
  created_at?: string;
};

export type VehicleRequestSelectOption = MasterSelectOption<string>;
