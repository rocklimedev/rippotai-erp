import { baseApi } from "../store/baseApi";

export const drawingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // Get all drawings for a project
    // GET /drawings?projectId=...
    // =========================================================
    getDrawings: builder.query({
      query: ({ projectId, discipline, status, phaseCode }) => ({
        url: "/drawings",
        params: {
          projectId,
          ...(discipline ? { discipline } : {}),
          ...(status ? { status } : {}),
          ...(phaseCode ? { phaseCode } : {}),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Drawing",
                id,
              })),
              { type: "Drawing", id: "LIST" },
            ]
          : [{ type: "Drawing", id: "LIST" }],
    }),

    // =========================================================
    // Get single drawing
    // GET /drawings/:id
    // =========================================================
    getDrawingById: builder.query({
      query: (id) => `/drawings/${id}`,
      providesTags: (result, error, id) => [{ type: "Drawing", id }],
    }),

    // =========================================================
    // Create drawing
    // POST /drawings
    // =========================================================
    createDrawing: builder.mutation({
      query: (data) => ({
        url: "/drawings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Drawing", id: "LIST" }],
    }),

    // =========================================================
    // Update drawing
    // PATCH /drawings/:id
    // =========================================================
    updateDrawing: builder.mutation({
      query: ({ id, data }) => ({
        url: `/drawings/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Drawing", id },
        { type: "Drawing", id: "LIST" },
      ],
    }),

    // =========================================================
    // Delete drawing
    // DELETE /drawings/:id
    // =========================================================
    deleteDrawing: builder.mutation({
      query: (id) => ({
        url: `/drawings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Drawing", id },
        { type: "Drawing", id: "LIST" },
      ],
    }),

    // =========================================================
    // Add revision
    // POST /drawings/:id/revisions
    //
    // multipart/form-data
    // =========================================================
    addDrawingRevision: builder.mutation({
      query: ({ id, data, file }) => {
        const formData = new FormData();

        Object.entries(data || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        if (file) {
          formData.append("file", file);
        }

        return {
          url: `/drawings/${id}/revisions`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Drawing", id }],
    }),

    // =========================================================
    // Get drawing revisions
    // GET /drawings/:id/revisions
    // =========================================================
    getDrawingRevisions: builder.query({
      query: (drawingId) => `/drawings/${drawingId}/revisions`,
      providesTags: (result, error, drawingId) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "DrawingRevision",
                id,
              })),
              {
                type: "DrawingRevision",
                id: `DRAWING-${drawingId}`,
              },
            ]
          : [
              {
                type: "DrawingRevision",
                id: `DRAWING-${drawingId}`,
              },
            ],
    }),

    // =========================================================
    // Download revision
    // GET /drawings/:id/revisions/:revisionId/download
    // =========================================================
    downloadDrawingRevision: builder.query({
      query: ({ drawingId, revisionId }) => ({
        url: `/drawings/${drawingId}/revisions/${revisionId}/download`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // =========================================================
    // Delete revision
    // DELETE /drawings/:id/revisions/:revisionId
    // =========================================================
    deleteDrawingRevision: builder.mutation({
      query: ({ drawingId, revisionId }) => ({
        url: `/drawings/${drawingId}/revisions/${revisionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { drawingId, revisionId }) => [
        { type: "Drawing", id: drawingId },
        {
          type: "DrawingRevision",
          id: revisionId,
        },
        {
          type: "DrawingRevision",
          id: `DRAWING-${drawingId}`,
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetDrawingsQuery,
  useGetDrawingByIdQuery,
  useCreateDrawingMutation,
  useUpdateDrawingMutation,
  useDeleteDrawingMutation,
  useAddDrawingRevisionMutation,
  useGetDrawingRevisionsQuery,
  useLazyDownloadDrawingRevisionQuery,
  useDeleteDrawingRevisionMutation,
} = drawingApi;
