import { baseApi } from "../../store/baseApi";

export const cdnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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

export const { useUploadFileToCdnMutation, useNasStatusQuery } = cdnApi;
