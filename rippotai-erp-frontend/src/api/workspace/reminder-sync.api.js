import { baseApi } from "@/store/baseApi";
export const reminderSyncApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["ReminderSync"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getReminderCalendars: builder.query({
        query: () => '/sync/calendar/destinations',
      }),
      getReminderStatus: builder.query({
        query: (kind) => `/sync/${kind}/status`,
        providesTags: (r, e, kind) => [{ type: "ReminderSync", id: kind }],
      }),
      saveReminderSettings: builder.mutation({
        query: ({ kind, body }) => ({
          url: `/sync/${kind}/settings`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (r, e, { kind }) => [
          { type: "ReminderSync", id: kind },
        ],
      }),
      syncReminders: builder.mutation({
        query: ({ kind, retry_failed = false }) => ({
          url: `/sync/${kind}/push`,
          method: "POST",
          body: { retry_failed },
        }),
        invalidatesTags: (r, e, { kind }) => [
          { type: "ReminderSync", id: kind },
        ],
      }),
      reconcileReminder: builder.mutation({
        query: ({ kind, local_id, remote_id }) => ({
          url: `/sync/${kind}/reconcile/${encodeURIComponent(local_id)}`,
          method: "POST",
          body: { remote_id },
        }),
        invalidatesTags: (r, e, { kind }) => [
          { type: "ReminderSync", id: kind },
        ],
      }),
    }),
  });
export const {
  useGetReminderCalendarsQuery,
  useGetReminderStatusQuery,
  useSaveReminderSettingsMutation,
  useSyncRemindersMutation,
  useReconcileReminderMutation,
} = reminderSyncApi;
