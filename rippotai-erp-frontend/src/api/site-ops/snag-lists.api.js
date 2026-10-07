import { baseApi } from "@/store/baseApi";
export const snagListsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSnagDocuments: builder.query({
      query: (params) => ({ url: "/site-ops/snag-lists", params }),
      providesTags: ["SnagLists"],
    }),
    getSnagDocument: builder.query({
      query: (id) => `/site-ops/snag-lists/${id}`,
      providesTags: ["SnagLists"],
    }),
    saveSnagDocument: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-ops/snag-lists${id ? `/${id}` : ""}`,
        method: id ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["SnagLists"],
    }),
    uploadSnagPhoto: builder.mutation({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "/site-ops/snag-lists/photos", method: "POST", body };
      },
    }),
    downloadSnagDocument: builder.mutation({
      query: (id) => ({
        url: `/site-ops/snag-lists/${id}/export`,
        responseHandler: async (response) => {
          if (!response.ok) return response.json();
          const url = URL.createObjectURL(await response.blob());
          const link = document.createElement("a");
          link.href = url;
          link.download =
            response.headers
              .get("Content-Disposition")
              ?.match(/filename="([^"]+)"/)?.[1] || "snag-list.xlsx";
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
  useListSnagDocumentsQuery,
  useGetSnagDocumentQuery,
  useSaveSnagDocumentMutation,
  useUploadSnagPhotoMutation,
  useDownloadSnagDocumentMutation,
} = snagListsApi;
