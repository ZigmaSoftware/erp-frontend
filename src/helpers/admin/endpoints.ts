/* ========================================================
    API BASE CONFIG
======================================================== */
const API_BASE = "api";

/* Services */
const AUTH_SERVICE = "auth-service";
const MASTER_SERVICE = "master-service";
const SALES_SERVICE = "sales-service";

/* Apps */
const AUTH_APP = "auth";
const MASTER_APP = "masters";
const EM_APP = "em-masters";
const SALES_APP = "sales-masters";
const SALES_SERVICE_APP = "sales-service";

/* Version */

const CURRENT_VERSION = "v1";

/* ========================================================
    SERVICE BASE URL REGISTRY (From .env)
======================================================== */
const SERVICE_BASE_URLS: Record<string, string> = {
  [MASTER_SERVICE]: import.meta.env.VITE_API_MASTERSERVICE,
  [AUTH_SERVICE]: import.meta.env.VITE_API_AUTHSERVICE,
  [SALES_SERVICE]: import.meta.env.VITE_API_SALESSERVICE,
};

/* ========================================================
    SMART URL BUILDER
   - Detects service automatically
   - Attaches correct port
   - Returns FULL URL
======================================================== */
const buildUrl = (path: string): string => {
  const [service] = path.split("/");

  const baseUrl = SERVICE_BASE_URLS[service];

  if (!baseUrl) {
    throw new Error(`Base URL not configured for service: ${service}`);
  }

  return `${baseUrl}${API_BASE}/${path}`;
};

/* ========================================================
    EM MASTER ENDPOINTS
======================================================== */
export const emMastersEndpoints = {
  equipmentTypes: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/equipment-types/`,
  equipmentModels: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/equipment-models/`,
  contractorModels: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/contractor-models/`,
  vehicleSuppliers: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/vehicle-suppliers/`,
  vehicleRequest: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/vehicle-requests/`,
  vehicleCreations: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/vehicle-creations/`,
  machineryHires: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/machinery-hires`,
} as const;

export type EmMasterEntity = keyof typeof emMastersEndpoints;

/* ========================================================
    SALES MASTER ENDPOINTS
======================================================== */
export const salesMasterEndpoints = {
  scrapSalesCategory: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/scrap-sales-categories/`,
  itemType: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/item-types/`,
  itemCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/item-creations/`,
  itemGroupCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/item-group-creations/`,
  transportMediumCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/transport-medium-creations/`,
  termsOfDeliveryCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/terms-of-delivery-creations/`,
  termsOfPaymentCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/terms-of-payment-creations/`,
  mailDetailsCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/mail-details-creations/`,
  documentType: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/document-types/`,
  transportEntry: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/transport-entries/`,
  subCategory: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/sub-categories/`,
  targetEntry: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/target-entries/`,
  targetEntryItem: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/target-entry-items/`,
  customerCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/customer-creations/`,
  customerDestination: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/customer-destinations/`,
  customerItemPurpose: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/customer-item-purposes/`,
  rdfInertsPercEntry: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/rdf-inerts-perc-entries/`,
  icwSupplierCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/${SALES_APP}/icw-supplier-creations/`,
} as const;

export type SalesMasterEntity = keyof typeof salesMasterEndpoints;

/* ========================================================
    SALES SERVICE ENDPOINTS
    (standalone sales_service microservice - parallel copy of
    Sales Masters, kept independent from salesMasterEndpoints)
======================================================== */
export const salesServiceEndpoints = {
  scrapSalesCategory: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/scrap-sales-categories/`,
  itemType: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/item-types/`,
  itemCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/item-creations/`,
  itemGroupCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/item-group-creations/`,
  transportMediumCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/transport-medium-creations/`,
  termsOfDeliveryCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/terms-of-delivery-creations/`,
  termsOfPaymentCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/terms-of-payment-creations/`,
  mailDetailsCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/mail-details-creations/`,
  documentType: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/document-types/`,
  transportEntry: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/transport-entries/`,
  subCategory: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/sub-categories/`,
  targetEntry: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/target-entries/`,
  targetEntryItem: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/target-entry-items/`,
  customerCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/customer-creations/`,
  customerDestination: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/customer-destinations/`,
  customerItemPurpose: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/customer-item-purposes/`,
  rdfInertsPercEntry: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/rdf-inerts-perc-entries/`,
  icwSupplierCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/icw-supplier-creations/`,
} as const;

/* ========================================================
    SALES SERVICE TRANSACTION ENDPOINTS
    (Phase 3+4 transaction modules in sales_service)
======================================================== */
export const salesTransactionEndpoints = {
  aggregateQuotations: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/aggregate-quotations/`,
  scrapQuotations: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/scrap-quotations/`,
  nocDocuments: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/noc-documents/`,
  dailyTargets: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/daily-targets/`,
  afrRfqs: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/afr-rfqs/`,
  workOrders: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/work-orders/`,
  salesOrders: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/sales-orders/`,
  freights: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/freights/`,
  dcEntries: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/dc-entries/`,
  invoices: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/invoices/`,
  payables: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/payables/`,
  receivables: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/receivables/`,
  icwWorkOrders: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/icw-work-orders/`,
  negativeInvoices: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/negative-invoices/`,
  freightLetters: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/freight-letters/`,
  coProcessing: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/co-processing/`,
  aggregateComparisons: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/aggregate-comparisons/`,
  scrapComparisons: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/scrap-comparisons/`,
  confirmationReceipts: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/confirmation-receipts/`,
  approvalHistory: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approval-history/`,
  approvalWorkOrders: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/work-orders/`,
  approvalCustomers: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/customers/`,
  approvalSalesOrders: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/sales-orders/`,
  approvalFreights: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/freights/`,
  approvalInvoices: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/invoices/`,
  approvalPayables: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/payables/`,
  approvalReceivables: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/receivables/`,
  approvalAfrTransports: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/afr-transports/`,
  approvalNocDocuments: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/approvals/noc-documents/`,
} as const;

/* ========================================================
    SALES REPORT ENDPOINTS
======================================================== */
export const salesReportEndpoints = {
  supplyChain: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/supply-chain/`,
  aggregateStock: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/aggregate-stock/`,
  aggregateStockPerDay: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/aggregate-stock-per-day/`,
  graphical: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/graphical/`,
  siteWiseDisposal: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/site-wise-disposal/`,
  siteWiseDisposalComparison: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/site-wise-disposal-comparison/`,
  consolidatedMonthly: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/consolidated-monthly/`,
  payableReceivableTracker: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/payable-receivable-tracker/`,
  customerCreation: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/customer-creation/`,
  confirmationReceipt: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/confirmation-receipt/`,
  workOrderStatus: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/work-order-status/`,
  mbs: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/mbs/`,
  rdfTracker: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/rdf-tracker/`,
  icwDetails: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/icw-details/`,
  othersAggregateComparison: `${SALES_SERVICE}/${CURRENT_VERSION}/${SALES_SERVICE_APP}/reports/others-aggregate-comparison/`,
} as const;

export type SalesReportEntity = keyof typeof salesReportEndpoints;

export type SalesTransactionEntity = keyof typeof salesTransactionEndpoints;

export const getSalesTransactionEndpointPath = (
  entity: SalesTransactionEntity
): string => buildUrl(salesTransactionEndpoints[entity]);

export type SalesServiceEntity = keyof typeof salesServiceEndpoints;

/* ========================================================
    COMMON MASTER ENDPOINTS
======================================================== */
export const commonMasterEndpoints = {
  continents: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/continents/`,
  countries: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/countries/`,
  states: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/states/`,
  districts: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/districts/`,
  cities: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/cities/`,
  sites: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/sites/`,
  plants: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/plants/`,
} as const;

export type CommonMasterEntity = keyof typeof commonMasterEndpoints;

/* ========================================================
    ADMIN MASTER ENDPOINTS
======================================================== */
export const adminMasterEndpoints = {
  userTypes: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/user-role/`,
  permissions: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/permissions/`,
  userCreations: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/user-creation/`,
  groupPermissions: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/group-permission/`,
  login: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/login/`,
  generateRefresh:`${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/refresh/`,
} as const;

export type AdminMasterEntity = keyof typeof adminMasterEndpoints;

/* ========================================================
    PUBLIC HELPERS
======================================================== */
export const getCommonMasterEndpointPath = (
  entity: CommonMasterEntity
): string => buildUrl(commonMasterEndpoints[entity]);

export const getAdminMasterEndpointPath = (
  entity: AdminMasterEntity
): string => buildUrl(adminMasterEndpoints[entity]);

export const getEmMasterEndpointPath = (
  entity: EmMasterEntity
): string => buildUrl(emMastersEndpoints[entity]);

export const getSalesMasterEndpointPath = (
  entity: SalesMasterEntity
): string => buildUrl(salesMasterEndpoints[entity]);

export const getSalesServiceEndpointPath = (
  entity: SalesServiceEntity
): string => buildUrl(salesServiceEndpoints[entity]);
