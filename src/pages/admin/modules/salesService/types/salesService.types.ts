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

/* ===========================================================
   RDF & INERTS PERCENTAGE ENTRY
=========================================================== */
export type RdfInertsItemType = "RDF" | "Inerts";

export interface RdfInertsPercEntrySub extends BaseEntity {
  random_sc?: string;
  random_no?: string;
  ri_perc_entry_no?: string;
  site_name?: string;
  site_id?: string;
  site_display_name?: string;
  perc_date: string;
  perc_item_name: RdfInertsItemType;
  perc_item_percentage: number | string;
  perc_status: boolean;
}

export interface RdfInertsPercEntry extends BaseEntity {
  random_sc?: string;
  random_no?: string;
  ri_perc_entry_no: string;
  site_name: string;
  site_id?: string;
  site_display_name?: string;
  perc_date: string;
  perc_item_name: RdfInertsItemType;
  perc_item_percentage: number | string;
  perc_status: boolean;
  created_by?: string | null;
  items?: RdfInertsPercEntrySub[];
}

/* ===========================================================
   ICW SUPPLIER CREATION
=========================================================== */
export interface IcwSupplierCreation extends BaseEntity {
  supplier_date: string;
  party_type: "creditor" | "debitor";
  supplier_id?: number | string | null;
  supplier_name: string;
  contact_person: string;
  country_id: string;
  country_name?: string;
  state_id: string;
  state_name?: string;
  district_id: string;
  district_name?: string;
  city_id: string;
  city_name?: string;
  phone_no?: string | null;
  mobile_no: string;
  other_mobile_1?: string | null;
  other_mobile_2?: string | null;
  other_mobile_3?: string | null;
  whatsapp_no?: string | null;
  building_no: string;
  street: string;
  area: string;
  pincode: string;
  latitude: string;
  longitude: string;
  address?: string | null;
  has_gst: boolean;
  gst_no?: string | null;
  to_email?: string | null;
  cc_mail?: string | null;
  quality_to_email?: string | null;
  quality_cc_mail?: string | null;
  opening_balance: number | string;
  payment_type: "credit" | "debit";
  sites: string[];
  site_names?: string[];
  item_name: string;
  executive: string;
  ac_group?: string | null;
  noc_upload_status: boolean;
  bank_name?: string | null;
  branch?: string | null;
  account_no?: string | null;
  ifsc_code?: string | null;
  pan_no?: string | null;
  random_no?: string;
  random_sc?: string;
}

/* ===========================================================
   PHASE 3 – DAY PRODUCT MODULES
   =========================================================== */

export interface AggregateQuotationSub extends BaseEntity {
  main: string;
  item_id: string;
  item_name?: string;
  unit_id?: string;
  rate: number | string;
  amount: number | string;
}

export interface AggregateQuotation extends BaseEntity {
  quote_entry_no: string;
  party_name: string;
  party_mobile_no: string;
  site_id: string;
  site_name?: string;
  quote_month: string;
  sub_items?: AggregateQuotationSub[];
}

export interface ScrapQuotationSub extends BaseEntity {
  main: string;
  item_id: string;
  item_name?: string;
  unit_id?: string;
  rate: number | string;
  amount: number | string;
  gst_value: number | string;
  tot_amount: number | string;
}

export interface ScrapQuotation extends BaseEntity {
  quote_entry_no: string;
  party_name: string;
  party_mobile_no: string;
  site_id: string;
  site_name?: string;
  quote_month: string;
  sub_items?: ScrapQuotationSub[];
}

export interface NocDocumentApprovalHistory extends BaseEntity {
  noc_document: string;
  approve_date: string;
  approve_status: string;
  approve_staff_id: string;
}

export interface NocDocument extends BaseEntity {
  scrap_customer_id: string;
  site_id: string;
  noc_doc_type_id: string;
  dispose_type: string;
  customer_destination: string;
  document_name: string;
  document_file?: string | null;
  approve_status: "Pending" | "Approve" | "Reject" | "Cancel";
  approve_staff_id: string;
  approve_date?: string | null;
  reason?: string;
  overall_approve_status: "Pending" | "Approve";
  approval_history?: NocDocumentApprovalHistory[];
}

export interface DailyTargetDisposalSub extends BaseEntity {
  main: string;
  dte_customer_name: string;
  dte_customer_order: string;
  dte_item_name: string;
  dte_item_type: string;
  dte_item_id?: string | null;
  dte_customer_order_qty: number | string;
  dte_order_qty: number | string;
  dte_trans_name?: string | null;
  dte_trans_order_no: string;
}

export interface DailyTargetDisposal extends BaseEntity {
  entry_no: string;
  site_id: string;
  site_name?: string;
  entry_date: string;
  sub_items?: DailyTargetDisposalSub[];
}

/* ===========================================================
   AGGREGATE ENTRY (legacy scrap_entry / scrap_entry_sub)
   site_name / plant_name / item_name store Master Service IDs;
   the client resolves the display names.
=========================================================== */
export interface AggregateEntrySub extends BaseEntity {
  random_no?: string;
  random_sc?: string;
  scrap_no?: string;
  entry_date?: string;
  site_name?: string;
  plant_name?: string;
  item_name: string;
  stock: number | string;
  receipt: number | string;
  remarks?: string;
}

export interface AggregateEntry extends BaseEntity {
  random_no?: string;
  random_sc?: string;
  scrap_no: string;
  entry_date: string;
  site_name: string;
  plant_name?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  sub_items?: AggregateEntrySub[];
}

export interface AfrTransportRfq extends BaseEntity {
  request_quotation_transportation: string;
  source: string;
  destination: string;
  load_type: "per_ton" | "per_trip" | "fixed";
  due_date: string;
  site_id?: string | null;
  site_name?: string;
  email_mode: 1 | 2;
  toemail: string;
  bcc: string;
  status: boolean;
}

/* ===========================================================
   PHASE 4 – TRANSACTION MODULES
   =========================================================== */

export interface WorkOrderSub extends BaseEntity {
  work_order: string;
  suppliername?: string;
  site_id?: string;
  workorderno?: string;
  entry_date?: string;
  work_type?: string;
  description_one: string;
  itemname: string;
  qty: number | string;
  unit_id?: string;
  rate: number | string;
  amount: number | string;
  tax_per: number | string;
  tot_tax_amnt: number | string;
  plant_name?: string;
  budget_no?: string;
  type?: string;
  wo_vp_app_qty: number | string;
}

export interface WorkOrder extends BaseEntity {
  workorderno: string;
  suppliername: string;
  site_id: string;
  site_name?: string;
  plant_name?: string;
  department_name?: string;
  description?: string;
  entry_date: string;
  work_type?: string;
  tot_amount: number | string;
  net_amt: number | string;
  tot_qty: number | string;
  payment_terms?: string;
  comp_period?: string;
  tds: number | string;
  package_forward: number | string;
  transport_cost: number | string;
  freight_charge: number | string;
  budget_no?: string;
  work_order_dtc_appr_status: string;
  work_order_appr_status: string;
  work_order_dt_appr_status: string;
  send_status: string;
  work_status: string;
  paid_status: string;
  sub_items?: WorkOrderSub[];
}

export interface SalesOrderTransport extends BaseEntity {
  sales_order: string;
  transport_name: string;
  transport_order_no: string;
  transport_qty: number | string;
}

export interface SalesOrder extends BaseEntity {
  work_no: string;
  customer_name: string;
  customer_name_display?: string;
  site_id: string;
  site_name?: string;
  entry_date: string;
  order_date: string;
  order_type: string;
  order_no: string;
  approve_status: string;
  tot_qty: number | string;
  tot_rate: number | string;
  tot_amount: number | string;
  net_amount: number | string;
  description?: string;
  transports?: SalesOrderTransport[];
}

export interface Freight extends BaseEntity {
  freight_no: string;
  source: string;
  source_name?: string;
  destination: string;
  date: string;
  load_type: string;
  item_type: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
  transport_name: string;
  transport_order_no: string;
  freight_status: string;
  due_date?: string;
}

export interface DcEntry extends BaseEntity {
  dc_no: string;
  dc_date: string;
  entry_date: string;
  customer_name: string;
  customer_name_display?: string;
  site_id: string;
  site_name?: string;
  invoice_no: string;
  work_order_no: string;
  dc_type: string;
  description?: string;
  status: string;
  tot_qty: number | string;
  tot_amount: number | string;
}

export interface InvoiceSub extends BaseEntity {
  invoice: string;
  item_name: string;
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
  tax_per: number | string;
  tax_amount: number | string;
}

export interface Invoice extends BaseEntity {
  invoice_no: string;
  invoice_date: string;
  entry_date: string;
  customer_name: string;
  customer_name_display?: string;
  site_id: string;
  site_name?: string;
  dc_no: string;
  work_order_no: string;
  invoice_type: string;
  description?: string;
  tot_amount: number | string;
  tax_amount: number | string;
  net_amount: number | string;
  status: string;
  sub_items?: InvoiceSub[];
}

export interface PayableSub extends BaseEntity {
  payable_entry: string;
  item_name: string;
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
  tax_per: number | string;
  tax_amount: number | string;
}

export interface Payable extends BaseEntity {
  payable_no: string;
  entry_date: string;
  supplier_name: string;
  supplier_name_display?: string;
  site_id: string;
  site_name?: string;
  work_order_no: string;
  description?: string;
  tot_amount: number | string;
  tax_amount: number | string;
  net_amount: number | string;
  appr_status: string;
  sub_items?: PayableSub[];
}

export interface ReceivableSub extends BaseEntity {
  receivable_entry: string;
  item_name: string;
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
}

export interface Receivable extends BaseEntity {
  receivable_no: string;
  entry_date: string;
  customer_name: string;
  customer_name_display?: string;
  site_id: string;
  site_name?: string;
  invoice_no: string;
  description?: string;
  tot_amount: number | string;
  net_amount: number | string;
  appr_status: string;
  sub_items?: ReceivableSub[];
}

/* ===========================================================
   PHASE 5 – APPROVAL MODULES
   =========================================================== */

export interface ApprovalHistory extends BaseEntity {
  entity_type: string;
  entity_id: string;
  action: string;
  from_status: string;
  to_status: string;
  remarks?: string;
  approver_id: string;
  approver_name: string;
  site_id?: string | null;
}

/* ===========================================================
   PHASE A – ADDITIONAL MODULES
   =========================================================== */

export interface IcwWorkOrderTransport extends BaseEntity {
  work_order: string;
  transport_name: string;
  transport_order_no: string;
  transport_qty: number | string;
}

export interface IcwWorkOrder extends BaseEntity {
  invoice_no: string;
  entry_date: string;
  customer_name: string;
  item_name: string;
  target: number | string;
  start_date: string;
  end_date: string;
  per_ton_cost: number | string;
  gst_type: string;
  site_id: string;
  work_no: string;
  work_order_status: string;
  approve_status: string;
  description?: string;
  transports?: IcwWorkOrderTransport[];
}

export interface NegativeInvoiceSub extends BaseEntity {
  main: string;
  item_name: string;
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
  tax_per: number | string;
  tax_amount: number | string;
}

export interface NegativeInvoice extends BaseEntity {
  invoice_no: string;
  dc_no: string;
  entry_date: string;
  customer_name: string;
  site_id: string;
  work_order_no: string;
  invoice_type: string;
  description?: string;
  tot_amount: number | string;
  tax_amount: number | string;
  net_amount: number | string;
  status: string;
  sub_items?: NegativeInvoiceSub[];
}

export interface FreightLetter extends BaseEntity {
  dc_entry_id: string;
  freight_entry_id: string;
  letter_no: string;
  entry_date: string;
  customer_name: string;
  site_id: string;
  transport_name: string;
  driver_name: string;
  driver_contact_no: string;
  vehicle_no: string;
  document_file?: string | null;
  status: string;
}

export interface CoProcessingCertificate extends BaseEntity {
  cpcr_no: string;
  cpc_no: string;
  cpc_month: string;
  entry_date: string;
  customer_name: string;
  site_id: string;
  prev_diff: number | string;
  total_disp_qty: number | string;
  total_received_qty: number | string;
  diff: number | string;
  remarks?: string;
  certificate_upload?: string | null;
}

export interface AggregateComparisonSub extends BaseEntity {
  comparison: string;
  quote_entry_no: string;
  material_id?: string | null;
  customer_name: string;
  quote_amount: number | string;
  quote_check_list: boolean;
  remarks?: string;
}

export interface AggregateComparison extends BaseEntity {
  quote_entry_no: string;
  quote_month: string;
  site_id: string;
  comp_description: string;
  status: string;
  status_by: string;
  sub_items?: AggregateComparisonSub[];
}

export interface ScrapQuotationComparisonSub extends BaseEntity {
  main: string;
  site_id?: string | null;
  quote_entry_no: string;
  material_id?: string | null;
  customer_name: string;
  quote_amount: number | string;
  quote_check_list: boolean;
  remarks?: string;
}

export interface ScrapQuotationComparison extends BaseEntity {
  quote_month: string;
  site_id: string;
  comp_description: string;
  status: string;
  status_by: string;
  sub_items?: ScrapQuotationComparisonSub[];
}

export interface ConfirmationReceiptImage extends BaseEntity {
  cor: string;
  image_name: string;
  image_file: string;
  entry_date: string;
  entry_user: string;
}

export interface ConfirmationReceipt extends BaseEntity {
  serial_number: string;
  month_year: string;
  site_id: string;
  scrap_customer_id: string;
  total_value: number | string;
  entry_date: string;
  approve_status: string;
  approve_user: string;
  approve_date?: string | null;
  images?: ConfirmationReceiptImage[];
}
