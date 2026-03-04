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
