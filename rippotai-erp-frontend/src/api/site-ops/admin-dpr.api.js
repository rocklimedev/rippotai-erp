import { baseApi } from '@/store/baseApi';

export const adminDprApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    listAdminDpr: builder.query({
      query: ({ kind = 'reports', ...params }) => ({ url: `/dpr/admin-${kind}`, params }),
      providesTags: ['AdminDpr'],
    }),
    saveAdminDpr: builder.mutation({
      query: ({ kind, id, ...body }) => ({
        url: `/dpr/admin-${kind}${id ? `/${id}` : ''}`,
        method: id ? 'PATCH' : 'POST', body,
      }),
      invalidatesTags: ['AdminDpr'],
    }),
    deleteAdminDpr: builder.mutation({
      query: ({ kind, id }) => ({ url: `/dpr/admin-${kind}/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminDpr'],
    }),
    downloadAdminDpr: builder.mutation({
      query: params => ({
        url: '/dpr/admin-reports/export', params,
        responseHandler: async response => {
          if (!response.ok) return response.json();
          const url = URL.createObjectURL(await response.blob());
          const link = document.createElement('a');
          link.href = url; link.download = 'admin-dpr.xlsx';
          document.body.appendChild(link); link.click(); link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return { downloaded: true };
        },
      }),
    }),
  }),
});

export const { useListAdminDprQuery, useSaveAdminDprMutation, useDeleteAdminDprMutation, useDownloadAdminDprMutation } = adminDprApi;
