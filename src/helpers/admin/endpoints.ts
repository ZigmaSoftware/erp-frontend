/* ========================================================
    API BASE CONFIG
======================================================== */
const API_BASE = "api";

/* Services */
const AUTH_SERVICE = "auth-service";
const MASTER_SERVICE = "master-service";

/* Apps */
const AUTH_APP = "auth";
const MASTER_APP = "masters";
const EM_APP = "em-masters";

/* Sub Modules */
const SCREEN_BASE = "screen-management";
const ROLE_BASE = "role-assign";

/* Version */

const CURRENT_VERSION = "v1";

/* ========================================================
    SERVICE BASE URL REGISTRY (From .env)
======================================================== */
const SERVICE_BASE_URLS: Record<string, string> = {
  [MASTER_SERVICE]: import.meta.env.VITE_API_MASTERSERVICE,
  [AUTH_SERVICE]: import.meta.env.VITE_API_AUTHSERVICE,
};

/* ========================================================
    SMART URL BUILDER
   - Detects service automatically
   - Attaches correct port
   - Returns FULL URL
======================================================== */
const buildUrl = (path: string): string => {
  const [service] = path.split("/");

  const baseUrl = SERVICE_BASE_URLS[service];

  if (!baseUrl) {
    throw new Error(`Base URL not configured for service: ${service}`);
  }

  return `${baseUrl}${API_BASE}/${path}`;
};

/* ========================================================
    EM MASTER ENDPOINTS
======================================================== */
export const emMastersEndpoints = {
  equipmentTypes: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/equipment-types/`,
  equipmentModels: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/equipment-models/`,
  contractorModels: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/contractor-models/`,
  vehicleSuppliers: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/vehicle-suppliers/`,
} as const;

export type EmMasterEntity = keyof typeof emMastersEndpoints;

/* ========================================================
    COMMON MASTER ENDPOINTS
======================================================== */
export const commonMasterEndpoints = {
  continents: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/continents/`,
  countries: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/countries/`,
  states: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/states/`,
  districts: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/districts/`,
  cities: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/cities/`,
  sites: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/sites/`,
  plants: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/plants/`,
  bins: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/bins/`,
  zones: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/zones/`,
  wards: `${MASTER_SERVICE}/${CURRENT_VERSION}/${MASTER_APP}/wards/`,
  fuels: `${MASTER_SERVICE}/${CURRENT_VERSION}/assets/fuels/`,
  properties: `${MASTER_SERVICE}/${CURRENT_VERSION}/assets/properties/`,
  subProperties: `${MASTER_SERVICE}/${CURRENT_VERSION}/assets/subproperties/`,
  customerCreations: `${MASTER_SERVICE}/${CURRENT_VERSION}/customers/customercreations/`,
  wasteCollections: `${MASTER_SERVICE}/${CURRENT_VERSION}/customers/wastecollections/`,
  feedbacks: `${MASTER_SERVICE}/${CURRENT_VERSION}/customers/feedbacks/`,
  complaints: `${MASTER_SERVICE}/${CURRENT_VERSION}/customers/complaints/`,
  mainCategory: `${MASTER_SERVICE}/${CURRENT_VERSION}/customers/main-category/`,
  subCategory: `${MASTER_SERVICE}/${CURRENT_VERSION}/customers/sub-category/`,
  vehicleTypes: `${MASTER_SERVICE}/${CURRENT_VERSION}/vehicles/vehicle-type/`,
  vehicleCreation: `${MASTER_SERVICE}/${CURRENT_VERSION}/vehicles/vehicle-creation/`,
} as const;

export type CommonMasterEntity = keyof typeof commonMasterEndpoints;

/* ========================================================
    ADMIN MASTER ENDPOINTS
======================================================== */
export const adminMasterEndpoints = {
  mainScreenType: `${AUTH_SERVICE}/${CURRENT_VERSION}/${SCREEN_BASE}/mainscreentype/`,
  userScreenAction: `${AUTH_SERVICE}/${CURRENT_VERSION}/${SCREEN_BASE}/userscreen-action/`,
  mainScreens: `${AUTH_SERVICE}/${CURRENT_VERSION}/${SCREEN_BASE}/mainscreens/`,
  userScreens: `${AUTH_SERVICE}/${CURRENT_VERSION}/${SCREEN_BASE}/userscreens/`,
  userScreenPermissions: `${AUTH_SERVICE}/${CURRENT_VERSION}/${SCREEN_BASE}/userscreenpermissions/`,
  staffUserTypes: `${AUTH_SERVICE}/${CURRENT_VERSION}/${ROLE_BASE}/staffusertypes/`,
  userTypes: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/user-role/`,
  userCreations: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/user-creation/`,
  login: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/login/`,
  generateRefresh:`${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/refresh/`,
} as const;

export type AdminMasterEntity = keyof typeof adminMasterEndpoints;

/* ========================================================
    PUBLIC HELPERS
======================================================== */
export const getCommonMasterEndpointPath = (
  entity: CommonMasterEntity
): string => buildUrl(commonMasterEndpoints[entity]);

export const getAdminMasterEndpointPath = (
  entity: AdminMasterEntity
): string => buildUrl(adminMasterEndpoints[entity]);

export const getEmMasterEndpointPath = (
  entity: EmMasterEntity
): string => buildUrl(emMastersEndpoints[entity]);
