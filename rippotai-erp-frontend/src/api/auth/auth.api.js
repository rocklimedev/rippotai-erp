import { baseApi } from "../../store/baseApi";

export const authApi = baseApi.injectEndpoints({
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
    signup: builder.mutation({
      query: (body) => ({
        url: "/auth/signup",
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
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
    revokeAllAuthTokensForUser: builder.mutation({
      query: (userId) => ({
        url: `/auth/tokens/user/${userId}/revoke-all`,
        method: "PATCH",
      }),
      invalidatesTags: ["AuthTokens"],
    }),
    resetPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
    // Authenticated user changing their own password (knows current password).
    // Distinct from resetPassword, which is the token-based forgot-password flow.
    changePassword: builder.mutation({
      query: (body) => ({
        url: "/auth/change-password",
        method: "PATCH",
        body,
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
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery,
  useGetAuthTokensByUserQuery,
  useRevokeAuthTokenMutation,
  useRevokeAllAuthTokensForUserMutation,
  useDeleteAuthTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
