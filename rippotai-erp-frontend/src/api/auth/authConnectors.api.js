import { baseApi } from "../../store/baseApi";

export const authConnectorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // GOOGLE
    // ============================================================

    googleAuthorizeUrl: builder.query({
      query: (scopes) => ({
        url: `/auth/google/authorize-url${
          scopes ? `?scopes=${encodeURIComponent(scopes)}` : ""
        }`,
      }),
    }),

    googleStatus: builder.query({
      query: () => "/auth/google/status",
      providesTags: ["AuthConnectors"],
    }),

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

    microsoftAuthorize: builder.mutation({
      query: () => ({
        url: "/auth/microsoft/authorize",
        method: "GET",
      }),
    }),

    microsoftAuthorizeUrl: builder.query({
      query: (scopes) => ({
        url: `/auth/microsoft/authorize-url${
          scopes ? `?scopes=${encodeURIComponent(scopes)}` : ""
        }`,
      }),
    }),
    microsoftStatus: builder.query({
      query: () => "/auth/microsoft/status",
      providesTags: ["AuthConnectors"],
    }),

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

    zohoAuthorizeUrl: builder.query({
      query: (scopes) => ({
        url: `/auth/zoho/authorize-url${
          scopes ? `?scopes=${encodeURIComponent(scopes)}` : ""
        }`,
      }),
    }),

    zohoStatus: builder.query({
      query: () => "/auth/zoho/status",
      providesTags: ["AuthConnectors"],
    }),

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
export const {
  useLazyGoogleAuthorizeUrlQuery,
  useGoogleStatusQuery,
  useGoogleDisconnectMutation,
  useLazyMicrosoftAuthorizeUrlQuery,
  useMicrosoftAuthorizeMutation,
  useMicrosoftStatusQuery,
  useMicrosoftDisconnectMutation,

  useLazyZohoAuthorizeUrlQuery,
  useZohoStatusQuery,
  useZohoDisconnectMutation,
} = authConnectorsApi;
