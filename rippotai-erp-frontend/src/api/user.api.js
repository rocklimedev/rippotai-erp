import { baseApi } from "../store/baseApi";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================================================
    // USERS
    // =========================================================

    // =========================
    // CREATE USER
    // =========================
    createUser: builder.mutation({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // =========================
    // GET ALL USERS
    // =========================
    getUsers: builder.query({
      query: ({ role_id, is_active } = {}) => {
        const params = new URLSearchParams();

        if (role_id) {
          params.append("role_id", role_id);
        }

        if (is_active !== undefined) {
          params.append("is_active", String(is_active));
        }

        const queryString = params.toString();

        return queryString ? `/users?${queryString}` : "/users";
      },
      providesTags: ["Users"],
    }),

    // =========================
    // GET USERS BY ROLE NAME
    //
    // Example:
    // useGetUsersByRoleNameQuery("Site Engineer")
    //
    // GET /users/by-role/Site%20Engineer
    // =========================
    getUsersByRoleName: builder.query({
      query: (roleName) => `/users/by-role/${encodeURIComponent(roleName)}`,
      providesTags: ["Users"],
    }),

    // =========================
    // GET ONE USER
    // =========================
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: ["Users"],
    }),

    // =========================
    // UPDATE USER (ADMIN)
    // =========================
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // =========================
    // UPDATE PROFILE (SELF)
    // =========================
    updateProfile: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/profile`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // =========================
    // UPLOAD AVATAR
    // =========================
    uploadAvatar: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();

        formData.append("avatar", file);

        return {
          url: `/users/${id}/avatar`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["Users"],
    }),

    // =========================
    // DEACTIVATE USER
    // =========================
    deactivateUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),

    // =========================
    // DELETE USER
    // =========================
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),

  overrideExisting: false,
});

// =========================================================
// EXPORT HOOKS
// =========================================================

export const {
  useCreateUserMutation,
  useGetUsersQuery,
  useGetUsersByRoleNameQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeactivateUserMutation,
  useDeleteUserMutation,
} = usersApi;
