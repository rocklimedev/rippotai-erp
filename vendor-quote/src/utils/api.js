import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Format API error detail
export function formatApiError(error) {
  const detail = error?.response?.data?.detail;
  if (!detail) return error?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

// Response interceptor for 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        return api(error.config);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
