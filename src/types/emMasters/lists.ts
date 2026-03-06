export type RawContractorListRecord = {
  id?: string | number;
  unique_id?: string | number;
  contractor_code?: string;
  contractor_name?: string;
  contact_person?: string;
  mobile_no?: string;
  gst_type?: string;
  gst_no?: string | null;
  pan_no?: string | null;
  is_active?: boolean | string | number | null;
};

export type ContractorTableRow = {
  id: string;
  contractor_code: string;
  contractor_name: string;
  contact_person: string;
  mobile_no: string;
  gst_type: "yes" | "no";
  gst_no?: string | null;
  pan_no?: string | null;
  is_active: boolean;
};

export type RawEquipmentTypeRef = {
  name?: string;
};

export type RawEquipmentModelListRecord = {
  unique_id?: string | number;
  id?: string | number;
  equipment_type_name?: string;
  equipment_type?: string | number | RawEquipmentTypeRef | null;
  manufacturer?: string;
  model_name?: string;
  description?: string;
  is_active?: boolean | string | number | null;
};

export type EquipmentModelTableRow = {
  unique_id: string;
  equipment_type: string;
  manufacturer: string;
  model_name: string;
  description: string;
  is_active: boolean;
};

export type RawVehicleSupplierListRecord = {
  unique_id?: string | number;
  id?: string | number;
  supplier_name?: string;
  proprietor_name?: string;
  mobile_no?: string;
  gst_type?: string;
  transport_medium?: string;
  image?: string;
  is_active?: boolean | string | number | null;
};

export type VehicleSupplierTableRow = {
  unique_id: string;
  supplier_name: string;
  proprietor_name: string;
  mobile_no: string;
  gst_type?: string;
  transport_medium?: string;
  image?: string;
  is_active: boolean;
};

export type EquipmentTypeTableRow = {
  unique_id: string;
  name: string;
  description?: string;
  category?: string;
  image?: string;
  is_active: boolean;
};

export type MachineryHireTableRow = {
  id: number;
  unique_id: string;
  site_id: string;
  site_name: string;
  equipment_type_id: string;
  equipment_type_name: string;
  equipment_model_id: string;
  equipment_model_name: string;
  vehicle_id: string;
  vehicle_code: string;
  date: string;
  diesel_status: "WITH_DIESEL" | "WITHOUT_DIESEL" | string;
  hire_rate: string;
  unit: string;
  is_active: boolean;
  is_deleted: boolean;
};

export type VehicleRequestItem = Record<string, unknown>;

export type VehicleRequestTableRow = {
  unique_id: string;
  description: string;
  site_id: string;
  staff_id: string;
  site_name: string;
  staff_name: string;
  request_status: string;
  items: VehicleRequestItem[];
  created_at?: string;
};

export type VehicleCreationTableRow = {
  unique_id: string;
  vehicle_code: string;
  vehicle_reg_no: string;
  hire_type: string;
  rental_basis: string;
  request_no: string;
  site_name: string;
  equipment_type_name: string;
  equipment_model_name: string;
  contractor_name: string;
  supplier_name: string;
  is_active: boolean;
};
