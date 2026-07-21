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
