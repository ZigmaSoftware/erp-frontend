import { adminApi, emMasterApi } from "./registry";

/* -------- Masters -------- */
export const continentApi = adminApi.continents;
export const countryApi = adminApi.countries;
export const binApi = adminApi.bins;
export const stateApi = adminApi.states;
export const districtApi = adminApi.districts;
export const cityApi = adminApi.cities;
export const zoneApi = adminApi.zones;
export const wardApi = adminApi.wards;
export const siteApi = adminApi.sites;
export const plantApi = adminApi.plants;

/* -------- Assets -------- */
export const fuelApi = adminApi.fuels;
export const propertiesApi = adminApi.properties;
export const subPropertiesApi = adminApi.subProperties;

/* -------- User / Staff -------- */
export const staffCreationApi = adminApi.staffCreation;
export const staffUserTypeApi = adminApi.staffUserTypes;
export const userTypeApi = adminApi.userTypes;
export const userCreationApi = adminApi.usercreations;

/* -------- Customers -------- */
export const customerCreationApi = adminApi.customerCreations;
export const wasteCollectionApi = adminApi.wasteCollections;
export const complaintApi = adminApi.complaints;
export const feedbackApi = adminApi.feedbacks;
export const mainCategoryApi = adminApi.mainCategory;
export const subCategoryApi = adminApi.subCategory;

/* -------- Screens & Permissions -------- */
export const mainScreenTypeApi = adminApi.mainscreentype;
export const mainScreenApi = adminApi.mainscreens;
export const userScreenApi = adminApi.userscreens;
export const userScreenActionApi = adminApi.userscreenaction;
export const userScreenPermissionApi = adminApi.userscreenpermissions;

/* -------- Vehicles -------- */
export const vehicleTypeApi = adminApi.vehicleTypes;
export const vehicleCreationApi = adminApi.vehicleCreation;

/* -------- EM Masters -------- */
export const equipmentTypeApi = emMasterApi.equipmentTypes;

/* -------- Utilities -------- */
export * from "./endpoints";
export * from "./crudHelpers";
