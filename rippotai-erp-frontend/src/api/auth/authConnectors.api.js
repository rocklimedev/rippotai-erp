import { baseApi } from "../../store/baseApi";

export const authConnectorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // GOOGLE
    // ============================================================

    /**
     * GOOGLE OAUTH AUTHORIZE
     *
     * Backend:
     * GET /auth/google/authorize
     *
     * IMPORTANT:
     * This endpoint performs a browser redirect to Google.
     *
     * If your JWT is stored in an Authorization header,
     * do NOT use the RTK Query hook to start OAuth directly.
     * Use window.location.href with the backend URL instead.
     */
    googleAuthorizeUrl: builder.query({
      query: (scopes) => ({
        url: `/auth/google/authorize${
          scopes ? `?scopes=${encodeURIComponent(scopes)}` : ""
        }`,
      }),
    }),

    /**
     * GOOGLE CONNECTION STATUS
     *
     * Backend:
     * GET /auth/google/status
     */
    googleStatus: builder.query({
      query: () => "/auth/google/status",
      providesTags: ["AuthConnectors"],
    }),

    /**
     * GOOGLE DISCONNECT
     *
     * Backend:
     * DELETE /auth/google
     */
    googleDisconnect: builder.mutation({
      query: () => ({
        url: "/auth/google",
        method: "DELETE",
      }),
      invalidatesTags: ["AuthConnectors"],
    }),

    // ============================================================
    // MICROSOFT
    // ============================================================

    /**
     * MICROSOFT OAUTH AUTHORIZE
     *
     * Backend:
     * GET /auth/microsoft/authorize
     */
    microsoftAuthorize: builder.mutation({
      query: () => ({
        url: "/auth/microsoft/authorize",
        method: "GET",
      }),
    }),

    /**
     * MICROSOFT OAUTH AUTHORIZE URL
     *
     * Backend:
     * GET /auth/microsoft/authorize-url
     */
    microsoftAuthorizeUrl: builder.query({
      query: (scopes) => ({
        url: `/auth/microsoft/authorize-url${
          scopes ? `?scopes=${encodeURIComponent(scopes)}` : ""
        }`,
      }),
    }),

    /**
     * MICROSOFT CONNECTION STATUS
     *
     * Backend:
     * GET /auth/microsoft/status
     */
    microsoftStatus: builder.query({
      query: () => "/auth/microsoft/status",
      providesTags: ["AuthConnectors"],
    }),

    /**
     * MICROSOFT DISCONNECT
     *
     * Backend:
     * DELETE /auth/microsoft
     */
    microsoftDisconnect: builder.mutation({
      query: () => ({
        url: "/auth/microsoft",
        method: "DELETE",
      }),
      invalidatesTags: ["AuthConnectors"],
    }),

    // ============================================================
    // ZOHO
    // ============================================================

    /**
     * ZOHO OAUTH AUTHORIZE URL
     *
     * Backend:
     * GET /auth/zoho/authorize-url
     */
    zohoAuthorizeUrl: builder.query({
      query: (scopes) => ({
        url: `/auth/zoho/authorize-url${
          scopes ? `?scopes=${encodeURIComponent(scopes)}` : ""
        }`,
      }),
    }),

    /**
     * ZOHO CONNECTION STATUS
     *
     * Backend:
     * GET /auth/zoho/status
     */
    zohoStatus: builder.query({
      query: () => "/auth/zoho/status",
      providesTags: ["AuthConnectors"],
    }),

    /**
     * ZOHO DISCONNECT
     *
     * Backend:
     * DELETE /auth/zoho
     */
    zohoDisconnect: builder.mutation({
      query: () => ({
        url: "/auth/zoho",
        method: "DELETE",
      }),
      invalidatesTags: ["AuthConnectors"],
    }),
  }),

  overrideExisting: false,
});

// ============================================================
// HOOKS
// ============================================================

export const {
  // -------------------------
  // GOOGLE
  // -------------------------
  useLazyGoogleAuthorizeUrlQuery,
  useGoogleStatusQuery,
  useGoogleDisconnectMutation,

  // -------------------------
  // MICROSOFT
  // -------------------------
  useLazyMicrosoftAuthorizeUrlQuery,
  useMicrosoftAuthorizeMutation,
  useMicrosoftStatusQuery,
  useMicrosoftDisconnectMutation,

  // -------------------------
  // ZOHO
  // -------------------------
  useLazyZohoAuthorizeUrlQuery,
  useZohoStatusQuery,
  useZohoDisconnectMutation,
} = authConnectorsApi;
