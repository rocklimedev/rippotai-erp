import { baseApi } from "../store/baseApi";
export const termsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================================
    // GET ALL TEMPLATES
    // ==========================================================
    getTermsTemplates: builder.query({
      query: (scope) => ({
        url: "/terms-templates",
        method: "GET",
        params: scope ? { scope } : undefined,
      }),
      providesTags: ["TermsTemplates"],
    }),

    // ==========================================================
    // GET SINGLE TEMPLATE
    // ==========================================================
    getTermsTemplate: builder.query({
      query: (id) => ({
        url: `/terms-templates/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "TermsTemplates", id }],
    }),

    // ==========================================================
    // GET TEMPLATE VERSIONS
    // ==========================================================
    getTermsTemplateVersions: builder.query({
      query: (id) => ({
        url: `/terms-templates/${id}/versions`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "TermsVersions", id }],
    }),

    // ==========================================================
    // CREATE TEMPLATE
    // ==========================================================
    createTermsTemplate: builder.mutation({
      query: (body) => ({
        url: "/terms-templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TermsTemplates"],
    }),

    // ==========================================================
    // UPDATE TEMPLATE DETAILS
    // ==========================================================
    updateTermsTemplate: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/terms-templates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "TermsTemplates",
        { type: "TermsTemplates", id },
      ],
    }),

    // ==========================================================
    // UPDATE TEMPLATE CONTENT (Creates Version)
    // ==========================================================
    updateTermsTemplateContent: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/terms-templates/${id}/content`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "TermsTemplates",
        { type: "TermsTemplates", id },
        { type: "TermsVersions", id },
      ],
    }),

    // ==========================================================
    // DELETE TEMPLATE
    // ==========================================================
    deleteTermsTemplate: builder.mutation({
      query: (id) => ({
        url: `/terms-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TermsTemplates"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTermsTemplatesQuery,
  useGetTermsTemplateQuery,
  useGetTermsTemplateVersionsQuery,
  useCreateTermsTemplateMutation,
  useUpdateTermsTemplateMutation,
  useUpdateTermsTemplateContentMutation,
  useDeleteTermsTemplateMutation,
} = termsApi;
