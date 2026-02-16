import axios, { type AxiosInstance } from "axios";

/* --------------------------------------------------------
   ENV
-------------------------------------------------------- */
const IS_PROD = import.meta.env.VITE_PROD === "true";

const AUTH_ROOT =
  (IS_PROD
    ? import.meta.env.VITE_API_AUTH_PROD
    : import.meta.env.VITE_API_AUTH) ??
  import.meta.env.VITE_API_AUTH ??
  (import.meta.env.VITE_API_LOGIN
    ? import.meta.env.VITE_API_LOGIN.replace(/\/login\/?$/, "/")
    : "");

/* --------------------------------------------------------
   CREATE AXIOS INSTANCE
-------------------------------------------------------- */
const authApi: AxiosInstance = axios.create({
  baseURL: AUTH_ROOT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* --------------------------------------------------------
   AUTH INTERCEPTOR
-------------------------------------------------------- */
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default authApi;
