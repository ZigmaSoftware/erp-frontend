import { encryptSegment } from "./routeCrypto";

export type EncryptedRoutes = {
  encAdmins: string;
  encCities: string;
  encCitizenGrivence: string;
  encCollectionMonitoring: string;
  encComplaint: string;
  encContinents: string;
  encCountries: string;
  encBins: string;
  encCustomerCreation: string;
  encCustomerMaster: string;
  encDistricts: string;
  encFeedback: string;
  encFuel: string;
  encMainComplaintCategory: string;
  encMasters: string;
  encMonthlyDistance: string;
  encProperties: string;
  encReport: string;
  encSiteCreation: string;
  encStates: string;
  encSubComplaintCategory: string;
  encSubProperties: string;
  encTripSummary: string;
  encUserCreation: string;
  encGroupPermission: string;
  encUserScreenPermission: string;
  encUserType: string;
  encVehicleCreation: string;
  encVehicleHistory: string;
  encVehicleTrack: string;
  encVehicleTracking: string;
  encVehicleType: string;
  encWasteCollectedData: string;
  encWasteCollectedSummary: string;
  encWasteManagementMaster: string;
  encWards: string;
  encDateReport: string;
  encDayReport: string;
  encWorkforceManagement: string;
  encZones: string;
  encTransportMaster: string;
  encMainScreenType: string;
  encUserScreenAction: string;
  encMainScreen: string;
  encUserScreen: string;
  encPlantCreation: string;
  encEmMasters: string;
  encEquipmentType: string;
  encEquipmentModel: string;
  encContractor: string;
  encVehicleSupplier: string;
  encVehicleRequest: string;
  encMachineryHire: string;
  encSalesMasters: string;
  encSalesService: string;
  encScrapSalesCategory: string;
  encItemType: string;
  encItemCreation: string;
  encItemGroupCreation: string;
  encTransportMediumCreation: string;
  encTermsOfDeliveryCreation: string;
  encTermsOfPaymentCreation: string;
  encMailDetailsCreation: string;
  encDocumentType: string;
  encSubCategory: string;
  encTargetEntry: string;
  encRdfInertsPercEntry: string;
  encIcwSupplierCreation: string;
  encAggregateQuotation: string;
  encScrapQuotation: string;
  encNocDocument: string;
  encDailyTarget: string;
  encAfrRfq: string;
  encWorkOrder: string;
  encSalesOrder: string;
  encFreight: string;
  encDcEntry: string;
  encInvoice: string;
  encPayable: string;
  encReceivable: string;
  encWorkOrderApproval: string;
  encCustomerApproval: string;
  encSalesOrderApproval: string;
  encFreightApproval: string;
  encInvoiceApproval: string;
  encPayableApproval: string;
  encIcwWorkOrder: string;
  encNegativeInvoice: string;
  encFreightLetter: string;
  encCoProcessing: string;
  encAggregateComparison: string;
  encScrapComparison: string;
  encConfirmationReceipt: string;
  encNocVerification: string;
  encAfrTransportApproval: string;
  encReceivableApproval: string;
  encReportSupplyChain: string;
  encReportAggregateStock: string;
  encReportAggregateStockPerDay: string;
  encReportGraphical: string;
  encReportSiteWiseDisposal: string;
  encReportSiteWiseDisposalComparison: string;
  encReportConsolidatedMonthly: string;
  encReportPayableReceivableTracker: string;
  encReportCustomerCreation: string;
  encReportConfirmationReceipt: string;
  encReportWorkOrderStatus: string;
  encReportMbs: string;
  encReportRdfTracker: string;
  encReportIcwDetails: string;
  encReportOthersAggregateComparison: string;
};

const plainRoutes: EncryptedRoutes = {
  encAdmins: "admins",
  encCities: "cities",
  encCitizenGrivence: "citizen-grievance",
  encCollectionMonitoring: "collection-monitoring",
  encComplaint: "complaint",
  encContinents: "continents",
  encCountries: "countries",
  encBins: "bins",
  encCustomerCreation: "customer-creation",
  encCustomerMaster: "customer-master",
  encDistricts: "districts",
  encFeedback: "feedback",
  encFuel: "fuel",
  encMainComplaintCategory: "main-complaint-category",
  encMasters: "masters",
  encMonthlyDistance: "monthly-distance",
  encProperties: "properties",
  encReport: "reports",
  encSiteCreation: "site-creation",
  encStates: "states",
  encSubComplaintCategory: "sub-complaint-category",
  encSubProperties: "sub-properties",
  encTripSummary: "trip-summary",
  encUserCreation: "user-creation",
  encGroupPermission: "group-permission",
  encPlantCreation: "plant-creation",
  encUserType: "user-type",
  encVehicleCreation: "vehicle-creation",
  encVehicleHistory: "vehicle-history",
  encVehicleTrack: "vehicle-track",
  encVehicleTracking: "vehicle-tracking",
  encVehicleType: "vehicle-type",
  encWasteCollectedData: "waste-collected-data",
  encWasteCollectedSummary: "waste-collected-summary",
  encWasteManagementMaster: "waste-management",
  encWards: "wards",
  encDateReport: "date-report",
  encDayReport: "day-report",
  encWorkforceManagement: "workforce-management",
  encZones: "zones",
  encTransportMaster: "transport-master",
  encMainScreenType: "mainscreen-type",
  encUserScreenAction: "userscreen-action",
  encMainScreen: "mainscreens",
  encUserScreen: "userscreens",
  encUserScreenPermission: "userscreenpermissions",
  encEmMasters: "em-masters",
  encEquipmentType: "equipment-types",
  encEquipmentModel: "equipment-model",
  encContractor: "contractor",
  encVehicleSupplier: "vehicle-suppliers",
  encVehicleRequest: "vehicle-request",
  encMachineryHire: "machinery-hire",
  encSalesMasters: "sales-masters",
  encSalesService: "sales-service",
  encScrapSalesCategory: "scrap-sales-category",
  encItemType: "item-type",
  encItemCreation: "item-creation",
  encDocumentType: "document-type",
  encItemGroupCreation: "item-group-creation",
  encTransportMediumCreation: "transport-medium-creation",
  encTermsOfDeliveryCreation: "terms-of-delivery-creation",
  encTermsOfPaymentCreation: "terms-of-payment-creation",
  encMailDetailsCreation: "mail-details-creation",
  encSubCategory: "sub-category",
  encTargetEntry: "target-entry",
  encRdfInertsPercEntry: "rdf-inerts-percentage-entry",
  encIcwSupplierCreation: "icw-supplier-creation",
  encAggregateQuotation: "aggregate-quotation",
  encScrapQuotation: "scrap-quotation",
  encNocDocument: "noc-document",
  encDailyTarget: "daily-target",
  encAfrRfq: "afr-rfq",
  encWorkOrder: "work-order",
  encSalesOrder: "sales-order",
  encFreight: "freight",
  encDcEntry: "dc-entry",
  encInvoice: "invoice",
  encPayable: "payable",
  encReceivable: "receivable",
  encWorkOrderApproval: "work-order-approval",
  encCustomerApproval: "customer-approval",
  encSalesOrderApproval: "sales-order-approval",
  encFreightApproval: "freight-approval",
  encInvoiceApproval: "invoice-approval",
  encPayableApproval: "payable-approval",
  encIcwWorkOrder: "icw-work-order",
  encNegativeInvoice: "negative-invoice",
  encFreightLetter: "freight-letter",
  encCoProcessing: "co-processing",
  encAggregateComparison: "aggregate-comparison",
  encScrapComparison: "scrap-comparison",
  encConfirmationReceipt: "confirmation-receipt",
  encNocVerification: "noc-verification",
  encAfrTransportApproval: "afr-transport-approval",
  encReceivableApproval: "receivable-approval",
  encReportSupplyChain: "report-supply-chain",
  encReportAggregateStock: "report-aggregate-stock",
  encReportAggregateStockPerDay: "report-aggregate-stock-per-day",
  encReportGraphical: "report-graphical",
  encReportSiteWiseDisposal: "report-site-wise-disposal",
  encReportSiteWiseDisposalComparison: "report-site-wise-disposal-comparison",
  encReportConsolidatedMonthly: "report-consolidated-monthly",
  encReportPayableReceivableTracker: "report-payable-receivable-tracker",
  encReportCustomerCreation: "report-customer-creation",
  encReportConfirmationReceipt: "report-confirmation-receipt",
  encReportWorkOrderStatus: "report-work-order-status",
  encReportMbs: "report-mbs",
  encReportRdfTracker: "report-rdf-tracker",
  encReportIcwDetails: "report-icw-details",
  encReportOthersAggregateComparison: "report-others-aggregate-comparison",
};

const encryptRoutes = (routes: EncryptedRoutes): EncryptedRoutes => {
  return Object.fromEntries(
    Object.entries(routes).map(([key, value]) => [key, encryptSegment(value)]),
  ) as EncryptedRoutes;
};

const encryptedDefaults = encryptRoutes(plainRoutes);

export function getEncryptedRoute(
  overrides?: Partial<EncryptedRoutes>,
): EncryptedRoutes {
  if (!overrides || Object.keys(overrides).length === 0) {
    return encryptedDefaults;
  }

  const merged = {
    ...plainRoutes,
    ...overrides,
  };

  return encryptRoutes(merged as EncryptedRoutes);
}
