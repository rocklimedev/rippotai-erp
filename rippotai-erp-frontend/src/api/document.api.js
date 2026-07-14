import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL, // change to your backend URL
  credentials: "include", // IMPORTANT for cookie-based auth
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
});
export const documentApi = createApi({
  reducerPath: "documentApi",
  baseQuery,
  tagTypes: ["Documents"],
  endpoints: (builder) => ({
    getDocuments: builder.query({
      query: ({ q, category, project_id } = {}) => {
        const params = new URLSearchParams();

        if (q) params.append("q", q);
        if (category) params.append("category", category);
        if (project_id) params.append("project_id", project_id);

        return `/documents?${params.toString()}`;
      },
      providesTags: ["Documents"],
    }),

    createDocument: builder.mutation({
      query: ({ data, file }) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value);
        });

        if (file) {
          formData.append("file", file);
        }

        return {
          url: "/documents",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Documents"],
    }),

    updateDocument: builder.mutation({
      query: ({ id, data }) => ({
        url: `/documents/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Documents"],
    }),

    replaceDocumentFile: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/documents/${id}/replace`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Documents"],
    }),

    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Documents"],
    }),

    lockDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}/lock`,
        method: "POST",
      }),
      invalidatesTags: ["Documents"],
    }),

    unlockDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}/unlock`,
        method: "POST",
      }),
      invalidatesTags: ["Documents"],
    }),

    downloadDocument: builder.query({
      query: (id) => ({
        url: `/documents/${id}/download`,
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    downloadAttachment: builder.query({
      query: ({ id, attachmentId }) => ({
        url: `/documents/${id}/attachments/${attachmentId}`,
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    getDocumentReki: builder.query({
      query: (id) => `/documents/${id}/reki`,
    }),

    createProjectBrief: builder.mutation({
      query: (data) => ({
        url: "/documents/forms/project-brief",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Documents"],
    }),

    createSiteReki: builder.mutation({
      query: (data) => ({
        url: "/documents/forms/site-reki",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Documents"],
    }),

    getDocumentsWorkspace: builder.query({
      query: (projectId) => `/projects/${projectId}/documents-workspace`,
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
  useDeleteDocumentMutation,
  useLockDocumentMutation,
  useUnlockDocumentMutation,
  useLazyDownloadDocumentQuery,
  useLazyDownloadAttachmentQuery,
  useGetDocumentRekiQuery,
  useCreateProjectBriefMutation,
  useCreateSiteRekiMutation,
  useGetDocumentsWorkspaceQuery,
} = documentApi;
