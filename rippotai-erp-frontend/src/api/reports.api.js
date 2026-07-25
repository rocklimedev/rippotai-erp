import { baseApi } from "../store/baseApi";

export const reportsApi = baseApi.injectEndpoints({
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
  overrideExisting: false,
});

// Export hooks
export const {
  useGetReportsOverviewQuery,
  useGetReportsByProjectQuery,
  useGetReportsByVendorQuery,
  useGetReportsByStatusQuery,
  useGetReportsByEmployeeQuery,
} = reportsApi;
