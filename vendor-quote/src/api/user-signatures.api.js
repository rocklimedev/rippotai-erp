import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token"); // Your token key

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    // Add this line:

    // ===================== CDN TOKEN =====================
    const cdnToken = import.meta.env.VITE_CDN_TOKEN;
    if (cdnToken) {
      headers.set("x-cdn-secret", cdnToken);
    }

    return headers;
  },
});
export const userSignatureApi = createApi({
  reducerPath: "userSignaturesApi",
  baseQuery,
  tagTypes: ["UsersSignatures"],

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
