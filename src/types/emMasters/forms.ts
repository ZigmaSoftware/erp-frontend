export type ContractorDetail = {
  contractor_name?: string;
  contact_person?: string;
  mobile_no?: string;
  email?: string;
  gst_type?: string;
  gst_no?: string;
  pan_no?: string;
  opening_balance?: string | number;
  address?: string;
  bank_details?: string;
  is_active?: boolean | string | number | null;
};

export type ContractorSubmitPayload = {
  contractor_name: string;
  contact_person: string;
  mobile_no: string;
  email?: string;
  gst_type: "yes" | "no";
  gst_no: string | null;
  pan_no: string | null;
  opening_balance: string;
  address: string;
  bank_details: string | null;
  is_active: boolean;
};

export type EquipmentModelDetail = {
  equipment_type?:
    | string
    | number
    | {
        unique_id?: string | number;
        id?: string | number;
      }
    | null
    | undefined;
  manufacturer?: string;
  model_name?: string;
  description?: string;
  is_active?: boolean | string | number | null;
};

export type EquipmentModelSubmitPayload = {
  equipment_type: string;
  manufacturer: string;
  model_name: string;
  description?: string;
  is_active: boolean;
};

export type RawEquipmentTypeLookupRecord = {
  unique_id?: string | number;
  id?: string | number;
  name?: string;
  equipment_type_name?: string;
  is_active?: boolean | string | number | null;
  status?: boolean | string | number | null;
};

export type EquipmentTypeLookupOption = {
  unique_id: string;
  name: string;
  is_active: boolean;
};

export type VehicleSupplierDetail = {
  supplier_name?: string;
  proprietor_name?: string;
  mobile_no?: string;
  email?: string;
  gst_type?: string;
  gst_no?: string;
  pan_no?: string;
  transport_medium?: string;
  address?: string;
  bank_details?: string;
  image?: string;
  is_active?: boolean | string | number | null;
};

export type VehicleSupplierSubmitPayload = {
  supplier_name: string;
  proprietor_name: string;
  mobile_no: string;
  email?: string;
  gst_type: "yes" | "no";
  gst_no?: string;
  pan_no?: string;
  transport_medium?: string;
  address: string;
  bank_details?: string;
  is_active: boolean;
};

export type VehicleRequestDetail = {
  description?: string;
  site?: string | number | Record<string, unknown> | null;
  site_id?: string | number;
  status?: string;
  request_status?: string;
  staff?: string | number | Record<string, unknown> | null;
  staff_id?: string | number;
  items?: unknown[];
  request_items?: unknown[];
  items_data?: unknown[];
};

export type EmFormSelectOption = {
  value: string;
  label: string;
};

export type VehicleCreationSelectOption = EmFormSelectOption;

export type VehicleCreationEquipmentModelOption = EmFormSelectOption & {
  equipmentTypeId: string;
};

export type VehicleCreationLookupState = {
  contractors: VehicleCreationSelectOption[];
  suppliers: VehicleCreationSelectOption[];
  requests: VehicleCreationSelectOption[];
  sites: VehicleCreationSelectOption[];
  equipmentTypes: VehicleCreationSelectOption[];
  equipmentModels: VehicleCreationEquipmentModelOption[];
};

export type VehicleCreationRelationMaps = {
  typeAliasToCanonical: Record<string, string>;
  modelAliasToCanonical: Record<string, string>;
  modelToTypeCanonical: Record<string, string>;
};
