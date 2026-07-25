import { baseApi } from "../store/baseApi";
export const userSignatureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Upload / Update Signature
    uploadSignature: builder.mutation({
      query: ({ userId, file }) => {
        const formData = new FormData();
        formData.append("signature", file);
        formData.append("userId", userId);

        return {
          url: "/user-signatures",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "UserSignature", id: userId },
      ],
    }),

    // Get Signature
    getSignature: builder.query({
      query: (userId) => `/user-signatures/${userId}`,
      providesTags: (result, error, userId) => [
        { type: "UserSignature", id: userId },
      ],
    }),

    // Delete Signature
    deleteSignature: builder.mutation({
      query: (userId) => ({
        url: `/user-signatures/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "UserSignature", id: userId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadSignatureMutation,
  useGetSignatureQuery,
  useDeleteSignatureMutation,
} = userSignatureApi;
