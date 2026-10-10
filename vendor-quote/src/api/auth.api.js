import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL, // change to your backend URL
  credentials: "include", // IMPORTANT for cookie-based auth
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token"); // Your token key

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

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  tagTypes: ["AuthUser", "AuthTokens", "VerificationTokens"],

  endpoints: (builder) => ({
    // =========================
    // AUTH CONTROLLER
    // =========================

    login: builder.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AuthUser"],
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["AuthUser"],
    }),

    me: builder.query({
      query: () => "/auth/me",
      providesTags: ["AuthUser"],
    }),

    // =========================
    // AUTH TOKENS CONTROLLER
    // =========================


    getAuthTokensByUser: builder.query({
      query: (userId) => `/auth/tokens/user/${userId}`,
      providesTags: ["AuthTokens"],
    }),

    revokeAuthToken: builder.mutation({
      query: (id) => ({
        url: `/auth/tokens/${id}/revoke`,
        method: "PATCH",
      }),
      invalidatesTags: ["AuthTokens"],
    }),

    revokeAllAuthTokensForUser: builder.mutation({
      query: (userId) => ({
        url: `/auth/tokens/user/${userId}/revoke-all`,
        method: "PATCH",
      }),
      invalidatesTags: ["AuthTokens"],
    }),

    deleteAuthToken: builder.mutation({
      query: (id) => ({
        url: `/auth/tokens/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AuthTokens"],
    }),

  }),
});

// =========================
// EXPORT HOOKS
// =========================

export const {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,

  useGetAuthTokensByUserQuery,
  useRevokeAuthTokenMutation,
  useRevokeAllAuthTokensForUserMutation,
  useDeleteAuthTokenMutation,

} = authApi;
