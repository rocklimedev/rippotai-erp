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
export const drawingApi = createApi({
  reducerPath: "drawingApi",
  baseQuery,
  tagTypes: ["Drawings"],

  endpoints: (builder) => ({
    getDrawings: builder.query({
      query: () => "/drawings",
      providesTags: ["Drawings"],
    }),

    uploadDrawing: builder.mutation({
      query: ({ data, file }) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value);
        });

        if (file) {
          formData.append("file", file);
        }

        return {
          url: "/drawings",
          method: "POST",
          body: formData,
        };
      },

      invalidatesTags: ["Drawings"],
    }),
  }),
});

export const { useGetDrawingsQuery, useUploadDrawingMutation } = drawingApi;
