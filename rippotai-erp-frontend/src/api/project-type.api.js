import { baseApi } from "../store/baseApi";

export const projectTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // Get All Project Types
    // =========================
    getProjectTypes: builder.query({
      query: () => "/project-types",
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: "ProjectTypes", id: t.id })),
              { type: "ProjectTypes", id: "LIST" },
            ]
          : [{ type: "ProjectTypes", id: "LIST" }],
    }),

    // =========================
    // Get Project Type By ID
    // =========================
    getProjectTypeById: builder.query({
      query: (id) => `/project-types/${id}`,
      providesTags: (result, error, id) => [{ type: "ProjectTypes", id }],
    }),

    // =========================
    // Create Project Type
    // =========================
    createProjectType: builder.mutation({
      query: (body) => ({
        url: "/project-types",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ProjectTypes", id: "LIST" }],
    }),

    // =========================
    // Update Project Type
    // =========================
    updateProjectType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/project-types/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ProjectTypes", id },
        { type: "ProjectTypes", id: "LIST" },
      ],
    }),

    // =========================
    // Delete Project Type
    // =========================
    deleteProjectType: builder.mutation({
      query: (id) => ({
        url: `/project-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ProjectTypes", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProjectTypesQuery,
  useGetProjectTypeByIdQuery,
  useCreateProjectTypeMutation,
  useUpdateProjectTypeMutation,
  useDeleteProjectTypeMutation,
} = projectTypesApi;
