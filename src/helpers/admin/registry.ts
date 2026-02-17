import {
  commonMasterEndpoints,
  emMastersEndpoints,
  adminMasterEndpoints,

  getCommonMasterEndpointPath,
  getEmMasterEndpointPath,
  getAdminMasterEndpointPath,

  type CommonMasterEntity,
  type EmMasterEntity,
  type AdminMasterEntity
} from "./endpoints";

import { createCrudHelpers, type CrudHelpers } from "./crudHelpers";

/* ========================================================
   COMMON MASTER API REGISTRY
======================================================== */

type CommonMasterApiRegistry = {
  [K in CommonMasterEntity]: CrudHelpers;
};

export const commonMasterApi: CommonMasterApiRegistry =
  (Object.keys(commonMasterEndpoints) as CommonMasterEntity[]).reduce(
    (map, key) => {
      map[key] = createCrudHelpers(
        getCommonMasterEndpointPath(key)
      );
      return map;
    },
    {} as CommonMasterApiRegistry
  );

export const getCommonMasterApi = (entity: CommonMasterEntity) =>
  commonMasterApi[entity];


/* ========================================================
   EM MASTER API REGISTRY
======================================================== */

type EmMasterApiRegistry = {
  [K in EmMasterEntity]: CrudHelpers;
};

export const emMasterApi: EmMasterApiRegistry =
  (Object.keys(emMastersEndpoints) as EmMasterEntity[]).reduce(
    (map, key) => {
      map[key] = createCrudHelpers(
        getEmMasterEndpointPath(key)
      );
      return map;
    },
    {} as EmMasterApiRegistry
  );

export const getEmMasterApi = (entity: EmMasterEntity) =>
  emMasterApi[entity];


/* ========================================================
   ADMIN MASTER API REGISTRY
======================================================== */

type AdminMasterApiRegistry = {
  [K in AdminMasterEntity]: CrudHelpers;
};

export const adminMasterApi: AdminMasterApiRegistry =
  (Object.keys(adminMasterEndpoints) as AdminMasterEntity[]).reduce(
    (map, key) => {
      map[key] = createCrudHelpers(
        getAdminMasterEndpointPath(key)
      );
      return map;
    },
    {} as AdminMasterApiRegistry
  );

export const getAdminMasterApi = (entity: AdminMasterEntity) =>
  adminMasterApi[entity];
