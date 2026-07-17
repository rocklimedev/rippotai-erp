import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../lib/config";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("bc_token");

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

export const calendarApi = createApi({
  reducerPath: "calendarApi",
  baseQuery,
  tagTypes: ["CalendarEvents", "CalendarStats"],

  endpoints: (builder) => ({
    // =========================
    // CALENDAR EVENTS
    // =========================

    getCalendarEvents: builder.query({
      query: (params) => ({
        url: "/calendar/events",
        params,
      }),
      providesTags: ["CalendarEvents"],
    }),

    getMyCalendarEvents: builder.query({
      query: (params) => ({
        url: "/calendar/events/my-events",
        params,
      }),
      providesTags: ["CalendarEvents"],
    }),

    getTodayCalendarEvents: builder.query({
      query: () => ({
        url: "/calendar/events/today",
      }),
      providesTags: ["CalendarEvents"],
    }),

    getUpcomingCalendarEvents: builder.query({
      query: (days = 30) => ({
        url: "/calendar/events/upcoming",
        params: {
          days,
        },
      }),
      providesTags: ["CalendarEvents"],
    }),

    getProjectCalendarEvents: builder.query({
      query: (projectId) => ({
        url: `/calendar/events/project/${projectId}`,
      }),
      providesTags: ["CalendarEvents"],
    }),

    getCalendarStats: builder.query({
      query: () => ({
        url: "/calendar/events/stats",
      }),
      providesTags: ["CalendarStats"],
    }),

    getCalendarEvent: builder.query({
      query: (id) => ({
        url: `/calendar/events/${id}`,
      }),
      providesTags: ["CalendarEvents"],
    }),

    createCalendarEvent: builder.mutation({
      query: (body) => ({
        url: "/calendar/events",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CalendarEvents", "CalendarStats"],
    }),

    updateCalendarEvent: builder.mutation({
      query: ({ id, body }) => ({
        url: `/calendar/events/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CalendarEvents", "CalendarStats"],
    }),

    deleteCalendarEvent: builder.mutation({
      query: (id) => ({
        url: `/calendar/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CalendarEvents", "CalendarStats"],
    }),
  }),
});

// =========================
// EXPORT HOOKS
// =========================

export const {
  useGetCalendarEventsQuery,
  useLazyGetCalendarEventsQuery,

  useGetMyCalendarEventsQuery,
  useLazyGetMyCalendarEventsQuery,

  useGetTodayCalendarEventsQuery,
  useLazyGetTodayCalendarEventsQuery,

  useGetUpcomingCalendarEventsQuery,
  useLazyGetUpcomingCalendarEventsQuery,

  useGetProjectCalendarEventsQuery,
  useLazyGetProjectCalendarEventsQuery,

  useGetCalendarStatsQuery,
  useLazyGetCalendarStatsQuery,

  useGetCalendarEventQuery,
  useLazyGetCalendarEventQuery,

  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} = calendarApi;
