import axios, { type AxiosInstance } from "axios";

/* --------------------------------------------------------
   ENV
-------------------------------------------------------- */
const IS_PROD = import.meta.env.VITE_PROD === "true";

const API_ROOT = IS_PROD
  ? import.meta.env.VITE_API_PROD
  : import.meta.env.VITE_API_MASTERSERVICE;

const LOGIN_ENDPOINT = import.meta.env.VITE_API_LOGIN;

/* --------------------------------------------------------
   CREATE AXIOS INSTANCE
-------------------------------------------------------- */
const api: AxiosInstance = axios.create({
  baseURL: API_ROOT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* --------------------------------------------------------
   AUTH INTERCEPTOR (SINGLE, CLEAN)
-------------------------------------------------------- */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  const isLoginRequest =
    config.url &&
    LOGIN_ENDPOINT &&
    config.url.startsWith(LOGIN_ENDPOINT);

  if (token && !isLoginRequest) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
