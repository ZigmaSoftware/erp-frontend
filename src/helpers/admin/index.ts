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
export const userCreationApi = adminMasterApi.userCreations;
export const userRoleApi = adminMasterApi.userTypes;

/* -------- EM Masters -------- */
export const equipmentTypeApi = emMasterApi.equipmentTypes;
export const equipmentModelApi = emMasterApi.equipmentModels;
export const contractorApi = emMasterApi.contractorModels;
export const vehicleSupplierApi = emMasterApi.vehicleSuppliers;
export const vehicleRequestApi = emMasterApi.vehicleRequest;


/* -------- Login And Refresh -------- */
export const loginApi = adminMasterApi.login;
export const refreshLoginApi = adminMasterApi.generateRefresh;

/* -------- Utilities -------- */
export * from "./endpoints";
export * from "./crudHelpers";
