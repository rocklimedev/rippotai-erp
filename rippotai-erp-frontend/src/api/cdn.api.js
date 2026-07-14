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
export const cdnApi = createApi({
  reducerPath: "cdnApi",
  baseQuery,
  tagTypes: ["CDN"],
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
      invalidatesTags: ["CDN"],
    }),
  }),
});

export const { useUploadFileToCdnMutation } = cdnApi;
