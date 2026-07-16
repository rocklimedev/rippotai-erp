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
  tagTypes: ["CalendarEvents"],

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

    getCalendarEvent: builder.query({
      query: (id) => `/calendar/events/${id}`,
      providesTags: ["CalendarEvents"],
    }),

    createCalendarEvent: builder.mutation({
      query: (body) => ({
        url: "/calendar/events",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CalendarEvents"],
    }),

    updateCalendarEvent: builder.mutation({
      query: ({ id, body }) => ({
        url: `/calendar/events/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CalendarEvents"],
    }),

    deleteCalendarEvent: builder.mutation({
      query: (id) => ({
        url: `/calendar/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CalendarEvents"],
    }),
  }),
});

// =========================
// EXPORT HOOKS
// =========================

export const {
  useGetCalendarEventsQuery,
  useLazyGetCalendarEventsQuery,
  useGetCalendarEventQuery,
  useLazyGetCalendarEventQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} = calendarApi;
