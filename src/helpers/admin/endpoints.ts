/* --------------------------------------------------------
   Base prefixes
-------------------------------------------------------- */
const MASTER_BASE = "masters";
const ASSET_BASE = "assets";
const SCREEN_BASE = "screen-management";
const ROLE_BASE = "role-assign";
const USER_BASE = "user-creation";
const CUSTOMER_BASE = "customers";
const VEHICLE_BASE = "vehicles";
const EM_MASTER_BASE = "em-masters";

/* --------------------------------------------------------
   EM Masters
-------------------------------------------------------- */
export const emMastersEndpoints = {
  equipmentTypes: `${EM_MASTER_BASE}/equipment-types/`,
   equipmentModels: `${EM_MASTER_BASE}/equipment-model/`,
} as const;

export type EmMasterEntity = keyof typeof emMastersEndpoints;

/* --------------------------------------------------------
   Admin endpoint registry
-------------------------------------------------------- */
export const adminMasterEndpoints = {
  /* MASTERS */
  continents: `${MASTER_BASE}/continents/`,
  countries: `${MASTER_BASE}/countries/`,
  bins: `${MASTER_BASE}/bins/`,
  states: `${MASTER_BASE}/states/`,
  districts: `${MASTER_BASE}/districts/`,
  cities: `${MASTER_BASE}/cities/`,
  zones: `${MASTER_BASE}/zones/`,
  wards: `${MASTER_BASE}/wards/`,
  sites: `${MASTER_BASE}/sites/`,
  plants: `${MASTER_BASE}/plants/`,

  /* ASSETS */
  fuels: `${ASSET_BASE}/fuels/`,
  properties: `${ASSET_BASE}/properties/`,
  subProperties: `${ASSET_BASE}/subproperties/`,

  /* SCREEN MANAGEMENT */
  mainScreenType: `${SCREEN_BASE}/mainscreentype/`,
  mainScreens: `${SCREEN_BASE}/mainscreens/`,
  userScreens: `${SCREEN_BASE}/userscreens/`,
  userScreenAction: `${SCREEN_BASE}/userscreen-action/`,
  userScreenPermissions: `${SCREEN_BASE}/userscreenpermissions/`,

  /* ROLE ASSIGNMENT */
  userTypes: `${ROLE_BASE}/user-type/`,
  staffUserTypes: `${ROLE_BASE}/staffusertypes/`,

  /* USER CREATION */
  userCreations: `${USER_BASE}/users-creation/`,
  staffCreation: `${USER_BASE}/staffcreation/`,

  /* CUSTOMERS */
  customerCreations: `${CUSTOMER_BASE}/customercreations/`,
  wasteCollections: `${CUSTOMER_BASE}/wastecollections/`,
  feedbacks: `${CUSTOMER_BASE}/feedbacks/`,
  complaints: `${CUSTOMER_BASE}/complaints/`,
  mainCategory: `${CUSTOMER_BASE}/main-category/`,
  subCategory: `${CUSTOMER_BASE}/sub-category/`,

  /* VEHICLES */
  vehicleTypes: `${VEHICLE_BASE}/vehicle-type/`,
  vehicleCreation: `${VEHICLE_BASE}/vehicle-creation/`,
} as const;

export type AdminEntity = keyof typeof adminMasterEndpoints;

/* --------------------------------------------------------
   Helpers
-------------------------------------------------------- */
export const getAdminEndpointPath = (entity: AdminEntity): string =>
  `/${adminMasterEndpoints[entity]}`;

export const getEmMasterEndpointPath = (entity: EmMasterEntity): string =>
  `/${emMastersEndpoints[entity]}`;
