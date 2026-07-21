import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("bc_token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const cdnToken = import.meta.env.VITE_CDN_TOKEN;

    if (cdnToken) {
      headers.set("x-cdn-secret", cdnToken);
    }

    return headers;
  },
});

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery,
  tagTypes: ["Search"],

  endpoints: (builder) => ({
    // =====================================================
    // GLOBAL SEARCH
    // =====================================================

    globalSearch: builder.query({
      query: (q) => ({
        url: "/search",
        params: { q },
      }),
      providesTags: ["Search"],
    }),

    // =====================================================
    // INDIVIDUAL SEARCH
    // =====================================================

    searchBoqs: builder.query({
      query: (q) => ({
        url: "/search/boqs",
        params: { q },
      }),
    }),

    searchBriefs: builder.query({
      query: (q) => ({
        url: "/search/briefs",
        params: { q },
      }),
    }),

    searchCalendar: builder.query({
      query: (q) => ({
        url: "/search/calendar",
        params: { q },
      }),
    }),

    searchClients: builder.query({
      query: (q) => ({
        url: "/search/clients",
        params: { q },
      }),
    }),

    searchLeads: builder.query({
      query: (q) => ({
        url: "/search/leads",
        params: { q },
      }),
    }),

    searchProjects: builder.query({
      query: (q) => ({
        url: "/search/projects",
        params: { q },
      }),
    }),

    searchQuotations: builder.query({
      query: (q) => ({
        url: "/search/quotations",
        params: { q },
      }),
    }),

    searchSiteRecce: builder.query({
      query: (q) => ({
        url: "/search/site-recce",
        params: { q },
      }),
    }),

    searchTasks: builder.query({
      query: (q) => ({
        url: "/search/tasks",
        params: { q },
      }),
    }),

    searchUsers: builder.query({
      query: (q) => ({
        url: "/search/users",
        params: { q },
      }),
    }),

    searchVendors: builder.query({
      query: (q) => ({
        url: "/search/vendors",
        params: { q },
      }),
    }),

    // =====================================================
    // REINDEX
    // =====================================================

    reindexAll: builder.mutation({
      query: () => ({
        url: "/search/reindex/all",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexBoqs: builder.mutation({
      query: () => ({
        url: "/search/reindex/boqs",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexBriefs: builder.mutation({
      query: () => ({
        url: "/search/reindex/briefs",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexCalendar: builder.mutation({
      query: () => ({
        url: "/search/reindex/calendar",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexClients: builder.mutation({
      query: () => ({
        url: "/search/reindex/clients",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexLeads: builder.mutation({
      query: () => ({
        url: "/search/reindex/leads",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexProjects: builder.mutation({
      query: () => ({
        url: "/search/reindex/projects",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexQuotations: builder.mutation({
      query: () => ({
        url: "/search/reindex/quotations",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexSiteRecce: builder.mutation({
      query: () => ({
        url: "/search/reindex/site-recce",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexTasks: builder.mutation({
      query: () => ({
        url: "/search/reindex/tasks",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexUsers: builder.mutation({
      query: () => ({
        url: "/search/reindex/users",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),

    reindexVendors: builder.mutation({
      query: () => ({
        url: "/search/reindex/vendors",
        method: "POST",
      }),
      invalidatesTags: ["Search"],
    }),
  }),
});

export const {
  // Global
  useGlobalSearchQuery,

  // Search
  useSearchBoqsQuery,
  useSearchBriefsQuery,
  useSearchCalendarQuery,
  useSearchClientsQuery,
  useSearchLeadsQuery,
  useSearchProjectsQuery,
  useSearchQuotationsQuery,
  useSearchSiteRecceQuery,
  useSearchTasksQuery,
  useSearchUsersQuery,
  useSearchVendorsQuery,

  // Reindex
  useReindexAllMutation,
  useReindexBoqsMutation,
  useReindexBriefsMutation,
  useReindexCalendarMutation,
  useReindexClientsMutation,
  useReindexLeadsMutation,
  useReindexProjectsMutation,
  useReindexQuotationsMutation,
  useReindexSiteRecceMutation,
  useReindexTasksMutation,
  useReindexUsersMutation,
  useReindexVendorsMutation,
} = searchApi;
