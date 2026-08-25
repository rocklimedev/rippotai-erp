import { baseApi } from "../store/baseApi";

export const siteRecceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // SITE RECCE CONTROLLER
    // ============================================================

    // POST /site-recces
    createSiteRecce: builder.mutation({
      query: (body) => ({
        url: "/site-recces",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SiteRecces"],
    }),

    // GET /site-recces
    getSiteRecces: builder.query({
      query: () => "/site-recces",
      providesTags: ["SiteRecces"],
    }),

    // GET /site-recces/project/:projectId
    getSiteRecceByProject: builder.query({
      query: (projectId) => `/site-recces/project/${projectId}`,
      providesTags: ["SiteRecces"],
    }),

    // GET /site-recces/:id
    getSiteRecce: builder.query({
      query: (id) => `/site-recces/${id}`,
      providesTags: ["SiteRecces"],
    }),

    // PATCH /site-recces/:id
    updateSiteRecce: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/site-recces/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["SiteRecces"],
    }),

    // DELETE /site-recces/:id
    deleteSiteRecce: builder.mutation({
      query: (id) => ({
        url: `/site-recces/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SiteRecces"],
    }),

    // POST /site-recces/:id/restore
    restoreSiteRecce: builder.mutation({
      query: (id) => ({
        url: `/site-recces/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["SiteRecces"],
    }),

    // ============================================================
    // PHOTO UPLOAD
    // ============================================================

    /**
     * POST
     * /site-recces/:siteRecceId/rooms/:roomId/photos
     *
     * multipart/form-data
     *
     * file
     * shot_number
     * standing_position
     * camera_direction
     * notes
     */
    uploadSiteReccePhoto: builder.mutation({
      query: ({
        siteRecceId,
        roomId,
        file,
        shotNumber,
        standingPosition,
        cameraDirection,
        notes,
      }) => {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("shot_number", String(shotNumber));

        if (standingPosition !== undefined) {
          formData.append("standing_position", standingPosition);
        }

        if (cameraDirection !== undefined) {
          formData.append("camera_direction", cameraDirection);
        }

        if (notes !== undefined) {
          formData.append("notes", notes);
        }

        return {
          url: `/site-recces/${siteRecceId}/rooms/${roomId}/photos`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["SiteRecces"],
    }),

    // ============================================================
    // UPLOAD IMAGE ONLY
    // ============================================================

    /**
     * POST /site-recces/upload
     *
     * Upload image to CDN and return:
     * {
     *   filename,
     *   url
     * }
     */
    uploadSiteRecceImage: builder.mutation({
      query: (file) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: "/site-recces/upload",
          method: "POST",
          body: formData,
        };
      },
    }),

    // ============================================================
    // REPLACE PHOTO
    // ============================================================

    /**
     * PATCH /site-recces/photos/:photoId
     *
     * Uploads new photo and replaces existing CDN image.
     */
    replaceSiteReccePhoto: builder.mutation({
      query: ({ photoId, file }) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: `/site-recces/photos/${photoId}`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["SiteRecces"],
    }),

    // ============================================================
    // UPLOAD / REPLACE LAYOUT IMAGE
    // ============================================================

    /**
     * PATCH /site-recces/photos/:photoId/layout
     */
    uploadSiteRecceLayoutImage: builder.mutation({
      query: ({ photoId, file }) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: `/site-recces/photos/${photoId}/layout`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["SiteRecces"],
    }),

    // ============================================================
    // DELETE PHOTO
    // ============================================================

    /**
     * DELETE /site-recces/photos/:photoId
     */
    deleteSiteReccePhoto: builder.mutation({
      query: (photoId) => ({
        url: `/site-recces/photos/${photoId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SiteRecces"],
    }),
  }),

  overrideExisting: false,
});

export const {
  // ============================================================
  // SITE RECCE
  // ============================================================

  useCreateSiteRecceMutation,
  useGetSiteReccesQuery,
  useGetSiteRecceByProjectQuery,
  useGetSiteRecceQuery,
  useUpdateSiteRecceMutation,
  useDeleteSiteRecceMutation,
  useRestoreSiteRecceMutation,

  // ============================================================
  // PHOTO
  // ============================================================

  useUploadSiteReccePhotoMutation,
  useUploadSiteRecceImageMutation,
  useReplaceSiteReccePhotoMutation,
  useUploadSiteRecceLayoutImageMutation,
  useDeleteSiteReccePhotoMutation,
} = siteRecceApi;
