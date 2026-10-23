import { authenticatedFetch } from './http-client';
import { resolveExportResponse } from './export-fetch';
import axios from "axios";
import { API_BASE_URL } from "./config";

export const API = API_BASE_URL;

const api = axios.create({
  baseURL: API,
  adapter: 'fetch',
  env: { fetch: authenticatedFetch },
  withCredentials: false,
});

api.interceptors.response.use(
  async (response) => {
    if (response.status === 202) {
      const initial = new Response(response.data instanceof Blob ? response.data : JSON.stringify(response.data), { status: 202 });
      const descriptor = await initial.clone().json().catch(() => null);
      if (descriptor?.jobId) {
        const result = await resolveExportResponse(initial, {
          headers: response.config.headers?.toJSON?.() || response.config.headers,
          signal: response.config.signal,
        });
        response.data = response.config.responseType === "blob" ? await result.blob() : await result.json();
        response.headers = Object.fromEntries(result.headers);
        response.status = result.status;
      }
    }
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
