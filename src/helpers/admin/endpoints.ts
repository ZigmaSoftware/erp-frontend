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

/* --------------------------------------------------------
   Admin endpoint registry
-------------------------------------------------------- */
export const adminEndpoints = {
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
  mainscreentype: `${SCREEN_BASE}/mainscreentype/`,
  mainscreens: `${SCREEN_BASE}/mainscreens/`,
  userscreens: `${SCREEN_BASE}/userscreens/`,
  userscreenaction: `${SCREEN_BASE}/userscreen-action/`,
  userscreenpermissions: `${SCREEN_BASE}/userscreenpermissions/`,

  /* ROLE ASSIGNMENT */
  userTypes: `${ROLE_BASE}/user-type/`,
  staffUserTypes: `${ROLE_BASE}/staffusertypes/`,

  /* USER CREATION */
  usercreations: `${USER_BASE}/users-creation/`,
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

export type AdminEntity = keyof typeof adminEndpoints;

export const getAdminEndpointPath = (entity: AdminEntity): string => {
  return `/${adminEndpoints[entity]}`;
};
