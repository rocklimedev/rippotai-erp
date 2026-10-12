import { baseApi } from "@/store/baseApi";
const path = (kind) => kind === "tasks" ? "/tasks/zoho-sync" : "/calendar/zoho-sync";
export const reminderSyncApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["ReminderSync"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getReminderPortals: builder.query({ query: () => `${path("tasks")}/portals` }),
      getReminderProjects: builder.query({ query: (portalId) => `${path("tasks")}/portals/${encodeURIComponent(portalId)}/projects` }),
      getReminderUsers: builder.query({
        query: ({ portalId, projectId }) => `${path("tasks")}/portals/${encodeURIComponent(portalId)}/projects/${encodeURIComponent(projectId)}/users`,
      }),
      reminderAuthorize: builder.query({ query: (kind) => `${path(kind)}/authorize` }),
      getReminderCalendars: builder.query({
        query: () => `${path("calendar")}/destinations`,
      }),
      getReminderStatus: builder.query({
        query: (kind) => `${path(kind)}/status`,
        providesTags: (r, e, kind) => [{ type: "ReminderSync", id: kind }],
      }),
      saveReminderSettings: builder.mutation({
        query: ({ kind, body }) => ({
          url: `${path(kind)}/settings`,
          method: "PUT",
          body,
        }),
        invalidatesTags: (r, e, { kind }) => [
          { type: "ReminderSync", id: kind },
        ],
      }),
      syncReminders: builder.mutation({
        query: ({ kind, retry_failed = false, entity_id, force_full_sync = false }) => ({
          url: `${path(kind)}/push`,
          method: "POST",
          body: { retry_failed, entity_id, force_full_sync },
        }),
        invalidatesTags: (r, e, { kind }) => [
          { type: "ReminderSync", id: kind },
        ],
      }),
      reconcileReminder: builder.mutation({
        query: ({ kind, local_id, remote_id }) => ({
          url: `${path(kind)}/reconcile/${encodeURIComponent(local_id)}`,
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
  useGetReminderPortalsQuery,
  useGetReminderProjectsQuery,
  useGetReminderUsersQuery,
  useLazyReminderAuthorizeQuery,
  useGetReminderCalendarsQuery,
  useGetReminderStatusQuery,
  useSaveReminderSettingsMutation,
  useSyncRemindersMutation,
  useReconcileReminderMutation,
} = reminderSyncApi;
