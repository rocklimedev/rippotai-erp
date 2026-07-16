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

function buildSiteRecceFormData(payload) {
  const formData = new FormData();
  const { layoutAttachments = [], ...rest } = payload;

  const cleanedLayouts = layoutAttachments.map((layout) => {
    const { images = [], ...layoutRest } = layout;

    const cleanedImages = images.map((image) => {
      if (image.file instanceof File) {
        formData.append("layoutImages", image.file);
      }
      // Drop `file` (raw File, not JSON-safe) and `preview` (local blob
      // URL, meaningless server-side); keep only what the backend needs.
      return {
        id: image.id,
        caption: image.caption || "",
        sort_order: image.sort_order || 0,
      };
    });

    return { ...layoutRest, images: cleanedImages };
  });

  formData.append(
    "data",
    JSON.stringify({ ...rest, layoutAttachments: cleanedLayouts }),
  );

  return formData;
}

export const rekiApi = createApi({
  reducerPath: "rekiApi",
  baseQuery,
  tagTypes: ["SiteRecce"],

  endpoints: (builder) => ({
    // =====================================================
    // SITE RECCE
    // =====================================================

    createSiteRecce: builder.mutation({
      query: (payload) => ({
        url: "/site-recce",
        method: "POST",
        body: buildSiteRecceFormData(payload),
      }),
      invalidatesTags: ["SiteRecce"],
    }),

    getSiteRecces: builder.query({
      query: ({ projectId, status } = {}) => ({
        url: "/site-recce",
        method: "GET",
        params: {
          projectId,
          status,
        },
      }),
      providesTags: ["SiteRecce"],
    }),

    getSiteRecceById: builder.query({
      query: (id) => ({
        url: `/site-recce/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "SiteRecce", id }],
    }),

    updateSiteRecce: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-recce/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "SiteRecce",
        { type: "SiteRecce", id },
      ],
    }),

    updateSiteRecceStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/site-recce/${id}/status`,
        method: "PUT",
        body: {
          status,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "SiteRecce",
        { type: "SiteRecce", id },
      ],
    }),

    deleteSiteRecce: builder.mutation({
      query: (id) => ({
        url: `/site-recce/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SiteRecce"],
    }),

    // =====================================================
    // FLOORS
    // =====================================================

    addFloor: builder.mutation({
      query: ({ recceId, ...body }) => ({
        url: `/site-recce/${recceId}/floors`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { recceId }) => [
        "SiteRecce",
        { type: "SiteRecce", id: recceId },
      ],
    }),

    // =====================================================
    // ROOMS
    // =====================================================

    addRoom: builder.mutation({
      query: ({ floorId, ...body }) => ({
        url: `/site-recce/floors/${floorId}/rooms`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteRecce"],
    }),

    // =====================================================
    // LAYOUT ATTACHMENTS
    // =====================================================

    addLayoutAttachment: builder.mutation({
      query: ({ recceId, ...body }) => ({
        url: `/site-recce/${recceId}/layouts`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { recceId }) => [
        "SiteRecce",
        { type: "SiteRecce", id: recceId },
      ],
    }),
  }),
});

// =====================================================
// EXPORT HOOKS
// =====================================================

export const {
  useCreateSiteRecceMutation,

  useGetSiteReccesQuery,
  useLazyGetSiteReccesQuery,

  useGetSiteRecceByIdQuery,
  useLazyGetSiteRecceByIdQuery,

  useUpdateSiteRecceMutation,
  useUpdateSiteRecceStatusMutation,

  useDeleteSiteRecceMutation,

  useAddFloorMutation,
  useAddRoomMutation,
  useAddLayoutAttachmentMutation,
} = rekiApi;
