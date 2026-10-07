import { baseApi } from "@/store/baseApi";

const downloadResponse = async (response) => {
  if (!response.ok) return response.json();
  const filename =
    response.headers
      .get("Content-Disposition")
      ?.match(/filename="([^"]+)"/)?.[1] || "admin-dpr.xlsx";
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { downloaded: true };
};

export const adminDprApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAdminDprDocuments: builder.query({
      query: (params) => ({ url: "/dpr/admin-documents", params }),
      providesTags: ["AdminDpr"],
    }),
    getAdminDprDocument: builder.query({
      query: (id) => `/dpr/admin-documents/${id}`,
      providesTags: ["AdminDpr"],
    }),
    createAdminDprDocument: builder.mutation({
      query: (body) => ({ url: "/dpr/admin-documents", method: "POST", body }),
      invalidatesTags: ["AdminDpr"],
    }),
    downloadSavedAdminDpr: builder.mutation({
      query: (id) => ({
        url: `/dpr/admin-documents/${id}/export`,
        responseHandler: downloadResponse,
      }),
    }),
    listAdminDpr: builder.query({
      query: ({ kind = "reports", ...params }) => ({
        url: `/dpr/admin-${kind}`,
        params,
      }),
      providesTags: ["AdminDpr"],
    }),
    saveAdminDpr: builder.mutation({
      query: ({ kind, id, ...body }) => ({
        url: `/dpr/admin-${kind}${id ? `/${id}` : ""}`,
        method: id ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["AdminDpr"],
    }),
    deleteAdminDpr: builder.mutation({
      query: ({ kind, id }) => ({
        url: `/dpr/admin-${kind}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminDpr"],
    }),
    downloadAdminDpr: builder.mutation({
      query: (params) => ({
        url: "/dpr/admin-reports/export",
        params,
        responseHandler: async (response) => {
          if (!response.ok) return response.json();
          const url = URL.createObjectURL(await response.blob());
          const link = document.createElement("a");
          link.href = url;
          link.download = "admin-dpr.xlsx";
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return { downloaded: true };
        },
      }),
    }),
  }),
});

export const {
  useListAdminDprQuery,
  useSaveAdminDprMutation,
  useDeleteAdminDprMutation,
  useDownloadAdminDprMutation,
  useListAdminDprDocumentsQuery,
  useGetAdminDprDocumentQuery,
  useCreateAdminDprDocumentMutation,
  useDownloadSavedAdminDprMutation,
} = adminDprApi;
