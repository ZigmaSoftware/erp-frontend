import type { AxiosInstance } from "axios";
import { desktopApi, mobileApi } from "./index";

const LOGIN_ENDPOINT = import.meta.env.VITE_API_LOGIN;

const attachAuthInterceptor = (api: AxiosInstance) => {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("access_token");

      // Robust login detection
      const isLoginRequest =
        (LOGIN_ENDPOINT && config.url?.startsWith(LOGIN_ENDPOINT)) ||
        config.url?.includes("/auth/login") ||
        config.url?.includes("login-user");

      if (token && !isLoginRequest) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Attach once per instance
attachAuthInterceptor(desktopApi);
attachAuthInterceptor(mobileApi);
