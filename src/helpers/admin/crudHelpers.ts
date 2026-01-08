import type { AxiosRequestConfig } from "axios";
import api from "@/api";

/* -----------------------------------------
   Normalize API path (idempotent)
----------------------------------------- */
const normalizePath = (path: string): string => {
  const cleaned = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return `/${cleaned}/`;
};

/* -----------------------------------------
   CRUD + Custom Helpers
----------------------------------------- */
export type CrudHelpers<T = any> = {
  list: (config?: AxiosRequestConfig) => Promise<T[]>;
  get: (path: string | number, config?: AxiosRequestConfig) => Promise<T>;
  create: <P = unknown>(payload: P, config?: AxiosRequestConfig) => Promise<T>;
  update: <P = unknown>(
    id: string | number,
    payload: P,
    config?: AxiosRequestConfig
  ) => Promise<T>;
  remove: (id: string | number, config?: AxiosRequestConfig) => Promise<void>;
  action: <R = any, P = any>(
    action: string,
    payload?: P,
    config?: AxiosRequestConfig
  ) => Promise<R>;
};

/* -----------------------------------------
   Factory
----------------------------------------- */
export const createCrudHelpers = <T = any>(
  basePath: string
): CrudHelpers<T> => {
  const resource = normalizePath(basePath);

  return {
    list: async (config) => {
      const { data } = await api.get<T[]>(resource, config);
      return data;
    },

    get: async (path, config) => {
      const isRaw =
        typeof path === "string" &&
        (path.includes("/") || path.includes("?"));

      const url = isRaw
        ? `${resource}${path}`
        : `${resource}${path}/`;

      const { data } = await api.get<T>(url, config);
      return data;
    },

    create: async (payload, config) => {
      const { data } = await api.post<T>(resource, payload, config);
      return data;
    },

    update: async (id, payload, config) => {
      const { data } = await api.patch<T>(
        `${resource}${id}/`,
        payload,
        config
      );
      return data;
    },

    remove: async (id, config) => {
      await api.delete(`${resource}${id}/`, config);
    },

    action: async (action, payload, config) => {
      const cleanAction = action.replace(/^\/+/, "");
      const url = `${resource}${cleanAction}${
        cleanAction.endsWith("/") ? "" : "/"
      }`;

      if (payload) {
        const { data } = await api.post(url, payload, config);
        return data;
      }

      const { data } = await api.get(url, config);
      return data;
    },
  };
};
