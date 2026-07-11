export const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://erp-api.rippotaiarchitecture.com/api/v1"
    : "http://localhost:5000/api/v1";

export const BACKEND =
  process.env.NODE_ENV === "production"
    ? "https://erp-api.rippotaiarchitecture.com/api/v1"
    : "http://localhost:5000/api/v1";
