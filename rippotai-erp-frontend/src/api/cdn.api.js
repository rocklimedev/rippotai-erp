import { baseApi } from "../store/baseApi";

export const cdnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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

export const { useUploadFileToCdnMutation } = cdnApi;
