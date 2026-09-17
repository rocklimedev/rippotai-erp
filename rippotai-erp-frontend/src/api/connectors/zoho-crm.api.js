import { baseApi } from "../../store/baseApi";

// ============================================================
// OWNER KEY
// ============================================================

const getOwnerKey = () => {
  try {
    const raw = localStorage.getItem("bc_user");

    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw);

    return user?.id ?? user?._id ?? null;
  } catch {
    return null;
  }
};

// ============================================================
// API
// Matches ZohoCrmController:
//
// GET  /zoho/bigin/:ownerKey/settings/modules
// GET  /zoho/bigin/:ownerKey/settings/fields?module=
// GET  /zoho/bigin/:ownerKey/users
// GET  /zoho/bigin/:ownerKey/org
// GET  /zoho/bigin/:ownerKey/modules/:module
// GET  /zoho/bigin/:ownerKey/modules/:module/search
// GET  /zoho/bigin/:ownerKey/modules/:module/:id
// POST /zoho/bigin/:ownerKey/modules/:module
// POST /zoho/bigin/:ownerKey/modules/:module/bulk
// PUT  /zoho/bigin/:ownerKey/modules/:module/:id
// DELETE /zoho/bigin/:ownerKey/modules/:module/:id
// + Contacts / Companies / Pipelines / Tasks / Events
// ============================================================

export const zohoCrmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================================
    // ZOHO BIGIN SETTINGS
    // ============================================================

    getZohoModules: builder.query({
      query: () => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/settings/modules`,
          method: "GET",
        };
      },
      providesTags: ["ZohoBiginModules"],
    }),

    getZohoFields: builder.query({
      query: ({ module } = {}) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/settings/fields`,
          method: "GET",
          params: module ? { module } : undefined,
        };
      },
      providesTags: (result, error, { module } = {}) => [
        {
          type: "ZohoBiginFields",
          id: module || "ALL",
        },
      ],
    }),

    getZohoUsers: builder.query({
      query: (query = {}) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/users`,
          method: "GET",
          params: query,
        };
      },
      providesTags: ["ZohoBiginUsers"],
    }),

    getZohoOrg: builder.query({
      query: () => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/org`,
          method: "GET",
        };
      },
      providesTags: ["ZohoBiginOrg"],
    }),

    // ============================================================
    // PIPELINES
    // ============================================================

    /**
     * GET Bigin Pipelines
     *
     * GET /zoho/bigin/:ownerKey/pipelines
     */
    getZohoPipelines: builder.query({
      query: (query = {}) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/pipelines`,
          method: "GET",
          params: query,
        };
      },

      providesTags: ["ZohoBiginPipelines"],
    }),

    /**
     * GET ONE PIPELINE
     *
     * GET /zoho/bigin/:ownerKey/pipelines/:id
     */
    getZohoPipeline: builder.query({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/pipelines/${encodeURIComponent(id)}`,
          method: "GET",
        };
      },

      providesTags: (result, error, id) => [
        {
          type: "ZohoBiginPipelines",
          id,
        },
      ],
    }),

    createZohoPipeline: builder.mutation({
      query: (body) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/pipelines`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginPipelines"],
    }),

    updateZohoPipeline: builder.mutation({
      query: ({ id, ...body }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/pipelines/${encodeURIComponent(id)}`,
          method: "PUT",
          body,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        "ZohoBiginPipelines",
        {
          type: "ZohoBiginPipelines",
          id,
        },
      ],
    }),

    deleteZohoPipeline: builder.mutation({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/pipelines/${encodeURIComponent(id)}`,
          method: "DELETE",
        };
      },

      invalidatesTags: ["ZohoBiginPipelines"],
    }),
    getZohoPipelineStageMap: builder.query({
      query: () => {
        const ownerKey = getOwnerKey();
        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/settings/pipeline-stage-map`,
          method: "GET",
        };
      },
      providesTags: ["ZohoBiginFields"],
    }),
    // ============================================================
    // GENERIC RECORDS
    // ============================================================

    getZohoRecords: builder.query({
      query: ({ module, ...query }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/modules/${encodeURIComponent(module)}`,
          method: "GET",
          params: query,
        };
      },

      providesTags: (result, error, { module }) => [
        {
          type: "ZohoBiginRecords",
          id: module,
        },
      ],
    }),

    getZohoRecord: builder.query({
      query: ({ module, id, ...query }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/modules/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
          method: "GET",
          params: query,
        };
      },

      providesTags: (result, error, { module, id }) => [
        {
          type: "ZohoBiginRecords",
          id: `${module}-${id}`,
        },
      ],
    }),

    searchZohoRecords: builder.query({
      query: ({ module, ...query }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/modules/${encodeURIComponent(module)}/search`,
          method: "GET",
          params: query,
        };
      },

      providesTags: (result, error, { module }) => [
        {
          type: "ZohoBiginSearch",
          id: module,
        },
      ],
    }),

    createZohoRecord: builder.mutation({
      query: ({ module, ...body }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/modules/${encodeURIComponent(module)}`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: (result, error, { module }) => [
        {
          type: "ZohoBiginRecords",
          id: module,
        },
        {
          type: "ZohoBiginSearch",
          id: module,
        },
      ],
    }),

    createZohoRecords: builder.mutation({
      query: ({ module, data }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/modules/${encodeURIComponent(module)}/bulk`,
          method: "POST",
          body: {
            data,
          },
        };
      },

      invalidatesTags: (result, error, { module }) => [
        {
          type: "ZohoBiginRecords",
          id: module,
        },
        {
          type: "ZohoBiginSearch",
          id: module,
        },
      ],
    }),

    updateZohoRecord: builder.mutation({
      query: ({ module, id, ...body }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/modules/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
          method: "PUT",
          body,
        };
      },

      invalidatesTags: (result, error, { module, id }) => [
        {
          type: "ZohoBiginRecords",
          id: module,
        },
        {
          type: "ZohoBiginRecords",
          id: `${module}-${id}`,
        },
        {
          type: "ZohoBiginSearch",
          id: module,
        },
      ],
    }),

    deleteZohoRecord: builder.mutation({
      query: ({ module, id }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/modules/${encodeURIComponent(module)}/${encodeURIComponent(id)}`,
          method: "DELETE",
        };
      },

      invalidatesTags: (result, error, { module, id }) => [
        {
          type: "ZohoBiginRecords",
          id: module,
        },
        {
          type: "ZohoBiginRecords",
          id: `${module}-${id}`,
        },
        {
          type: "ZohoBiginSearch",
          id: module,
        },
      ],
    }),

    // ============================================================
    // CONTACTS
    // ============================================================

    getZohoContacts: builder.query({
      query: (query = {}) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/contacts`,
          method: "GET",
          params: query,
        };
      },

      providesTags: ["ZohoBiginContacts"],
    }),

    getZohoContact: builder.query({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/contacts/${encodeURIComponent(id)}`,
          method: "GET",
        };
      },

      providesTags: (result, error, id) => [
        {
          type: "ZohoBiginContacts",
          id,
        },
      ],
    }),

    createZohoContact: builder.mutation({
      query: (body) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/contacts`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginContacts"],
    }),

    updateZohoContact: builder.mutation({
      query: ({ id, ...body }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/contacts/${encodeURIComponent(id)}`,
          method: "PUT",
          body,
        };
      },

      invalidatesTags: (result, error, { id }) => [
        "ZohoBiginContacts",
        {
          type: "ZohoBiginContacts",
          id,
        },
      ],
    }),

    deleteZohoContact: builder.mutation({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/contacts/${encodeURIComponent(id)}`,
          method: "DELETE",
        };
      },

      invalidatesTags: ["ZohoBiginContacts"],
    }),

    // ============================================================
    // COMPANIES
    // ============================================================

    getZohoCompanies: builder.query({
      query: (query = {}) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/companies`,
          method: "GET",
          params: query,
        };
      },

      providesTags: ["ZohoBiginCompanies"],
    }),

    getZohoCompany: builder.query({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/companies/${encodeURIComponent(id)}`,
          method: "GET",
        };
      },

      providesTags: (result, error, id) => [
        {
          type: "ZohoBiginCompanies",
          id,
        },
      ],
    }),

    createZohoCompany: builder.mutation({
      query: (body) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/companies`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginCompanies"],
    }),

    updateZohoCompany: builder.mutation({
      query: ({ id, ...body }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/companies/${encodeURIComponent(id)}`,
          method: "PUT",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginCompanies"],
    }),

    deleteZohoCompany: builder.mutation({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/companies/${encodeURIComponent(id)}`,
          method: "DELETE",
        };
      },

      invalidatesTags: ["ZohoBiginCompanies"],
    }),

    // ============================================================
    // TASKS
    // ============================================================

    getZohoTasks: builder.query({
      query: (query = {}) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/tasks`,
          method: "GET",
          params: query,
        };
      },

      providesTags: ["ZohoBiginTasks"],
    }),

    getZohoTask: builder.query({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/tasks/${encodeURIComponent(id)}`,
          method: "GET",
        };
      },

      providesTags: (result, error, id) => [
        {
          type: "ZohoBiginTasks",
          id,
        },
      ],
    }),

    createZohoTask: builder.mutation({
      query: (body) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/tasks`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginTasks"],
    }),

    updateZohoTask: builder.mutation({
      query: ({ id, ...body }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/tasks/${encodeURIComponent(id)}`,
          method: "PUT",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginTasks"],
    }),

    deleteZohoTask: builder.mutation({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/tasks/${encodeURIComponent(id)}`,
          method: "DELETE",
        };
      },

      invalidatesTags: ["ZohoBiginTasks"],
    }),

    // ============================================================
    // EVENTS
    // ============================================================

    getZohoEvents: builder.query({
      query: (query = {}) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/events`,
          method: "GET",
          params: query,
        };
      },

      providesTags: ["ZohoBiginEvents"],
    }),

    getZohoEvent: builder.query({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/events/${encodeURIComponent(id)}`,
          method: "GET",
        };
      },

      providesTags: (result, error, id) => [
        {
          type: "ZohoBiginEvents",
          id,
        },
      ],
    }),

    createZohoEvent: builder.mutation({
      query: (body) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/events`,
          method: "POST",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginEvents"],
    }),

    updateZohoEvent: builder.mutation({
      query: ({ id, ...body }) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/events/${encodeURIComponent(id)}`,
          method: "PUT",
          body,
        };
      },

      invalidatesTags: ["ZohoBiginEvents"],
    }),

    deleteZohoEvent: builder.mutation({
      query: (id) => {
        const ownerKey = getOwnerKey();

        return {
          url: `/zoho/bigin/${encodeURIComponent(ownerKey || "")}/events/${encodeURIComponent(id)}`,
          method: "DELETE",
        };
      },

      invalidatesTags: ["ZohoBiginEvents"],
    }),
  }),

  overrideExisting: false,
});

// ============================================================
// HOOKS
// ============================================================

export const {
  // Settings
  useGetZohoModulesQuery,
  useGetZohoFieldsQuery,
  useGetZohoUsersQuery,
  useGetZohoOrgQuery,

  // Pipelines
  useGetZohoPipelinesQuery,
  useGetZohoPipelineQuery,
  useCreateZohoPipelineMutation,
  useUpdateZohoPipelineMutation,
  useDeleteZohoPipelineMutation,

  // Generic
  useGetZohoRecordsQuery,
  useGetZohoRecordQuery,
  useSearchZohoRecordsQuery,
  useCreateZohoRecordMutation,
  useCreateZohoRecordsMutation,
  useUpdateZohoRecordMutation,
  useDeleteZohoRecordMutation,
  useGetZohoPipelineStageMapQuery,
  // Contacts
  useGetZohoContactsQuery,
  useGetZohoContactQuery,
  useCreateZohoContactMutation,
  useUpdateZohoContactMutation,
  useDeleteZohoContactMutation,

  // Companies
  useGetZohoCompaniesQuery,
  useGetZohoCompanyQuery,
  useCreateZohoCompanyMutation,
  useUpdateZohoCompanyMutation,
  useDeleteZohoCompanyMutation,

  // Tasks
  useGetZohoTasksQuery,
  useGetZohoTaskQuery,
  useCreateZohoTaskMutation,
  useUpdateZohoTaskMutation,
  useDeleteZohoTaskMutation,

  // Events
  useGetZohoEventsQuery,
  useGetZohoEventQuery,
  useCreateZohoEventMutation,
  useUpdateZohoEventMutation,
  useDeleteZohoEventMutation,
} = zohoCrmApi;
