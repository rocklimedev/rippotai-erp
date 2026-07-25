import { baseApi } from "../store/baseApi";

export const notificationsApi = baseApi.injectEndpoints({
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

    deleteUserNotifications: builder.mutation({
      query: (userId) => ({
        url: `/notifications/user/${userId}`,
        method: "DELETE",
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
  overrideExisting: false,
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
  useDeleteUserNotificationsMutation,
} = notificationsApi;
