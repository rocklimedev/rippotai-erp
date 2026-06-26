import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3000/api/v1",
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token"); // Your token key

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
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
