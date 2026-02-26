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
  vehicleRequest: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/vehicle-requests/`,
  vehicleCreations: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/vehicle-creations`,
  machineryHires: `${MASTER_SERVICE}/${CURRENT_VERSION}/${EM_APP}/machinery-hires`
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
} as const;

export type CommonMasterEntity = keyof typeof commonMasterEndpoints;

/* ========================================================
    ADMIN MASTER ENDPOINTS
======================================================== */
export const adminMasterEndpoints = {
  userTypes: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/user-role/`,
  permissions: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/permissions/`,
  userCreations: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/user-creation/`,
  groupPermissions: `${AUTH_SERVICE}/${CURRENT_VERSION}/${AUTH_APP}/group-permission/`,
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
