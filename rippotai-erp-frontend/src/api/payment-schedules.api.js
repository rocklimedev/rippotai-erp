import { baseApi } from "../store/baseApi";
export const paymentSchedulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentSchedules: builder.query({
      query: (params) => ({
        url: "/payment-schedules",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((ps) => ({ type: "PaymentSchedule", id: ps.id })),
              { type: "PaymentSchedule", id: "LIST" },
            ]
          : [{ type: "PaymentSchedule", id: "LIST" }],
    }),

    getPaymentSchedule: builder.query({
      query: (id) => `/payment-schedules/${id}`,
      providesTags: (result, error, id) => [{ type: "PaymentSchedule", id }],
    }),

    createPaymentSchedule: builder.mutation({
      query: (body) => ({
        url: "/payment-schedules",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PaymentSchedule", id: "LIST" }],
    }),

    updatePaymentSchedule: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payment-schedules/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PaymentSchedule", id },
        { type: "PaymentSchedule", id: "LIST" },
      ],
    }),

    deletePaymentSchedule: builder.mutation({
      query: (id) => ({
        url: `/payment-schedules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "PaymentSchedule", id: "LIST" }],
    }),

    // ---------- Milestones ----------
    // Only needed if you manage milestones outside of the nested
    // create/update payload (e.g. editing a single milestone's status
    // or paid amount after the schedule already exists).

    addPaymentScheduleMilestone: builder.mutation({
      query: ({ paymentScheduleId, ...body }) => ({
        url: `/payment-schedules/${paymentScheduleId}/milestones`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { paymentScheduleId }) => [
        { type: "PaymentSchedule", id: paymentScheduleId },
      ],
    }),

    updatePaymentScheduleMilestone: builder.mutation({
      query: ({ paymentScheduleId, milestoneId, ...body }) => ({
        url: `/payment-schedules/${paymentScheduleId}/milestones/${milestoneId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { paymentScheduleId }) => [
        { type: "PaymentSchedule", id: paymentScheduleId },
      ],
    }),

    deletePaymentScheduleMilestone: builder.mutation({
      query: ({ paymentScheduleId, milestoneId }) => ({
        url: `/payment-schedules/${paymentScheduleId}/milestones/${milestoneId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { paymentScheduleId }) => [
        { type: "PaymentSchedule", id: paymentScheduleId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPaymentSchedulesQuery,
  useGetPaymentScheduleQuery,
  useCreatePaymentScheduleMutation,
  useUpdatePaymentScheduleMutation,
  useDeletePaymentScheduleMutation,
  useAddPaymentScheduleMilestoneMutation,
  useUpdatePaymentScheduleMilestoneMutation,
  useDeletePaymentScheduleMilestoneMutation,
} = paymentSchedulesApi;
