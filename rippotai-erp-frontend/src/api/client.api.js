import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

export const clientsApi = createApi({
  reducerPath: "clientsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include", // Remove if using Bearer token
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
  }),

  tagTypes: ["Clients"],

  endpoints: (builder) => ({
    // =========================
    // Get All Clients
    // =========================
    getClients: builder.query({
      query: ({ includeDeleted } = {}) => ({
        url: "/clients",
        params: { includeDeleted },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Clients", id: c.id })),
              { type: "Clients", id: "LIST" },
            ]
          : [{ type: "Clients", id: "LIST" }],
    }),

    // =========================
    // Get Client By ID
    // =========================
    getClientById: builder.query({
      query: ({ id, includeDeleted }) => ({
        url: `/clients/${id}`,
        params: { includeDeleted },
      }),
      providesTags: (result, error, { id }) => [{ type: "Clients", id }],
    }),

    // =========================
    // Create Client
    // =========================
    createClient: builder.mutation({
      query: (body) => ({
        url: "/clients",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Clients", id: "LIST" }],
    }),

    // =========================
    // Update Client
    // =========================
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/clients/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Clients", id },
        { type: "Clients", id: "LIST" },
      ],
    }),

    // =========================
    // Restore Client
    // =========================
    restoreClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Clients", id },
        { type: "Clients", id: "LIST" },
      ],
    }),

    // =========================
    // Delete Client (soft delete)
    // =========================
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Clients", id: "LIST" }],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useRestoreClientMutation,
  useDeleteClientMutation,
} = clientsApi;
