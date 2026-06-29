import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token"); // Your token key

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const cdnToken = import.meta.env.VITE_CDN_TOKEN;
      if (cdnToken) {
        headers.set("x-cdn-secret", cdnToken);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Overview
    getReportsOverview: builder.query({
      query: () => "/reports/overview",
    }),

    // By Project
    getReportsByProject: builder.query({
      query: () => "/reports/by-project",
    }),

    // By Vendor
    getReportsByVendor: builder.query({
      query: () => "/reports/by-vendor",
    }),

    // By Status
    getReportsByStatus: builder.query({
      query: () => "/reports/by-status",
    }),

    // By Employee (Admin only)
    getReportsByEmployee: builder.query({
      query: () => "/reports/by-employee",
    }),
  }),
});

// Export hooks
export const {
  useGetReportsOverviewQuery,
  useGetReportsByProjectQuery,
  useGetReportsByVendorQuery,
  useGetReportsByStatusQuery,
  useGetReportsByEmployeeQuery,
} = reportsApi;
