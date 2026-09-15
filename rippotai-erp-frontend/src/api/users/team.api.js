import { baseApi } from "../../store/baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // GENERIC / OWNER-SCOPED TEAM
    // /team/:ownerType/:ownerId
    // ============================================================

    getOwnerTeam: builder.query({
      query: ({ ownerType, ownerId }) => `/team/${ownerType}/${ownerId}`,
      providesTags: (_res, _err, { ownerType, ownerId }) => [
        { type: "TeamMembers", id: `${ownerType}-${ownerId}` },
        "TeamMembers",
      ],
    }),

    addOwnerTeamMember: builder.mutation({
      query: ({ ownerType, ownerId, ...body }) => ({
        url: `/team/${ownerType}/${ownerId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TeamMembers"],
    }),

    replaceOwnerTeam: builder.mutation({
      query: ({ ownerType, ownerId, members }) => ({
        url: `/team/${ownerType}/${ownerId}`,
        method: "PUT",
        body: members,
      }),
      invalidatesTags: ["TeamMembers"],
    }),

    updateMember: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/team/members/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["TeamMembers", "Teams"],
    }),

    removeMember: builder.mutation({
      query: (id) => ({
        url: `/team/members/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeamMembers", "Teams"],
    }),

    // ============================================================
    // TEAMS
    // /team/teams
    // ============================================================

    getTeams: builder.query({
      query: () => "/team/teams",
      providesTags: ["Teams"],
    }),

    getTeamById: builder.query({
      query: (id) => `/team/teams/${id}`,
      providesTags: (_res, _err, id) => [
        { type: "Teams", id },
        { type: "TeamMembers", id },
        { type: "TeamAccess", id },
      ],
    }),

    createTeam: builder.mutation({
      query: (body) => ({
        url: "/team/teams",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Teams"],
    }),

    updateTeam: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/team/teams/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Teams"],
    }),

    activateTeam: builder.mutation({
      query: (id) => ({
        url: `/team/teams/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Teams"],
    }),

    deactivateTeam: builder.mutation({
      query: (id) => ({
        url: `/team/teams/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Teams"],
    }),

    deleteTeam: builder.mutation({
      query: (id) => ({
        url: `/team/teams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teams", "TeamMembers", "TeamAccess"],
    }),

    // ============================================================
    // TEAM MEMBERS
    // /team/teams/:teamId/members
    // ============================================================

    getTeamMembers: builder.query({
      query: (teamId) => `/team/teams/${teamId}/members`,
      providesTags: (_res, _err, teamId) => [
        { type: "TeamMembers", id: teamId },
        "TeamMembers",
      ],
    }),

    addTeamMember: builder.mutation({
      query: ({ teamId, ...body }) => ({
        url: `/team/teams/${teamId}/members`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { teamId }) => [
        { type: "TeamMembers", id: teamId },
        { type: "Teams", id: teamId },
        "TeamMembers",
      ],
    }),

    getTeamMemberById: builder.query({
      query: (memberId) => `/team/teams/members/${memberId}`,
      providesTags: (_res, _err, memberId) => [
        { type: "TeamMember", id: memberId },
      ],
    }),

    updateTeamMember: builder.mutation({
      query: ({ memberId, ...body }) => ({
        url: `/team/teams/members/${memberId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["TeamMembers", "TeamMember", "Teams"],
    }),

    makeMemberPrimary: builder.mutation({
      query: (memberId) => ({
        url: `/team/teams/members/${memberId}/primary`,
        method: "PATCH",
      }),
      invalidatesTags: ["TeamMembers", "TeamMember", "Teams"],
    }),

    removeTeamMember: builder.mutation({
      query: (memberId) => ({
        url: `/team/teams/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeamMembers", "TeamMember", "Teams"],
    }),

    // ============================================================
    // TEAM SECTIONS
    // /team/sections
    // ============================================================

    getTeamSections: builder.query({
      query: () => "/team/sections",
      providesTags: ["TeamSections"],
    }),

    getTeamSectionById: builder.query({
      query: (id) => `/team/sections/${id}`,
      providesTags: (_res, _err, id) => [{ type: "TeamSections", id }],
    }),

    createTeamSection: builder.mutation({
      query: (body) => ({
        url: "/team/sections",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TeamSections", "TeamAccess"],
    }),

    updateTeamSection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/team/sections/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["TeamSections", "TeamAccess"],
    }),

    deleteTeamSection: builder.mutation({
      query: (id) => ({
        url: `/team/sections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeamSections", "TeamAccess"],
    }),

    // ============================================================
    // TEAM SECTION ACCESS
    // ============================================================

    // GET /team/teams/:teamId/access
    getTeamAccessMatrix: builder.query({
      query: (teamId) => `/team/teams/${teamId}/access`,
      providesTags: (_res, _err, teamId) => [
        { type: "TeamAccess", id: teamId },
        "TeamAccess",
      ],
    }),

    // GET /team/teams/:teamId/section-access
    getTeamSectionAccess: builder.query({
      query: (teamId) => `/team/teams/${teamId}/section-access`,
      providesTags: (_res, _err, teamId) => [
        { type: "TeamAccess", id: teamId },
        "TeamAccess",
      ],
    }),

    // GET /team/teams/:teamId/section-access/:sectionId
    getSectionAccess: builder.query({
      query: ({ teamId, sectionId }) =>
        `/team/teams/${teamId}/section-access/${sectionId}`,
      providesTags: (_res, _err, { teamId, sectionId }) => [
        {
          type: "TeamSectionAccess",
          id: `${teamId}-${sectionId}`,
        },
        { type: "TeamAccess", id: teamId },
      ],
    }),

    // PUT /team/teams/:teamId/section-access/:sectionId
    setSectionAccess: builder.mutation({
      query: ({ teamId, sectionId, ...body }) => ({
        url: `/team/teams/${teamId}/section-access/${sectionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, { teamId, sectionId }) => [
        "TeamAccess",
        {
          type: "TeamAccess",
          id: teamId,
        },
        {
          type: "TeamSectionAccess",
          id: `${teamId}-${sectionId}`,
        },
      ],
    }),

    // POST /team/teams/:teamId/section-access/bulk
    bulkSetSectionAccess: builder.mutation({
      query: ({ teamId, ...body }) => ({
        url: `/team/teams/${teamId}/section-access/bulk`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { teamId }) => [
        "TeamAccess",
        {
          type: "TeamAccess",
          id: teamId,
        },
        "TeamSectionAccess",
      ],
    }),

    // DELETE /team/teams/:teamId/section-access/:sectionId
    removeSectionAccess: builder.mutation({
      query: ({ teamId, sectionId }) => ({
        url: `/team/teams/${teamId}/section-access/${sectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { teamId, sectionId }) => [
        "TeamAccess",
        {
          type: "TeamAccess",
          id: teamId,
        },
        {
          type: "TeamSectionAccess",
          id: `${teamId}-${sectionId}`,
        },
      ],
    }),

    // ============================================================
    // USER ACCESS
    // ============================================================

    // GET /team/users/:userId
    getUserTeams: builder.query({
      query: (userId) => `/team/users/${userId}`,
      providesTags: (_res, _err, userId) => [
        {
          type: "UserTeams",
          id: userId,
        },
        "UserTeams",
      ],
    }),

    // GET /team/users/:userId/sections/:sectionId/access
    getUserSectionAccess: builder.query({
      query: ({ userId, sectionId }) =>
        `/team/users/${userId}/sections/${sectionId}/access`,
      providesTags: (_res, _err, { userId, sectionId }) => [
        {
          type: "UserSectionAccess",
          id: `${userId}-${sectionId}`,
        },
      ],
    }),
  }),

  overrideExisting: false,
});

// ============================================================
// EXPORT HOOKS
// ============================================================

export const {
  // Owner-scoped team
  useGetOwnerTeamQuery,
  useAddOwnerTeamMemberMutation,
  useReplaceOwnerTeamMutation,
  useUpdateMemberMutation,
  useRemoveMemberMutation,

  // Teams
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useActivateTeamMutation,
  useDeactivateTeamMutation,
  useDeleteTeamMutation,

  // Team members
  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useGetTeamMemberByIdQuery,
  useUpdateTeamMemberMutation,
  useMakeMemberPrimaryMutation,
  useRemoveTeamMemberMutation,

  // Team sections
  useGetTeamSectionsQuery,
  useGetTeamSectionByIdQuery,
  useCreateTeamSectionMutation,
  useUpdateTeamSectionMutation,
  useDeleteTeamSectionMutation,

  // Team section access
  useGetTeamAccessMatrixQuery,
  useGetTeamSectionAccessQuery,
  useGetSectionAccessQuery,
  useSetSectionAccessMutation,
  useBulkSetSectionAccessMutation,
  useRemoveSectionAccessMutation,

  // User access
  useGetUserTeamsQuery,
  useGetUserSectionAccessQuery,
} = teamApi;
