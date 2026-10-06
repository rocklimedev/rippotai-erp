import { baseApi } from "../../store/baseApi";

export const workflowLibraryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkflowTeams: builder.query({
      query: () => "/workflow/library/teams",
      providesTags: ["Teams"],
    }),
  }),
});

export const { useGetWorkflowTeamsQuery } = workflowLibraryApi;
