import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    try {
      const method = (response.config?.method || "get").toLowerCase();
      if (method !== "get") {
        window.dispatchEvent(
          new CustomEvent("bc:dashboard-refresh", {
            detail: {
              url: response.config?.url,
              method,
            },
          }),
        );
      }
    } catch {}

    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      const path = window.location.pathname;

      if (path !== "/login" && path !== "/register") {
        localStorage.removeItem("bc_token");
        localStorage.removeItem("bc_user");
        window.location.href = "/login";
      }
    }

    if (error?.response?.status === 402) {
      try {
        window.dispatchEvent(
          new CustomEvent("inos:upgrade-required", {
            detail: {
              message:
                error.response?.data?.detail ||
                "Upgrade to unlock this feature.",
            },
          }),
        );
      } catch {}
    }

    return Promise.reject(error);
  },
);

export default api;
