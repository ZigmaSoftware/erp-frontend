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
import PlantList from "@/pages/admin/modules/masters/plantCreation/plancreationList";
import PlantForm from "@/pages/admin/modules/masters/plantCreation/plantcreationForm";
import EquipmentTypesList from "@/pages/admin/modules/emMasters/equipmentTypes/equipmentTypesList";
import EquipmentTypesForm from "@/pages/admin/modules/emMasters/equipmentTypes/equipmentTypesForm";
import EquipmentModelList from "@/pages/admin/modules/emMasters/equipmentModel/equipmentModelList";
import EquipmentModelForm from "@/pages/admin/modules/emMasters/equipmentModel/equipmentModelForm";
import ContractorList from "@/pages/admin/modules/emMasters/contractor/contractorList";
import ContractorForm from "@/pages/admin/modules/emMasters/contractor/contractorForm";
import VehicleSupplierList from "@/pages/admin/modules/emMasters/VehicleSupplier/vehicleSupplierList";
import VehicleSupplierForm from "@/pages/admin/modules/emMasters/VehicleSupplier/vehicleSupplierForm";
import VehicleRequestList from "@/pages/admin/modules/emMasters/vehicleRequest/vehicleRequestList";
import VehicleRequestForm from "@/pages/admin/modules/emMasters/vehicleRequest/vehicleRequestForm";
import VehicleCreationList from "@/pages/admin/modules/emMasters/vehicleCreation/vehicleCreationList";
import VehicleCreationForm from "@/pages/admin/modules/emMasters/vehicleCreation/vehicleCreationForm";
import UserCreationList from "@/pages/admin/modules/admin/userCreation/user-creationList";
import UserCreationForm from "@/pages/admin/modules/admin/userCreation/user-creationForm";
import GroupPermissionList from "@/pages/admin/modules/admin/groupPermission/group-permissionList";
import GroupPermissionForm from "@/pages/admin/modules/admin/groupPermission/group-permissionForm";

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
    "user-creation": {list: UserCreationList, form: UserCreationForm},
    "group-permission": { list: GroupPermissionList, form: GroupPermissionForm },
  },
  masters: {
    continents: { list: ContinentList, form: ContinentForm },
    countries: { list: CountryList, form: CountryForm },
    states: { list: StateList, form: StateForm },
    districts: { list: DistrictList, form: DistrictForm },
    cities: { list: CityList, form: CityForm },
    "site-creation": { list: SiteCreationList, form: SiteCreationForm },
    "plant-creation": {list: PlantList, form: PlantForm}
  },
  "em-masters": {
    "equipment-types": { list: EquipmentTypesList, form: EquipmentTypesForm },
    "equipment-model": { list: EquipmentModelList, form: EquipmentModelForm },
    "contractor": { list: ContractorList, form: ContractorForm },
    "vehicle-suppliers": { list: VehicleSupplierList, form: VehicleSupplierForm },
    "vehicle-request": { list: VehicleRequestList, form: VehicleRequestForm },
    "vehicle-creation": { list: VehicleCreationList, form: VehicleCreationForm },
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
