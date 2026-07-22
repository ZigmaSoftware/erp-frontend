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
    "terms-of-payment-creation": { list: TermsOfPaymentCreationList, form: TermsOfPaymentCreationForm },
    "mail-details-creation": { list: MailDetailsCreationList, form: MailDetailsCreationForm },
    "document-type": { list: DocumentTypeList, form: DocumentTypeForm },
    "transport-master": { list: TransportEntryList, form: TransportEntryForm },
    "target-entry": { list: TargetEntryList, form: TargetEntryForm },
    "customer-creation": { list: CustomerCreationList, form: CustomerCreationForm },
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
