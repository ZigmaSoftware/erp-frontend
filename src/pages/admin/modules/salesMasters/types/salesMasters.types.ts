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
   TERMS OF DELIVERY CREATION MASTER
=========================================================== */
export interface TermsOfDeliveryCreation extends BaseEntity {
  terms_of_delivery: string;
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
