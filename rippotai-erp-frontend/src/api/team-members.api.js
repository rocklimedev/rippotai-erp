import { baseApi } from "../store/baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // TEAM MEMBERS
    // =========================

    getTeamMembers: builder.query({
      query: ({ ownerType, ownerId }) => `/team/${ownerType}/${ownerId}`,
      providesTags: ["TeamMembers"],
    }),

    addTeamMember: builder.mutation({
      query: ({ ownerType, ownerId, ...body }) => ({
        url: `/team/${ownerType}/${ownerId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TeamMembers"],
    }),

    replaceTeamMembers: builder.mutation({
      query: ({ ownerType, ownerId, members }) => ({
        url: `/team/${ownerType}/${ownerId}`,
        method: "PUT",
        body: members,
      }),
      invalidatesTags: ["TeamMembers"],
    }),

    updateTeamMember: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/team/members/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["TeamMembers"],
    }),

    deleteTeamMember: builder.mutation({
      query: (id) => ({
        url: `/team/members/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeamMembers"],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetTeamMembersQuery,
  useLazyGetTeamMembersQuery,

  useAddTeamMemberMutation,

  useReplaceTeamMembersMutation,

  useUpdateTeamMemberMutation,

  useDeleteTeamMemberMutation,
} = teamApi;
