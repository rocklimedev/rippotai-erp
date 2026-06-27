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

    createAuthToken: builder.mutation({
      query: (body) => ({
        url: "/auth/tokens",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AuthTokens"],
    }),

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

    // =========================
    // VERIFICATION TOKENS
    // =========================

    createVerificationToken: builder.mutation({
      query: (body) => ({
        url: "/auth/verification-tokens",
        method: "POST",
        body,
      }),
      invalidatesTags: ["VerificationTokens"],
    }),

    validateVerificationToken: builder.query({
      query: (token) => `/auth/verification-tokens/validate?token=${token}`,
      providesTags: ["VerificationTokens"],
    }),

    consumeVerificationToken: builder.mutation({
      query: (id) => ({
        url: `/auth/verification-tokens/${id}/consume`,
        method: "PATCH",
      }),
      invalidatesTags: ["VerificationTokens"],
    }),

    deleteVerificationToken: builder.mutation({
      query: (id) => ({
        url: `/auth/verification-tokens/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VerificationTokens"],
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

  useCreateAuthTokenMutation,
  useGetAuthTokensByUserQuery,
  useRevokeAuthTokenMutation,
  useRevokeAllAuthTokensForUserMutation,
  useDeleteAuthTokenMutation,

  useCreateVerificationTokenMutation,
  useValidateVerificationTokenQuery,
  useConsumeVerificationTokenMutation,
  useDeleteVerificationTokenMutation,
} = authApi;
