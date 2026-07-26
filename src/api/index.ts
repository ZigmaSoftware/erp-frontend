import axios, { type AxiosInstance } from "axios";

/* --------------------------------------------------------
   ENV
-------------------------------------------------------- */
const IS_PROD = import.meta.env.VITE_PROD === "true";

const API_ROOT = IS_PROD
  ? import.meta.env.VITE_API_PROD
  : import.meta.env.VITE_API_MASTERSERVICE;

const LOGIN_ENDPOINT = import.meta.env.VITE_API_LOGIN;
const REFRESH_ENDPOINT = `${String(import.meta.env.VITE_API_AUTHSERVICE || "").replace(/\/+$/, "")}/api/auth-service/v1/auth/refresh/`;

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

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken || !REFRESH_ENDPOINT.startsWith("http")) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(REFRESH_ENDPOINT, { refresh_token: refreshToken })
      .then(({ data }) => {
        if (!data?.access_token) {
          return null;
        }

        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        return data.access_token as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    if (
      error?.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh/") ||
      originalRequest.url?.startsWith(LOGIN_ENDPOINT)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const accessToken = await refreshAccessToken();

    if (!accessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return api(originalRequest);
  }
);

export default api;
