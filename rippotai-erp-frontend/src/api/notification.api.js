import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
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

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery,
  tagTypes: ["Notifications"],

  endpoints: (builder) => ({
    // =========================
    // NOTIFICATIONS
    // =========================

    createNotification: builder.mutation({
      query: (body) => ({
        url: "/notifications",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    getUserNotifications: builder.query({
      query: ({ userId, unreadOnly }) => {
        const params = new URLSearchParams();

        if (unreadOnly !== undefined) params.append("unreadOnly", unreadOnly);

        return `/notifications/user/${userId}?${params.toString()}`;
      },
      transformResponse: (response) => {
        console.log("NOTIFICATION RESPONSE:", response);
        return response;
      },
      providesTags: ["Notifications"],
    }),
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    markAllAsRead: builder.mutation({
      query: (userId) => ({
        url: `/notifications/user/${userId}/read-all`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

// =========================
// EXPORT HOOKS
// =========================

export const {
  useCreateNotificationMutation,
  useGetUserNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
