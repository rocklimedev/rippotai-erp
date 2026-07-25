import { baseApi } from "../store/baseApi";

export const briefApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProjectBrief: builder.mutation({
      query: (body) => ({
        url: "/documents/forms/project-brief",
        method: "POST",
        body, // { project_id, sections }
      }),
      invalidatesTags: ["ProjectBrief"],
    }),

    getProjectBriefs: builder.query({
      query: ({ project_id, status } = {}) => ({
        url: "/documents/forms/project-brief",
        method: "GET",
        params: { project_id, status },
      }),
      providesTags: ["ProjectBrief"],
    }),

    deleteProjectBrief: builder.mutation({
      query: (id) => ({
        url: `/documents/forms/project-brief/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProjectBrief"],
    }),

    getProjectBrief: builder.query({
      query: (id) => ({
        url: `/documents/forms/project-brief/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "ProjectBrief", id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateProjectBriefMutation,
  useGetProjectBriefsQuery,
  useGetProjectBriefQuery,
  useDeleteProjectBriefMutation,
} = briefApi;
