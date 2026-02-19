import { commonMasterApi, emMasterApi, adminMasterApi } from "./registry";

/* -------- Masters -------- */
export const continentApi = commonMasterApi.continents;
export const countryApi = commonMasterApi.countries;
export const stateApi = commonMasterApi.states;
export const districtApi = commonMasterApi.districts;
export const cityApi = commonMasterApi.cities;
export const siteApi = commonMasterApi.sites;
export const plantApi = commonMasterApi.plants;

/* -------- User / Staff -------- */
export const staffUserTypeApi = adminMasterApi.staffUserTypes;
export const userTypeApi = adminMasterApi.userTypes;
export const userCreationApi = adminMasterApi.userCreations;

/* -------- Customers -------- */
export const customerCreationApi = commonMasterApi.customerCreations;
export const wasteCollectionApi = commonMasterApi.wasteCollections;
export const complaintApi = commonMasterApi.complaints;
export const feedbackApi = commonMasterApi.feedbacks;
export const mainCategoryApi = commonMasterApi.mainCategory;
export const subCategoryApi = commonMasterApi.subCategory;

/* -------- Screens & Permissions -------- */
export const mainScreenTypeApi = adminMasterApi.mainScreenType;
export const mainScreenApi = adminMasterApi.mainScreens;
export const userScreenApi = adminMasterApi.userScreens;
export const userScreenActionApi = adminMasterApi.userScreenAction;
export const userScreenPermissionApi =
  adminMasterApi.userScreenPermissions;

export const userRoleApi = adminMasterApi.userTypes;

/* -------- EM Masters -------- */
export const equipmentTypeApi = emMasterApi.equipmentTypes;
export const equipmentModelApi = emMasterApi.equipmentModels;
export const contractorApi = emMasterApi.contractorModels;
export const vehicleSupplierApi = emMasterApi.vehicleSuppliers;


/* -------- Login And Refresh -------- */
export const loginApi = adminMasterApi.login;
export const refreshLoginApi = adminMasterApi.generateRefresh;

/* -------- Utilities -------- */
export * from "./endpoints";
export * from "./crudHelpers";
