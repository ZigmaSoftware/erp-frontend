export interface BaseEntity {
  unique_id: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

/* ===========================================================
   SCRAP SALES CATEGORY MASTER
=========================================================== */
export interface ScrapSalesCategory extends BaseEntity {
  category_name: string;
  hsn_code: string;
  tax: number | string;
  description?: string | null;
}

/* ===========================================================
   ITEM TYPE MASTER
=========================================================== */
export interface ItemType extends BaseEntity {
  item_type: string;
}

/* ===========================================================
   SUB CATEGORY MASTER
=========================================================== */
export interface SubCategory extends BaseEntity {
  item_type: string;
  item_type_name?: string;
  sub_category_name: string;
}

/* ===========================================================
   TARGET ENTRY MASTER
=========================================================== */
export interface TargetEntryItem extends BaseEntity {
  target_entry: string;
  target_no?: string;
  item_type: string;
  item_type_name?: string;
  sub_category?: string | null;
  sub_category_name?: string | null;
  target_qty: number | string;
  expense_amount: number | string;
  revenue_amount: number | string;
  random_no?: string;
  random_sc?: string;
}

export interface TargetEntry extends BaseEntity {
  target_no: string;
  entry_month: string;
  site_id: string;
  site_name?: string;
  tot_target?: number | string;
  tot_expense?: number | string;
  tot_revenue?: number | string;
  random_no?: string;
  random_sc?: string;
  items?: TargetEntryItem[];
}

/* ===========================================================
   CUSTOMER CREATION MASTER
=========================================================== */
export interface CustomerDestination extends BaseEntity {
  customer: string;
  site: string;
  site_name?: string;
  destination: string;
  status: "active" | "inactive";
}

export interface CustomerItemPurpose extends BaseEntity {
  customer: string;
  site: string;
  site_name?: string;
  destination: string;
  item: string;
  item_name?: string;
  disposal_type: "customer_scope" | "zigma_scope" | "transport_scope";
  purpose_application: "land_fill_earth_fill";
  status: "active" | "inactive";
}

export interface CustomerCreation extends BaseEntity {
  entry_date: string;
  customer_type: "creditor" | "debitor";
  customer_name: string;
  contact_person: string;

  phone_no?: string | null;
  mobile_code?: string | null;
  mobile_no: string;
  other_mobile_1?: string | null;
  other_mobile_2?: string | null;
  other_mobile_3?: string | null;
  whatsapp_no?: string | null;

  country_id: string;
  country_name?: string;
  state_id: string;
  state_name?: string;
  district_id: string;
  district_name?: string;
  city_id: string;
  city_name?: string;

  building_no: string;
  street: string;
  area: string;
  pincode: string;
  address?: string;

  lat: string;
  lon: string;

  has_gst: boolean;
  gst_no?: string | null;

  to_email?: string | null;
  cc_mail?: string | null;
  quality_email_id?: string | null;
  quality_cc_mail?: string | null;

  opening_balance: number | string;
  payment_type: "credit" | "debit";

  sites: string[];
  site_names?: string[];
  items: string[];
  item_names?: string[];
  executive_name?: string | null;
  acc_group?: string | null;

  noc_upload: boolean;
  customer_status?: "approved" | "pending";

  bank_name?: string | null;
  branch?: string | null;
  account_no?: string | null;
  ifsc_code?: string | null;
  pan_no?: string | null;

  destinations?: CustomerDestination[];
  item_purposes?: CustomerItemPurpose[];
}

/* ===========================================================
   DOCUMENT TYPE MASTER
=========================================================== */
export interface DocumentType extends BaseEntity {
  doc_type: string;
  description?: string | null;
}

/* ===========================================================
   TRANSPORT ENTRY MASTER
=========================================================== */
export interface TransportEntry extends BaseEntity {
  transport_date: string;
  transport_type: "creditor" | "debitor";
  transport_name: string;
  contact_person: string;
  phone_no?: string | null;
  mobile_no: string;
  other_mobile_1?: string | null;
  other_mobile_2?: string | null;
  other_mobile_3?: string | null;
  whatsapp_no?: string | null;

  country_id: string;
  country_name?: string;
  state_id: string;
  state_name?: string;
  district_id: string;
  district_name?: string;
  city_id: string;
  city_name?: string;

  building_no: string;
  street: string;
  area: string;
  pincode: string;

  has_gst: boolean;
  gst_no?: string | null;

  to_email?: string | null;
  cc_mail?: string | null;

  opening_balance: number | string;
  payment_type: "credit" | "debit";

  sites: string[];
  site_names?: string[];

  target_limit: number | string;

  bank_name?: string | null;
  branch?: string | null;
  account_no?: string | null;
  ifsc_code?: string | null;
  pan_no?: string | null;

  tds: boolean;
  tds_document?: string | null;

  random_no?: string;
  random_sc?: string;
}

/* ===========================================================
   ITEM CREATION
=========================================================== */
export interface ItemCreation extends BaseEntity {
  item_type_id: string;
  item_type_name?: string;
  category_id: string;
  category_name?: string;
  site_id: string;
  site_name?: string;
  item_name: string;
  item_code: string;
  purpose_application?: string | null;
  description?: string | null;
}

/* ===========================================================
   ITEM GROUP CREATION MASTER
=========================================================== */
export interface ItemGroupCreation extends BaseEntity {
  item_type: string;
  item_type_name?: string;
  sub_category_name: string;
  item_name: string;
  item_id?: string | null;
}

/* ===========================================================
   TRANSPORT MEDIUM CREATION MASTER
=========================================================== */
export interface TransportMediumCreation extends BaseEntity {
  vehicle_name: string;
  description?: string | null;
}

/* ===========================================================
   TERMS OF PAYMENT CREATION MASTER
=========================================================== */
export interface TermsOfPaymentCreation extends BaseEntity {
  terms_of_payment: string;
  description?: string | null;
}

/* ===========================================================
   MAIL DETAILS CREATION MASTER
=========================================================== */
export interface MailDetailsCreation extends BaseEntity {
  mail_type: string;
  mail_ids: string;
  site: string;
  site_name?: string;
}
