import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
export const boqApi = createApi({
  reducerPath: "boqApi",

  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include", // Remove if using Bearer token
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("bc_token"); // aligned with AuthContext
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

  tagTypes: ["BOQ", "BOQ_TEMPLATE", "BOQ_ACTIVITY", "LIBRARY"],

  endpoints: (builder) => ({
    // ==========================
    // BOQ
    // ==========================

    getBoqs: builder.query({
      query: (projectId) => ({
        url: "/boqs",
        params: projectId ? { project_id: projectId } : {},
      }),
      providesTags: ["BOQ"],
    }),

    getBoqById: builder.query({
      query: (id) => `/boqs/${id}`,
      providesTags: (result, error, id) => [{ type: "BOQ", id }],
    }),

    createBoq: builder.mutation({
      query: (body) => ({
        url: "/boqs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BOQ"],
    }),

    updateBoq: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/boqs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BOQ"],
    }),

    deleteBoq: builder.mutation({
      query: (id) => ({
        url: `/boqs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ"],
    }),

    // ==========================
    // BOQ Categories
    // ==========================

    addBoqCategory: builder.mutation({
      query: ({ boqId, ...body }) => ({
        url: `/boqs/${boqId}/categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BOQ"],
    }),

    updateBoqCategory: builder.mutation({
      query: ({ boqId, categoryId, ...body }) => ({
        url: `/boqs/${boqId}/categories/${categoryId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BOQ"],
    }),

    deleteBoqCategory: builder.mutation({
      query: ({ boqId, categoryId }) => ({
        url: `/boqs/${boqId}/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ"],
    }),

    // ==========================
    // BOQ Items
    // ==========================

    addBoqItem: builder.mutation({
      query: ({ boqId, ...body }) => ({
        url: `/boqs/${boqId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BOQ"],
    }),

    updateBoqItem: builder.mutation({
      query: ({ boqId, itemId, ...body }) => ({
        url: `/boqs/${boqId}/items/${itemId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BOQ"],
    }),

    deleteBoqItem: builder.mutation({
      query: ({ boqId, itemId }) => ({
        url: `/boqs/${boqId}/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ"],
    }),

    // ==========================
    // Templates
    // ==========================

    getTemplates: builder.query({
      query: () => "/boq/templates",
      providesTags: ["BOQ_TEMPLATE"],
    }),

    getTemplateById: builder.query({
      query: (id) => `/boq/templates/${id}`,
      providesTags: ["BOQ_TEMPLATE"],
    }),

    createTemplate: builder.mutation({
      query: (body) => ({
        url: "/boq/templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    updateTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/boq/templates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: `/boq/templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ_TEMPLATE"],
    }),

    // ==========================
    // Activity
    // ==========================

    getActivity: builder.query({
      query: (params) => ({
        url: "/boq/activity",
        params,
      }),
      providesTags: ["BOQ_ACTIVITY"],
    }),

    // ==========================
    // Library
    // ==========================

    getLibraryCategories: builder.query({
      query: () => "/library/categories",
      providesTags: ["LIBRARY"],
    }),

    createLibraryCategory: builder.mutation({
      query: (body) => ({
        url: "/library/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LIBRARY"],
    }),

    getLibraryItems: builder.query({
      query: (params) => ({
        url: "/library/items",
        params,
      }),
      providesTags: ["LIBRARY"],
    }),

    getLibraryItem: builder.query({
      query: (id) => `/library/items/${id}`,
      providesTags: ["LIBRARY"],
    }),

    createLibraryItem: builder.mutation({
      query: (body) => ({
        url: "/library/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LIBRARY"],
    }),

    updateLibraryItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/library/items/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["LIBRARY"],
    }),

    deleteLibraryItem: builder.mutation({
      query: (id) => ({
        url: `/library/items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LIBRARY"],
    }),
  }),
});

export const {
  useGetBoqsQuery,
  useGetBoqByIdQuery,
  useCreateBoqMutation,
  useUpdateBoqMutation,
  useDeleteBoqMutation,

  useAddBoqCategoryMutation,
  useUpdateBoqCategoryMutation,
  useDeleteBoqCategoryMutation,

  useAddBoqItemMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,

  useGetTemplatesQuery,
  useGetTemplateByIdQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,

  useGetActivityQuery,

  useGetLibraryCategoriesQuery,
  useCreateLibraryCategoryMutation,
  useGetLibraryItemsQuery,
  useGetLibraryItemQuery,
  useCreateLibraryItemMutation,
  useUpdateLibraryItemMutation,
  useDeleteLibraryItemMutation,
} = boqApi;
