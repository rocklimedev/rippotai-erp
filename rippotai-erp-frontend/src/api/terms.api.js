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

export const termsApi = createApi({
  reducerPath: "termsApi",
  baseQuery,
  tagTypes: ["TermsTemplates", "TermsVersions"],
  endpoints: (builder) => ({
    // ==========================================================
    // GET ALL TEMPLATES
    // ==========================================================
    getTermsTemplates: builder.query({
      query: (scope) => ({
        url: "/terms-templates",
        method: "GET",
        params: scope ? { scope } : undefined,
      }),
      providesTags: ["TermsTemplates"],
    }),

    // ==========================================================
    // GET SINGLE TEMPLATE
    // ==========================================================
    getTermsTemplate: builder.query({
      query: (id) => ({
        url: `/terms-templates/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "TermsTemplates", id }],
    }),

    // ==========================================================
    // GET TEMPLATE VERSIONS
    // ==========================================================
    getTermsTemplateVersions: builder.query({
      query: (id) => ({
        url: `/terms-templates/${id}/versions`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "TermsVersions", id }],
    }),

    // ==========================================================
    // CREATE TEMPLATE
    // ==========================================================
    createTermsTemplate: builder.mutation({
      query: (body) => ({
        url: "/terms-templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TermsTemplates"],
    }),

    // ==========================================================
    // UPDATE TEMPLATE DETAILS
    // ==========================================================
    updateTermsTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/terms-templates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "TermsTemplates",
        { type: "TermsTemplates", id },
      ],
    }),

    // ==========================================================
    // UPDATE TEMPLATE CONTENT (Creates Version)
    // ==========================================================
    updateTermsTemplateContent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/terms-templates/${id}/content`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "TermsTemplates",
        { type: "TermsTemplates", id },
        { type: "TermsVersions", id },
      ],
    }),

    // ==========================================================
    // DELETE TEMPLATE
    // ==========================================================
    deleteTermsTemplate: builder.mutation({
      query: (id) => ({
        url: `/terms-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TermsTemplates"],
    }),
  }),
});

export const {
  useGetTermsTemplatesQuery,
  useGetTermsTemplateQuery,
  useGetTermsTemplateVersionsQuery,
  useCreateTermsTemplateMutation,
  useUpdateTermsTemplateMutation,
  useUpdateTermsTemplateContentMutation,
  useDeleteTermsTemplateMutation,
} = termsApi;
