import { commonMasterApi, emMasterApi, adminMasterApi, salesMasterApi, salesServiceApi, salesTransactionApi, salesReportApi } from "./registry";

/* -------- Masters -------- */
export const continentApi = commonMasterApi.continents;
export const countryApi = commonMasterApi.countries;
export const stateApi = commonMasterApi.states;
export const districtApi = commonMasterApi.districts;
export const cityApi = commonMasterApi.cities;
export const siteApi = commonMasterApi.sites;
export const plantApi = commonMasterApi.plants;

/* -------- User / Staff -------- */
export const userCreationApi = adminMasterApi.userCreations;
export const userRoleApi = adminMasterApi.userTypes;
export const permissionApi = adminMasterApi.permissions;
export const groupPermissionApi = adminMasterApi.groupPermissions;

/* -------- EM Masters -------- */
export const equipmentTypeApi = emMasterApi.equipmentTypes;
export const equipmentModelApi = emMasterApi.equipmentModels;
export const contractorApi = emMasterApi.contractorModels;
export const vehicleSupplierApi = emMasterApi.vehicleSuppliers;
export const vehicleRequestApi = emMasterApi.vehicleRequest;
export const vehicleCreationApi = emMasterApi.vehicleCreations;
export const machineryHireApi = emMasterApi.machineryHires;

/* -------- Sales Masters -------- */
export const scrapSalesCategoryApi = salesMasterApi.scrapSalesCategory;
export const itemTypeApi = salesMasterApi.itemType;
export const itemCreationApi = salesMasterApi.itemCreation;
export const itemGroupCreationApi = salesMasterApi.itemGroupCreation;
export const transportMediumCreationApi = salesMasterApi.transportMediumCreation;
export const termsOfDeliveryCreationApi = salesMasterApi.termsOfDeliveryCreation;
export const termsOfPaymentCreationApi = salesMasterApi.termsOfPaymentCreation;
export const mailDetailsCreationApi = salesMasterApi.mailDetailsCreation;
export const documentTypeApi = salesMasterApi.documentType;
export const transportEntryApi = salesMasterApi.transportEntry;
export const subCategoryApi = salesMasterApi.subCategory;
export const targetEntryApi = salesMasterApi.targetEntry;
export const targetEntryItemApi = salesMasterApi.targetEntryItem;
export const customerCreationApi = salesMasterApi.customerCreation;
export const customerDestinationApi = salesMasterApi.customerDestination;
export const customerItemPurposeApi = salesMasterApi.customerItemPurpose;
export const rdfInertsPercEntryApi = salesMasterApi.rdfInertsPercEntry;
export const icwSupplierCreationApi = salesMasterApi.icwSupplierCreation;

/* -------- Sales Service (standalone sales_service microservice) -------- */
export const scrapSalesCategoryServiceApi = salesServiceApi.scrapSalesCategory;
export const itemTypeServiceApi = salesServiceApi.itemType;
export const itemCreationServiceApi = salesServiceApi.itemCreation;
export const itemGroupCreationServiceApi = salesServiceApi.itemGroupCreation;
export const transportMediumCreationServiceApi = salesServiceApi.transportMediumCreation;
export const termsOfDeliveryCreationServiceApi = salesServiceApi.termsOfDeliveryCreation;
export const termsOfPaymentCreationServiceApi = salesServiceApi.termsOfPaymentCreation;
export const mailDetailsCreationServiceApi = salesServiceApi.mailDetailsCreation;
export const documentTypeServiceApi = salesServiceApi.documentType;
export const transportEntryServiceApi = salesServiceApi.transportEntry;
export const subCategoryServiceApi = salesServiceApi.subCategory;
export const targetEntryServiceApi = salesServiceApi.targetEntry;
export const targetEntryItemServiceApi = salesServiceApi.targetEntryItem;
export const customerCreationServiceApi = salesServiceApi.customerCreation;
export const customerDestinationServiceApi = salesServiceApi.customerDestination;
export const customerItemPurposeServiceApi = salesServiceApi.customerItemPurpose;
export const rdfInertsPercEntryServiceApi = salesServiceApi.rdfInertsPercEntry;
export const icwSupplierCreationServiceApi = salesServiceApi.icwSupplierCreation;

/* -------- Login And Refresh -------- */
export const loginApi = adminMasterApi.login;
export const refreshLoginApi = adminMasterApi.generateRefresh;

/* -------- Sales Transactions (Phase 3+4) -------- */
export const aggregateQuotationApi = salesTransactionApi.aggregateQuotations;
export const scrapQuotationApi = salesTransactionApi.scrapQuotations;
export const nocDocumentApi = salesTransactionApi.nocDocuments;
export const dailyTargetApi = salesTransactionApi.dailyTargets;
export const afrRfqApi = salesTransactionApi.afrRfqs;
export const workOrderApi = salesTransactionApi.workOrders;
export const salesOrderApi = salesTransactionApi.salesOrders;
export const freightApi = salesTransactionApi.freights;
export const dcEntryApi = salesTransactionApi.dcEntries;
export const invoiceApi = salesTransactionApi.invoices;
export const payableApi = salesTransactionApi.payables;
export const receivableApi = salesTransactionApi.receivables;
export const icwWorkOrderApi = salesTransactionApi.icwWorkOrders;
export const negativeInvoiceApi = salesTransactionApi.negativeInvoices;
export const freightLetterApi = salesTransactionApi.freightLetters;
export const coProcessingApi = salesTransactionApi.coProcessing;
export const aggregateComparisonApi = salesTransactionApi.aggregateComparisons;
export const scrapComparisonApi = salesTransactionApi.scrapComparisons;
export const confirmationReceiptApi = salesTransactionApi.confirmationReceipts;
export const approvalHistoryApi = salesTransactionApi.approvalHistory;
export const approvalWorkOrderApi = salesTransactionApi.approvalWorkOrders;
export const approvalCustomerApi = salesTransactionApi.approvalCustomers;
export const approvalSalesOrderApi = salesTransactionApi.approvalSalesOrders;
export const approvalFreightApi = salesTransactionApi.approvalFreights;
export const approvalInvoiceApi = salesTransactionApi.approvalInvoices;
export const approvalPayableApi = salesTransactionApi.approvalPayables;
export const approvalReceivableApi = salesTransactionApi.approvalReceivables;
export const approvalAfrTransportApi = salesTransactionApi.approvalAfrTransports;
export const approvalNocDocumentApi = salesTransactionApi.approvalNocDocuments;

/* -------- Sales Reports (Phase C) -------- */
export const reportSupplyChainApi = salesReportApi.supplyChain;
export const reportAggregateStockApi = salesReportApi.aggregateStock;
export const reportAggregateStockPerDayApi = salesReportApi.aggregateStockPerDay;
export const reportGraphicalApi = salesReportApi.graphical;
export const reportSiteWiseDisposalApi = salesReportApi.siteWiseDisposal;
export const reportSiteWiseDisposalComparisonApi = salesReportApi.siteWiseDisposalComparison;
export const reportConsolidatedMonthlyApi = salesReportApi.consolidatedMonthly;
export const reportPayableReceivableTrackerApi = salesReportApi.payableReceivableTracker;
export const reportCustomerCreationApi = salesReportApi.customerCreation;
export const reportConfirmationReceiptApi = salesReportApi.confirmationReceipt;
export const reportWorkOrderStatusApi = salesReportApi.workOrderStatus;
export const reportMbsApi = salesReportApi.mbs;
export const reportRdfTrackerApi = salesReportApi.rdfTracker;
export const reportIcwDetailsApi = salesReportApi.icwDetails;
export const reportOthersAggregateComparisonApi = salesReportApi.othersAggregateComparison;

/* -------- Utilities -------- */
export * from "./endpoints";
export * from "./crudHelpers";
export * from "@/tanstack/admin";
