const rawBackend = import.meta.env.VITE_BACKEND_URL?.trim();
// "/" = same origin (local server proxies /api to the backend; used for shared links).
const configuredBackend =
  rawBackend === '/' && typeof window !== 'undefined' ? window.location.origin : rawBackend;
const backendOrigin = (
  configuredBackend ||
  (import.meta.env.PROD ? 'https://erp-api.rippotaiarchitecture.com' : 'http://localhost:5000')
)
  .replace(/\/+$/, '')
  .replace(/\/api(?:\/v1)?$/, '');

export const API_BASE_URL = `${backendOrigin}/api`;
export const API_URL = `${API_BASE_URL}/v1`;
export const BACKEND = API_URL;
