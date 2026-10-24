import { baseApi } from "../../store/baseApi";

export const cdnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    nasTestUpload: builder.mutation({
      query: ({ file, scope }) => {
        const body = new FormData();
        body.append('file', file);
        body.append('scope', scope);
        return { url: '/nas/test/upload', method: 'POST', body };
      },
    }),
    nasTestCopy: builder.mutation({
      query: (url) => ({ url: '/nas/test/copy', method: 'POST', body: { url } }),
    }),
    nasStatus: builder.query({
      query: () => "/nas/status",
      keepUnusedDataFor: 0,
    }),
    uploadFileToCdn: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/cdn/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Cdn"],
    }),
  }),
  overrideExisting: false,
});

export const { useUploadFileToCdnMutation, useNasStatusQuery, useNasTestUploadMutation, useNasTestCopyMutation } = cdnApi;
