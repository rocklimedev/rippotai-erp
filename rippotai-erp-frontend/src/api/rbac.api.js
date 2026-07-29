import { baseApi } from "../store/baseApi";

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // ROLES (/rbac)
    // =========================

    createRole: builder.mutation({
      query: (body) => ({
        url: "/rbac",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    getRoles: builder.query({
      query: () => "/rbac",
      providesTags: ["Roles"],
    }),

    getRoleById: builder.query({
      query: (id) => `/rbac/${id}`,
      providesTags: ["Roles"],
    }),

    getRoleWithAccess: builder.query({
      query: (id) => `/rbac/${id}/access`,
      providesTags: (_res, _err, id) => [
        { type: "Roles", id },
        "RoleApps",
        "RolePermissions",
      ],
    }),

    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/rbac/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Roles", "RoleApps"],
    }),

    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/rbac/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles", "RoleApps", "RolePermissions"],
    }),

    // =========================
    // PERMISSIONS (/permissions)
    // =========================

    createPermission: builder.mutation({
      query: (body) => ({
        url: "/permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Permissions"],
    }),

    getPermissions: builder.query({
      query: (resource) =>
        resource ? `/permissions?resource=${resource}` : "/permissions",
      providesTags: ["Permissions"],
    }),

    getPermissionById: builder.query({
      query: (id) => `/permissions/${id}`,
      providesTags: ["Permissions"],
    }),

    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/permissions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Permissions"],
    }),

    deletePermission: builder.mutation({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permissions"],
    }),

    // =========================
    // ROLE-PERMISSIONS
    // =========================

    grantPermissionToRole: builder.mutation({
      query: (body) => ({
        url: "/role-permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RolePermissions"],
    }),

    bulkAssignPermissions: builder.mutation({
      query: (body) => ({
        url: "/role-permissions/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RolePermissions"],
    }),

    getRolePermissions: builder.query({
      query: (roleId) =>
        roleId ? `/role-permissions?role_id=${roleId}` : "/role-permissions",
      providesTags: ["RolePermissions"],
    }),
    getRolePermissionMatrix: builder.query({
      query: () => "/role-permissions/matrix",
      providesTags: ["RolePermissions"],
    }),
    revokeRolePermission: builder.mutation({
      query: ({ roleId, permissionId }) => ({
        url: `/role-permissions/${roleId}/${permissionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RolePermissions"],
    }),

    // =========================
    // ROLE-APPS
    // =========================

    grantAppToRole: builder.mutation({
      query: (body) => ({
        url: "/role-apps",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RoleApps"],
    }),

    bulkAssignApps: builder.mutation({
      query: (body) => ({
        url: "/role-apps/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RoleApps"],
    }),

    setRoleApps: builder.mutation({
      query: ({ roleId, app_codes, granted_by }) => ({
        url: `/role-apps/${roleId}`,
        method: "PUT",
        body: { app_codes, granted_by },
      }),
      invalidatesTags: ["RoleApps"],
    }),

    getRoleApps: builder.query({
      query: (roleId) =>
        roleId ? `/role-apps?role_id=${roleId}` : "/role-apps",
      providesTags: ["RoleApps"],
    }),

    getRoleAppMatrix: builder.query({
      query: () => "/role-apps/matrix",
      providesTags: ["RoleApps"],
    }),

    revokeRoleApp: builder.mutation({
      query: ({ roleId, appCode }) => ({
        url: `/role-apps/${roleId}/${appCode}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RoleApps"],
    }),
  }),
  overrideExisting: false,
});

// =========================
// EXPORT HOOKS
// =========================

export const {
  // roles
  useCreateRoleMutation,
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useGetRoleWithAccessQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,

  // permissions
  useCreatePermissionMutation,
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useGetRolePermissionMatrixQuery,

  // role-permissions
  useGrantPermissionToRoleMutation,
  useBulkAssignPermissionsMutation,
  useGetRolePermissionsQuery,
  useRevokeRolePermissionMutation,

  // role-apps
  useGrantAppToRoleMutation,
  useBulkAssignAppsMutation,
  useSetRoleAppsMutation,
  useGetRoleAppsQuery,
  useGetRoleAppMatrixQuery,
  useRevokeRoleAppMutation,
} = rbacApi;
