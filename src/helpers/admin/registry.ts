import {
  adminMasterEndpoints,
  emMastersEndpoints,
  type AdminEntity,
  type EmMasterEntity,
} from "./endpoints";
import { createCrudHelpers, type CrudHelpers } from "./crudHelpers";

/* -----------------------------------------
   Admin API Registry
----------------------------------------- */
type AdminApiRegistry = {
  [K in AdminEntity]: CrudHelpers;
};

export const adminApi: AdminApiRegistry = Object.entries(
  adminMasterEndpoints
).reduce((map, [key, path]) => {
  map[key as AdminEntity] = createCrudHelpers(path);
  return map;
}, {} as AdminApiRegistry);

export const getAdminApi = (entity: AdminEntity) => adminApi[entity];

/* -----------------------------------------
   EM Masters API Registry 
----------------------------------------- */
type EmMasterApiRegistry = {
  [K in EmMasterEntity]: CrudHelpers;
};

export const emMasterApi: EmMasterApiRegistry = Object.entries(
  emMastersEndpoints
).reduce((map, [key, path]) => {
  map[key as EmMasterEntity] = createCrudHelpers(path);
  return map;
}, {} as EmMasterApiRegistry);

export const getEmMasterApi = (entity: EmMasterEntity) =>
  emMasterApi[entity];
