import { baseApi } from "../../store/baseApi";

/* -------------------------------------------------------------------------- */
/* Owner helpers                                                              */
/* -------------------------------------------------------------------------- */

const getOwnerKey = () => {
  try {
    const raw = localStorage.getItem("bc_user");

    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw);

    return user?.id ?? user?._id ?? null;
  } catch {
    return null;
  }
};

const encode = (value) => encodeURIComponent(String(value));

const getErrorMessage = (error, fallback = "Something went wrong") => {
  return (
    error?.data?.message ||
    error?.data?.zohoResponse?.message ||
    error?.data?.zohoResponse?.error?.message ||
    error?.error ||
    fallback
  );
};

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

export const calendarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ---------------------------------------------------------------------- */
    /* Calendars                                                               */
    /* ---------------------------------------------------------------------- */

    getCalendars: builder.query({
      query: ({ ownerKey: suppliedOwnerKey } = {}) => {
        const ownerKey = suppliedOwnerKey ?? getOwnerKey();

        if (!ownerKey) {
          throw new Error("Unable to identify the current user");
        }

        return {
          url: `/zoho/calendar/${encode(ownerKey)}/calendars`,
        };
      },

      providesTags: ["CalendarEvents"],
    }),

    getCalendar: builder.query({
      query: ({ ownerKey: suppliedOwnerKey, calendarUid }) => {
        const ownerKey = suppliedOwnerKey ?? getOwnerKey();

        if (!ownerKey) {
          throw new Error("Unable to identify the current user");
        }

        if (!calendarUid) {
          throw new Error("Calendar UID is required");
        }

        return {
          url: `/zoho/calendar/${encode(ownerKey)}/calendars/${encode(
            calendarUid,
          )}`,
        };
      },

      providesTags: ["CalendarEvents"],
    }),

    /* ---------------------------------------------------------------------- */
    /* Events                                                                  */
    /* ---------------------------------------------------------------------- */

    getCalendarEvents: builder.query({
      query: ({
        ownerKey: suppliedOwnerKey,
        calendarUid,
        range,
        byinstance = true,
        timezone = "Asia/Kolkata",
      }) => {
        const ownerKey = suppliedOwnerKey ?? getOwnerKey();

        if (!ownerKey) {
          throw new Error("Unable to identify the current user");
        }

        if (!calendarUid) {
          throw new Error("Calendar UID is required");
        }

        return {
          url: `/zoho/calendar/${encode(ownerKey)}/calendars/${encode(
            calendarUid,
          )}/events`,

          params: {
            ...(range ? { range: JSON.stringify(range) } : {}),
            byinstance,
            timezone,
          },
        };
      },

      providesTags: ["CalendarEvents"],
    }),

    getCalendarEvent: builder.query({
      query: ({ ownerKey: suppliedOwnerKey, calendarUid, eventUid }) => {
        const ownerKey = suppliedOwnerKey ?? getOwnerKey();

        if (!ownerKey) {
          throw new Error("Unable to identify the current user");
        }

        if (!calendarUid) {
          throw new Error("Calendar UID is required");
        }

        if (!eventUid) {
          throw new Error("Event UID is required");
        }

        return {
          url: `/zoho/calendar/${encode(ownerKey)}/calendars/${encode(
            calendarUid,
          )}/events/${encode(eventUid)}`,
        };
      },

      providesTags: ["CalendarEvents"],
    }),

    /* ---------------------------------------------------------------------- */
    /* Create                                                                  */
    /* ---------------------------------------------------------------------- */

    createCalendarEvent: builder.mutation({
      query: ({ ownerKey: suppliedOwnerKey, calendarUid, body }) => {
        const ownerKey = suppliedOwnerKey ?? getOwnerKey();

        if (!ownerKey) {
          throw new Error("Unable to identify the current user");
        }

        if (!calendarUid) {
          throw new Error("Calendar UID is required");
        }

        return {
          url: `/zoho/calendar/${encode(ownerKey)}/calendars/${encode(
            calendarUid,
          )}/events`,
          method: "POST",

          body,
        };
      },

      invalidatesTags: ["CalendarEvents"],
    }),

    /* ---------------------------------------------------------------------- */
    /* Update                                                                  */
    /* ---------------------------------------------------------------------- */

    updateCalendarEvent: builder.mutation({
      query: ({ ownerKey: suppliedOwnerKey, calendarUid, eventUid, body }) => {
        const ownerKey = suppliedOwnerKey ?? getOwnerKey();

        if (!ownerKey) {
          throw new Error("Unable to identify the current user");
        }

        if (!calendarUid) {
          throw new Error("Calendar UID is required");
        }

        if (!eventUid) {
          throw new Error("Event UID is required");
        }

        return {
          url: `/zoho/calendar/${encode(ownerKey)}/calendars/${encode(
            calendarUid,
          )}/events/${encode(eventUid)}`,
          method: "PUT",

          body,
        };
      },

      invalidatesTags: ["CalendarEvents"],
    }),

    /* ---------------------------------------------------------------------- */
    /* Delete                                                                  */
    /* ---------------------------------------------------------------------- */

    deleteCalendarEvent: builder.mutation({
      query: ({ ownerKey: suppliedOwnerKey, calendarUid, eventUid, body }) => {
        const ownerKey = suppliedOwnerKey ?? getOwnerKey();

        if (!ownerKey) {
          throw new Error("Unable to identify the current user");
        }

        if (!calendarUid) {
          throw new Error("Calendar UID is required");
        }

        if (!eventUid) {
          throw new Error("Event UID is required");
        }

        return {
          url: `/zoho/calendar/${encode(ownerKey)}/calendars/${encode(
            calendarUid,
          )}/events/${encode(eventUid)}`,
          method: "DELETE",

          ...(body ? { body } : {}),
        };
      },

      invalidatesTags: ["CalendarEvents"],
    }),
  }),

  overrideExisting: true,
});

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export const {
  useGetCalendarsQuery,
  useLazyGetCalendarsQuery,

  useGetCalendarQuery,
  useLazyGetCalendarQuery,

  useGetCalendarEventsQuery,
  useLazyGetCalendarEventsQuery,

  useGetCalendarEventQuery,
  useLazyGetCalendarEventQuery,

  useCreateCalendarEventMutation,

  useUpdateCalendarEventMutation,

  useDeleteCalendarEventMutation,
} = calendarApi;

export { getOwnerKey, getErrorMessage };
