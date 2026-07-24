import { useMemo, type ComponentType } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

import { decryptSegment } from "@/utils/routeCrypto";

// Import your actual page components
import ContinentList from "@/pages/admin/modules/masters/continent/ContinentListPage";
import ContinentForm from "@/pages/admin/modules/masters/continent/ContinentForm";
import CountryList from "@/pages/admin/modules/masters/country/CountryListPage";
import CountryForm from "@/pages/admin/modules/masters/country/CountryForm";
import StateList from "@/pages/admin/modules/masters/state/StateListPage";
import StateForm from "@/pages/admin/modules/masters/state/StateForm";
import DistrictList from "@/pages/admin/modules/masters/district/DistrictListPage";
import DistrictForm from "@/pages/admin/modules/masters/district/DistrictForm";
import CityList from "@/pages/admin/modules/masters/city/CityListPage";
import CityForm from "@/pages/admin/modules/masters/city/CityForm";
import SiteCreationList from "@/pages/admin/modules/masters/siteCreation/siteCreationList";
import SiteCreationForm from "@/pages/admin/modules/masters/siteCreation/siteCreationForm";
// Admin
import UserTypeList from "@/pages/admin/modules/admin/userType/user-typeList";
import UserTypeForm from "@/pages/admin/modules/admin/userType/user-typeForm";
import UserCreationList from "@/pages/admin/modules/admin/userCreation/user-creationList";
import UserCreationForm from "@/pages/admin/modules/admin/userCreation/user-creationForm";
import GroupPermissionList from "@/pages/admin/modules/admin/groupPermission/group-permissionList";
import GroupPermissionForm from "@/pages/admin/modules/admin/groupPermission/group-permissionForm";
import PlantList from "@/pages/admin/modules/masters/plantCreation/plancreationList";
import PlantForm from "@/pages/admin/modules/masters/plantCreation/plantcreationForm";
import EquipmentTypesList from "@/pages/admin/modules/emMasters/equipmentTypes/equipmentTypesList";
import EquipmentTypesForm from "@/pages/admin/modules/emMasters/equipmentTypes/equipmentTypesForm";
import EquipmentModelList from "@/pages/admin/modules/emMasters/equipmentModel/equipmentModelList";
import EquipmentModelForm from "@/pages/admin/modules/emMasters/equipmentModel/equipmentModelForm";
import VehicleSupplierList from "@/pages/admin/modules/emMasters/VehicleSupplier/vehicleSupplierList";
import VehicleSupplierForm from "@/pages/admin/modules/emMasters/VehicleSupplier/vehicleSupplierForm";
import ContractorList from "@/pages/admin/modules/emMasters/contractor/contractorList";
import ContractorForm from "@/pages/admin/modules/emMasters/contractor/contractorForm";
import VehicleRequestList from "@/pages/admin/modules/emMasters/vehicleRequest/vehicleRequestList";
import VehicleRequestForm from "@/pages/admin/modules/emMasters/vehicleRequest/vehicleRequestForm";
import VehicleCreationList from "@/pages/admin/modules/emMasters/vehicleCreation/vehicleCreationList";
import VehicleCreationForm from "@/pages/admin/modules/emMasters/vehicleCreation/vehicleCreationForm";
import MachineryHireList from "@/pages/admin/modules/emMasters/machineryHire/machineryHireList";
import MachineryHireForm from "@/pages/admin/modules/emMasters/machineryHire/machineryHireForm";
// Sales Masters
import ScrapSalesCategoryList from "@/pages/admin/modules/salesMasters/scrapSalesCategory/scrapSalesCategoryList";
import ScrapSalesCategoryForm from "@/pages/admin/modules/salesMasters/scrapSalesCategory/scrapSalesCategoryForm";
import ItemTypeList from "@/pages/admin/modules/salesMasters/itemType/itemTypeList";
import ItemTypeForm from "@/pages/admin/modules/salesMasters/itemType/itemTypeForm";
import ItemCreationList from "@/pages/admin/modules/salesMasters/itemCreation/itemCreationList";
import ItemCreationForm from "@/pages/admin/modules/salesMasters/itemCreation/itemCreationForm";
import ItemGroupCreationList from "@/pages/admin/modules/salesMasters/itemGroupCreation/itemGroupCreationList";
import ItemGroupCreationForm from "@/pages/admin/modules/salesMasters/itemGroupCreation/itemGroupCreationForm";
import TransportMediumCreationList from "@/pages/admin/modules/salesMasters/transportMediumCreation/transportMediumCreationList";
import TransportMediumCreationForm from "@/pages/admin/modules/salesMasters/transportMediumCreation/transportMediumCreationForm";
import TermsOfDeliveryCreationList from "@/pages/admin/modules/salesMasters/termsOfDeliveryCreation/termsOfDeliveryCreationList";
import TermsOfDeliveryCreationForm from "@/pages/admin/modules/salesMasters/termsOfDeliveryCreation/termsOfDeliveryCreationForm";
import TermsOfPaymentCreationList from "@/pages/admin/modules/salesMasters/termsOfPaymentCreation/termsOfPaymentCreationList";
import TermsOfPaymentCreationForm from "@/pages/admin/modules/salesMasters/termsOfPaymentCreation/termsOfPaymentCreationForm";
import MailDetailsCreationList from "@/pages/admin/modules/salesMasters/mailDetailsCreation/mailDetailsCreationList";
import MailDetailsCreationForm from "@/pages/admin/modules/salesMasters/mailDetailsCreation/mailDetailsCreationForm";
import DocumentTypeList from "@/pages/admin/modules/salesMasters/documentType/documentTypeList";
import DocumentTypeForm from "@/pages/admin/modules/salesMasters/documentType/documentTypeForm";
import TransportEntryList from "@/pages/admin/modules/salesMasters/transportEntry/transportEntryList";
import TransportEntryForm from "@/pages/admin/modules/salesMasters/transportEntry/transportEntryForm";
import SubCategoryList from "@/pages/admin/modules/salesMasters/subCategory/subCategoryList";
import SubCategoryForm from "@/pages/admin/modules/salesMasters/subCategory/subCategoryForm";
import TargetEntryList from "@/pages/admin/modules/salesMasters/targetEntry/targetEntryList";
import TargetEntryForm from "@/pages/admin/modules/salesMasters/targetEntry/targetEntryForm";
import CustomerCreationList from "@/pages/admin/modules/salesMasters/customerCreation/customerCreationList";
import CustomerCreationForm from "@/pages/admin/modules/salesMasters/customerCreation/customerCreationForm";
import RdfInertsPercEntryList from "@/pages/admin/modules/salesMasters/rdfInertsPercEntry/rdfInertsPercEntryList";
import RdfInertsPercEntryForm from "@/pages/admin/modules/salesMasters/rdfInertsPercEntry/rdfInertsPercEntryForm";
import IcwSupplierCreationList from "@/pages/admin/modules/salesMasters/icwSupplierCreation/icwSupplierCreationList";
import IcwSupplierCreationForm from "@/pages/admin/modules/salesMasters/icwSupplierCreation/icwSupplierCreationForm";
// Sales Service (standalone sales_service microservice - parallel copy of Sales Masters)
import ScrapSalesCategoryServiceList from "@/pages/admin/modules/salesService/scrapSalesCategory/scrapSalesCategoryList";
import ScrapSalesCategoryServiceForm from "@/pages/admin/modules/salesService/scrapSalesCategory/scrapSalesCategoryForm";
import ItemTypeServiceList from "@/pages/admin/modules/salesService/itemType/itemTypeList";
import ItemTypeServiceForm from "@/pages/admin/modules/salesService/itemType/itemTypeForm";
import ItemCreationServiceList from "@/pages/admin/modules/salesService/itemCreation/itemCreationList";
import ItemCreationServiceForm from "@/pages/admin/modules/salesService/itemCreation/itemCreationForm";
import ItemGroupCreationServiceList from "@/pages/admin/modules/salesService/itemGroupCreation/itemGroupCreationList";
import ItemGroupCreationServiceForm from "@/pages/admin/modules/salesService/itemGroupCreation/itemGroupCreationForm";
import TransportMediumCreationServiceList from "@/pages/admin/modules/salesService/transportMediumCreation/transportMediumCreationList";
import TransportMediumCreationServiceForm from "@/pages/admin/modules/salesService/transportMediumCreation/transportMediumCreationForm";
import TermsOfDeliveryCreationServiceList from "@/pages/admin/modules/salesService/termsOfDeliveryCreation/termsOfDeliveryCreationList";
import TermsOfDeliveryCreationServiceForm from "@/pages/admin/modules/salesService/termsOfDeliveryCreation/termsOfDeliveryCreationForm";
import TermsOfPaymentCreationServiceList from "@/pages/admin/modules/salesService/termsOfPaymentCreation/termsOfPaymentCreationList";
import TermsOfPaymentCreationServiceForm from "@/pages/admin/modules/salesService/termsOfPaymentCreation/termsOfPaymentCreationForm";
import MailDetailsCreationServiceList from "@/pages/admin/modules/salesService/mailDetailsCreation/mailDetailsCreationList";
import MailDetailsCreationServiceForm from "@/pages/admin/modules/salesService/mailDetailsCreation/mailDetailsCreationForm";
import DocumentTypeServiceList from "@/pages/admin/modules/salesService/documentType/documentTypeList";
import DocumentTypeServiceForm from "@/pages/admin/modules/salesService/documentType/documentTypeForm";
import TransportEntryServiceList from "@/pages/admin/modules/salesService/transportEntry/transportEntryList";
import TransportEntryServiceForm from "@/pages/admin/modules/salesService/transportEntry/transportEntryForm";
import SubCategoryServiceList from "@/pages/admin/modules/salesService/subCategory/subCategoryList";
import SubCategoryServiceForm from "@/pages/admin/modules/salesService/subCategory/subCategoryForm";
import TargetEntryServiceList from "@/pages/admin/modules/salesService/targetEntry/targetEntryList";
import TargetEntryServiceForm from "@/pages/admin/modules/salesService/targetEntry/targetEntryForm";
import CustomerCreationServiceList from "@/pages/admin/modules/salesService/customerCreation/customerCreationList";
import CustomerCreationServiceForm from "@/pages/admin/modules/salesService/customerCreation/customerCreationForm";
import RdfInertsPercEntryServiceList from "@/pages/admin/modules/salesService/rdfInertsPercEntry/rdfInertsPercEntryList";
import RdfInertsPercEntryServiceForm from "@/pages/admin/modules/salesService/rdfInertsPercEntry/rdfInertsPercEntryForm";
import IcwSupplierCreationServiceList from "@/pages/admin/modules/salesService/icwSupplierCreation/icwSupplierCreationList";
import IcwSupplierCreationServiceForm from "@/pages/admin/modules/salesService/icwSupplierCreation/icwSupplierCreationForm";
// Phase 3 - Day Product
import AggregateQuotationServiceList from "@/pages/admin/modules/salesService/aggregateQuotation/aggregateQuotationList";
import AggregateQuotationServiceForm from "@/pages/admin/modules/salesService/aggregateQuotation/aggregateQuotationForm";
import ScrapQuotationServiceList from "@/pages/admin/modules/salesService/scrapQuotation/scrapQuotationList";
import ScrapQuotationServiceForm from "@/pages/admin/modules/salesService/scrapQuotation/scrapQuotationForm";
import NocDocumentServiceList from "@/pages/admin/modules/salesService/nocDocument/nocDocumentList";
import NocDocumentServiceForm from "@/pages/admin/modules/salesService/nocDocument/nocDocumentForm";
import DailyTargetServiceList from "@/pages/admin/modules/salesService/dailyTarget/dailyTargetList";
import DailyTargetServiceForm from "@/pages/admin/modules/salesService/dailyTarget/dailyTargetForm";
import AfrRfqServiceList from "@/pages/admin/modules/salesService/afrRfq/afrRfqList";
import AfrRfqServiceForm from "@/pages/admin/modules/salesService/afrRfq/afrRfqForm";
// Phase 4 - Transactions
import WorkOrderServiceList from "@/pages/admin/modules/salesService/workOrder/workOrderList";
import WorkOrderServiceForm from "@/pages/admin/modules/salesService/workOrder/workOrderForm";
import SalesOrderServiceList from "@/pages/admin/modules/salesService/salesOrder/salesOrderList";
import SalesOrderServiceForm from "@/pages/admin/modules/salesService/salesOrder/salesOrderForm";
import FreightServiceList from "@/pages/admin/modules/salesService/freight/freightList";
import FreightServiceForm from "@/pages/admin/modules/salesService/freight/freightForm";
import DcEntryServiceList from "@/pages/admin/modules/salesService/dcEntry/dcEntryList";
import DcEntryServiceForm from "@/pages/admin/modules/salesService/dcEntry/dcEntryForm";
import InvoiceServiceList from "@/pages/admin/modules/salesService/invoice/invoiceList";
import InvoiceServiceForm from "@/pages/admin/modules/salesService/invoice/invoiceForm";
import PayableServiceList from "@/pages/admin/modules/salesService/payable/payableList";
import PayableServiceForm from "@/pages/admin/modules/salesService/payable/payableForm";
import ReceivableServiceList from "@/pages/admin/modules/salesService/receivable/receivableList";
import ReceivableServiceForm from "@/pages/admin/modules/salesService/receivable/receivableForm";
// Phase A - Additional modules
import IcwWorkOrderServiceList from "@/pages/admin/modules/salesService/icwWorkOrder/icwWorkOrderList";
import IcwWorkOrderServiceForm from "@/pages/admin/modules/salesService/icwWorkOrder/icwWorkOrderForm";
import NegativeInvoiceServiceList from "@/pages/admin/modules/salesService/negativeInvoice/negativeInvoiceList";
import NegativeInvoiceServiceForm from "@/pages/admin/modules/salesService/negativeInvoice/negativeInvoiceForm";
import FreightLetterServiceList from "@/pages/admin/modules/salesService/freightLetter/freightLetterList";
import FreightLetterServiceForm from "@/pages/admin/modules/salesService/freightLetter/freightLetterForm";
import CoProcessingServiceList from "@/pages/admin/modules/salesService/coProcessing/coProcessingList";
import CoProcessingServiceForm from "@/pages/admin/modules/salesService/coProcessing/coProcessingForm";
import AggregateComparisonServiceList from "@/pages/admin/modules/salesService/aggregateComparison/aggregateComparisonList";
import AggregateComparisonServiceForm from "@/pages/admin/modules/salesService/aggregateComparison/aggregateComparisonForm";
import ScrapComparisonServiceList from "@/pages/admin/modules/salesService/scrapComparison/scrapComparisonList";
import ScrapComparisonServiceForm from "@/pages/admin/modules/salesService/scrapComparison/scrapComparisonForm";
import ConfirmationReceiptServiceList from "@/pages/admin/modules/salesService/confirmationReceipt/confirmationReceiptList";
import ConfirmationReceiptServiceForm from "@/pages/admin/modules/salesService/confirmationReceipt/confirmationReceiptForm";
// Approvals
import WorkOrderApprovalList from "@/pages/admin/modules/salesService/approvals/workOrderApprovalList";
import CustomerApprovalList from "@/pages/admin/modules/salesService/approvals/customerApprovalList";
import SalesOrderApprovalList from "@/pages/admin/modules/salesService/approvals/salesOrderApprovalList";
import FreightApprovalList from "@/pages/admin/modules/salesService/approvals/freightApprovalList";
import InvoiceApprovalList from "@/pages/admin/modules/salesService/approvals/invoiceApprovalList";
import PayableApprovalList from "@/pages/admin/modules/salesService/approvals/payableApprovalList";
import ReceivableApprovalList from "@/pages/admin/modules/salesService/approvals/receivableApprovalList";
import AfrTransportApprovalList from "@/pages/admin/modules/salesService/approvals/afrTransportApprovalList";
import NocVerificationList from "@/pages/admin/modules/salesService/approvals/nocVerificationList";
// Reports
import SupplyChainReport from "@/pages/admin/modules/salesService/reports/supplyChainReport";
import AggregateStockReport from "@/pages/admin/modules/salesService/reports/aggregateStockReport";
import AggregateStockPerDayReport from "@/pages/admin/modules/salesService/reports/aggregateStockPerDayReport";
import GraphicalReport from "@/pages/admin/modules/salesService/reports/graphicalReport";
import SiteWiseDisposalReport from "@/pages/admin/modules/salesService/reports/siteWiseDisposalReport";
import SiteWiseDisposalComparisonReport from "@/pages/admin/modules/salesService/reports/siteWiseDisposalComparisonReport";
import ConsolidatedMonthlySiteWiseReport from "@/pages/admin/modules/salesService/reports/consolidatedMonthlySiteWiseReport";
import PayableReceivableTrackerReport from "@/pages/admin/modules/salesService/reports/payableReceivableTrackerReport";
import CustomerCreationReport from "@/pages/admin/modules/salesService/reports/customerCreationReport";
import ConfirmationReceiptReport from "@/pages/admin/modules/salesService/reports/confirmationReceiptReport";
import WorkOrderStatusReport from "@/pages/admin/modules/salesService/reports/workOrderStatusReport";
import MBSReport from "@/pages/admin/modules/salesService/reports/mbsReport";
import RDFTrackerReport from "@/pages/admin/modules/salesService/reports/rdfTrackerReport";
import ICWDetailsReport from "@/pages/admin/modules/salesService/reports/icwDetailsReport";
import OthersAggregateComparisonReport from "@/pages/admin/modules/salesService/reports/othersAggregateComparisonReport";

type ModuleComponent = ComponentType | undefined;

type RouteConfig = {
  list?: ModuleComponent;
  form?: ModuleComponent;
  editForm?: ModuleComponent;
  component?: ModuleComponent;
};

type RouteMap = Record<string, Record<string, RouteConfig>>;

const ROUTES: RouteMap = {
  admins: {
    "user-type": { list: UserTypeList, form: UserTypeForm },
    "user-creation": { list: UserCreationList, form: UserCreationForm },
    "group-permission": { list: GroupPermissionList, form: GroupPermissionForm },
  },
  masters: {
    continents: { list: ContinentList, form: ContinentForm },
    countries: { list: CountryList, form: CountryForm },
    states: { list: StateList, form: StateForm },
    districts: { list: DistrictList, form: DistrictForm },
    cities: { list: CityList, form: CityForm },
    "site-creation": { list: SiteCreationList, form: SiteCreationForm },
    "plant-creation": { list: PlantList, form: PlantForm },
  },
  "em-masters": {
    "equipment-types": { list: EquipmentTypesList, form: EquipmentTypesForm },
    "equipment-model": { list: EquipmentModelList, form: EquipmentModelForm },
    contractor: { list: ContractorList, form: ContractorForm },
    "vehicle-suppliers": { list: VehicleSupplierList, form: VehicleSupplierForm },
    "vehicle-request": { list: VehicleRequestList, form: VehicleRequestForm },
    "vehicle-creation": { list: VehicleCreationList, form: VehicleCreationForm },
    "machinery-hire": { list: MachineryHireList, form: MachineryHireForm },
  },
  "sales-masters": {
    "scrap-sales-category": { list: ScrapSalesCategoryList, form: ScrapSalesCategoryForm },
    "item-type": { list: ItemTypeList, form: ItemTypeForm },
    "sub-category": { list: SubCategoryList, form: SubCategoryForm },
    "item-creation": { list: ItemCreationList, form: ItemCreationForm },
    "item-group-creation": { list: ItemGroupCreationList, form: ItemGroupCreationForm },
    "transport-medium-creation": { list: TransportMediumCreationList, form: TransportMediumCreationForm },
    "terms-of-delivery-creation": { list: TermsOfDeliveryCreationList, form: TermsOfDeliveryCreationForm },
    "terms-of-payment-creation": { list: TermsOfPaymentCreationList, form: TermsOfPaymentCreationForm },
    "mail-details-creation": { list: MailDetailsCreationList, form: MailDetailsCreationForm },
    "rdf-inerts-percentage-entry": { list: RdfInertsPercEntryList, form: RdfInertsPercEntryForm },
    "icw-supplier-creation": { list: IcwSupplierCreationList, form: IcwSupplierCreationForm },
    "document-type": { list: DocumentTypeList, form: DocumentTypeForm },
    "transport-master": { list: TransportEntryList, form: TransportEntryForm },
    "target-entry": { list: TargetEntryList, form: TargetEntryForm },
    "customer-creation": { list: CustomerCreationList, form: CustomerCreationForm },
  },
  "sales-service": {
    "scrap-sales-category": { list: ScrapSalesCategoryServiceList, form: ScrapSalesCategoryServiceForm },
    "item-type": { list: ItemTypeServiceList, form: ItemTypeServiceForm },
    "sub-category": { list: SubCategoryServiceList, form: SubCategoryServiceForm },
    "item-creation": { list: ItemCreationServiceList, form: ItemCreationServiceForm },
    "item-group-creation": { list: ItemGroupCreationServiceList, form: ItemGroupCreationServiceForm },
    "transport-medium-creation": { list: TransportMediumCreationServiceList, form: TransportMediumCreationServiceForm },
    "terms-of-delivery-creation": { list: TermsOfDeliveryCreationServiceList, form: TermsOfDeliveryCreationServiceForm },
    "terms-of-payment-creation": { list: TermsOfPaymentCreationServiceList, form: TermsOfPaymentCreationServiceForm },
    "mail-details-creation": { list: MailDetailsCreationServiceList, form: MailDetailsCreationServiceForm },
    "rdf-inerts-percentage-entry": { list: RdfInertsPercEntryServiceList, form: RdfInertsPercEntryServiceForm },
    "icw-supplier-creation": { list: IcwSupplierCreationServiceList, form: IcwSupplierCreationServiceForm },
    "document-type": { list: DocumentTypeServiceList, form: DocumentTypeServiceForm },
    "transport-master": { list: TransportEntryServiceList, form: TransportEntryServiceForm },
    "target-entry": { list: TargetEntryServiceList, form: TargetEntryServiceForm },
    "customer-creation": { list: CustomerCreationServiceList, form: CustomerCreationServiceForm },
    // Phase 3 - Day Product
    "aggregate-quotation": { list: AggregateQuotationServiceList, form: AggregateQuotationServiceForm },
    "scrap-quotation": { list: ScrapQuotationServiceList, form: ScrapQuotationServiceForm },
    "noc-document": { list: NocDocumentServiceList, form: NocDocumentServiceForm },
    "daily-target": { list: DailyTargetServiceList, form: DailyTargetServiceForm },
    "afr-rfq": { list: AfrRfqServiceList, form: AfrRfqServiceForm },
    // Phase 4 - Transactions
    "work-order": { list: WorkOrderServiceList, form: WorkOrderServiceForm },
    "sales-order": { list: SalesOrderServiceList, form: SalesOrderServiceForm },
    freight: { list: FreightServiceList, form: FreightServiceForm },
    "dc-entry": { list: DcEntryServiceList, form: DcEntryServiceForm },
    invoice: { list: InvoiceServiceList, form: InvoiceServiceForm },
    payable: { list: PayableServiceList, form: PayableServiceForm },
    receivable: { list: ReceivableServiceList, form: ReceivableServiceForm },
    // Phase A - Additional
    "icw-work-order": { list: IcwWorkOrderServiceList, form: IcwWorkOrderServiceForm },
    "negative-invoice": { list: NegativeInvoiceServiceList, form: NegativeInvoiceServiceForm },
    "freight-letter": { list: FreightLetterServiceList, form: FreightLetterServiceForm },
    "co-processing": { list: CoProcessingServiceList, form: CoProcessingServiceForm },
    "aggregate-comparison": { list: AggregateComparisonServiceList, form: AggregateComparisonServiceForm },
    "scrap-comparison": { list: ScrapComparisonServiceList, form: ScrapComparisonServiceForm },
    "confirmation-receipt": { list: ConfirmationReceiptServiceList, form: ConfirmationReceiptServiceForm },
    // Approvals
    "work-order-approval": { list: WorkOrderApprovalList },
    "customer-approval": { list: CustomerApprovalList },
    "sales-order-approval": { list: SalesOrderApprovalList },
    "freight-approval": { list: FreightApprovalList },
    "invoice-approval": { list: InvoiceApprovalList },
    "payable-approval": { list: PayableApprovalList },
    "receivable-approval": { list: ReceivableApprovalList },
    "afr-transport-approval": { list: AfrTransportApprovalList },
    "noc-verification": { list: NocVerificationList },
    // Reports
    "report-supply-chain": { list: SupplyChainReport },
    "report-aggregate-stock": { list: AggregateStockReport },
    "report-aggregate-stock-per-day": { list: AggregateStockPerDayReport },
    "report-graphical": { list: GraphicalReport },
    "report-site-wise-disposal": { list: SiteWiseDisposalReport },
    "report-site-wise-disposal-comparison": { list: SiteWiseDisposalComparisonReport },
    "report-consolidated-monthly": { list: ConsolidatedMonthlySiteWiseReport },
    "report-payable-receivable-tracker": { list: PayableReceivableTrackerReport },
    "report-customer-creation": { list: CustomerCreationReport },
    "report-confirmation-receipt": { list: ConfirmationReceiptReport },
    "report-work-order-status": { list: WorkOrderStatusReport },
    "report-mbs": { list: MBSReport },
    "report-rdf-tracker": { list: RDFTrackerReport },
    "report-icw-details": { list: ICWDetailsReport },
    "report-others-aggregate-comparison": { list: OthersAggregateComparisonReport },
  },
};

const resolveComponent = (config: RouteConfig | undefined, mode: "view" | "new" | "edit"): ModuleComponent => {
  if (!config) return undefined;

  if (config.component) return config.component;
  if (mode === "edit") return config.editForm ?? config.form;
  if (mode === "new") return config.form;
  return config.list;
};

export default function AdminEncryptedRouter() {
  const { encMaster, encModule, id } = useParams();
  const location = useLocation();

  const { master, moduleName } = useMemo(() => {
    return {
      master: decryptSegment(encMaster ?? ""),
      moduleName: decryptSegment(encModule ?? ""),
    };
  }, [encMaster, encModule]);

  if (!master || !moduleName) {
    return <Navigate to="/" replace />;
  }

  const moduleRoutes = ROUTES[master]?.[moduleName];
  if (!moduleRoutes) {
    return <Navigate to="/" replace />;
  }

  const mode: "view" | "new" | "edit" = id ? "edit" : location.pathname.endsWith("/new") ? "new" : "view";
  const Component = resolveComponent(moduleRoutes, mode);

  if (!Component) {
    return <Navigate to="/" replace />;
  }

  return <Component />;
}
