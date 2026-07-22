import { commonMasterApi, emMasterApi, adminMasterApi, salesMasterApi, salesServiceApi } from "./registry";

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

/* -------- Utilities -------- */
export * from "./endpoints";
export * from "./crudHelpers";
export * from "@/tanstack/admin";
