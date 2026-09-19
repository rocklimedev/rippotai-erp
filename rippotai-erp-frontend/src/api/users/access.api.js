import { baseApi } from '../../store/baseApi';

export const accessApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getAccessRoles: builder.query({
      query: scope => `/access/roles?scope=${encodeURIComponent(scope)}`,
      providesTags: ['Roles'],
    }),
  }),
});
export const { useGetAccessRolesQuery } = accessApi;
