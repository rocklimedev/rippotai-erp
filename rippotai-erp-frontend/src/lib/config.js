const configuredBackend = import.meta.env.VITE_BACKEND_URL?.trim();
const backendOrigin = (configuredBackend ||
  (import.meta.env.PROD
    ? "https://erp-api.rippotaiarchitecture.com"
    : "http://localhost:5000"))
  .replace(/\/+$/, "")
  .replace(/\/api(?:\/v1)?$/, "");

export const API_BASE_URL = `${backendOrigin}/api`;
export const API_URL = `${API_BASE_URL}/v1`;
export const BACKEND = API_URL;
