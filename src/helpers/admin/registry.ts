import {
  commonMasterEndpoints,
  emMastersEndpoints,
  adminMasterEndpoints,
  salesMasterEndpoints,
  salesServiceEndpoints,
  salesTransactionEndpoints,
  salesReportEndpoints,

  getCommonMasterEndpointPath,
  getEmMasterEndpointPath,
  getAdminMasterEndpointPath,
  getSalesMasterEndpointPath,
  getSalesServiceEndpointPath,
  getSalesTransactionEndpointPath,

  type CommonMasterEntity,
  type EmMasterEntity,
  type AdminMasterEntity,
  type SalesMasterEntity,
  type SalesServiceEntity,
  type SalesTransactionEntity,
  type SalesReportEntity
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


/* ========================================================
   SALES MASTER API REGISTRY
======================================================== */

type SalesMasterApiRegistry = {
  [K in SalesMasterEntity]: CrudHelpers;
};

export const salesMasterApi: SalesMasterApiRegistry =
  (Object.keys(salesMasterEndpoints) as SalesMasterEntity[]).reduce(
    (map, key) => {
      map[key] = createCrudHelpers(
        getSalesMasterEndpointPath(key)
      );
      return map;
    },
    {} as SalesMasterApiRegistry
  );

export const getSalesMasterApi = (entity: SalesMasterEntity) =>
  salesMasterApi[entity];


/* ========================================================
   SALES SERVICE API REGISTRY
   (standalone sales_service microservice)
======================================================== */

type SalesServiceApiRegistry = {
  [K in SalesServiceEntity]: CrudHelpers;
};

export const salesServiceApi: SalesServiceApiRegistry =
  (Object.keys(salesServiceEndpoints) as SalesServiceEntity[]).reduce(
    (map, key) => {
      map[key] = createCrudHelpers(
        getSalesServiceEndpointPath(key)
      );
      return map;
    },
    {} as SalesServiceApiRegistry
  );

export const getSalesServiceApi = (entity: SalesServiceEntity) =>
  salesServiceApi[entity];


/* ========================================================
   SALES TRANSACTION API REGISTRY
   (Phase 3+4 transaction modules in sales_service)
======================================================== */

type SalesTransactionApiRegistry = {
  [K in SalesTransactionEntity]: CrudHelpers;
};

export const salesTransactionApi: SalesTransactionApiRegistry =
  (Object.keys(salesTransactionEndpoints) as SalesTransactionEntity[]).reduce(
    (map, key) => {
      map[key] = createCrudHelpers(
        getSalesTransactionEndpointPath(key)
      );
      return map;
    },
    {} as SalesTransactionApiRegistry
  );

export const getSalesTransactionApi = (entity: SalesTransactionEntity) =>
  salesTransactionApi[entity];


/* ========================================================
   SALES REPORT API REGISTRY
   (Phase C report endpoints in sales_service)
======================================================== */

type SalesReportApiRegistry = {
  [K in SalesReportEntity]: CrudHelpers;
};

export const salesReportApi: SalesReportApiRegistry =
  (Object.keys(salesReportEndpoints) as SalesReportEntity[]).reduce(
    (map, key) => {
      map[key] = createCrudHelpers(
        `${salesReportEndpoints[key]}`
      );
      return map;
    },
    {} as SalesReportApiRegistry
  );
