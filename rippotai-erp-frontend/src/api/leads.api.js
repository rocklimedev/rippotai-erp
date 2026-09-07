// src/api/leads.api.js

import { baseApi } from "../store/baseApi";

// Change this to however you currently identify the connected Bigin account.
// Ideally this comes from your authenticated user's/company integration settings.
const OWNER_KEY = "default";

const PIPELINE_STAGES = [
  {
    id: "new",
    label: "New",
  },
  {
    id: "contacted",
    label: "Contacted",
  },
  {
    id: "qualified",
    label: "Qualified",
  },
  {
    id: "proposed",
    label: "Proposed",
  },
  {
    id: "won",
    label: "Won",
  },
  {
    id: "lost",
    label: "Lost",
  },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const getValue = (record, ...keys) => {
  for (const key of keys) {
    if (
      record?.[key] !== undefined &&
      record?.[key] !== null &&
      record?.[key] !== ""
    ) {
      return record[key];
    }
  }

  return null;
};

const normalizeLead = (record) => {
  const stage = getValue(
    record,
    "Stage",
    "stage",
    "Lead_Status",
    "lead_status",
    "Status",
    "status",
  );

  const budget = getValue(
    record,
    "Budget",
    "budget",
    "Budget_Value",
    "budgetValue",
    "Amount",
    "amount",
    "Value",
    "value",
  );

  return {
    ...record,

    id: record.id ?? record.Id,

    name:
      getValue(record, "Lead_Name", "Lead Name", "Name", "name", "Full_Name") ||
      "Unnamed Lead",

    email: getValue(record, "Email", "email"),

    phone: getValue(record, "Phone", "phone", "Mobile"),

    company: getValue(record, "Company", "company"),

    stage: stage || "new",

    budgetValue: budget,

    owner: getValue(record, "Owner", "owner", "Lead_Owner"),

    createdAt: getValue(record, "Created_Time", "createdAt", "created_at"),

    updatedAt: getValue(record, "Modified_Time", "updatedAt", "updated_at"),
  };
};

const normalizeStage = (value) => {
  const input = String(value || "")
    .trim()
    .toLowerCase();

  if (!input) return "new";

  if (input.includes("contact")) return "contacted";
  if (input.includes("qualif")) return "qualified";
  if (input.includes("propos")) return "proposed";
  if (input.includes("won") || input.includes("closed won")) return "won";
  if (input.includes("lost") || input.includes("closed lost")) return "lost";

  return "new";
};

// ------------------------------------------------------------
// Board normalizer
// ------------------------------------------------------------

const buildBoard = (records = []) => {
  const leads = records.map(normalizeLead);

  const columns = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    leads: leads.filter((lead) => normalizeStage(lead.stage) === stage.id),
  }));

  const activeCount = leads.filter((lead) => {
    const stage = normalizeStage(lead.stage);

    return stage !== "won" && stage !== "lost";
  }).length;

  return {
    activeCount,
    totalCount: leads.length,
    columns,
    leads,
  };
};

// ============================================================
// API
// ============================================================

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ----------------------------------------------------------
    // PIPELINE BOARD
    // ----------------------------------------------------------

    getBoard: builder.query({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const result = await fetchWithBQ({
          url: `/zoho/bigin/${OWNER_KEY}/modules/Leads`,
          method: "GET",
          params: {
            fields:
              "id,Lead_Name,Name,First_Name,Last_Name,Email,Phone,Company,Stage,Budget,Amount,Owner,Created_Time,Modified_Time",
          },
        });

        if (result.error) {
          return {
            error: result.error,
          };
        }

        const records =
          result.data?.data ?? result.data?.records ?? result.data ?? [];

        return {
          data: buildBoard(records),
        };
      },

      providesTags: ["Leads"],
    }),

    // ----------------------------------------------------------
    // GET LEADS
    // ----------------------------------------------------------

    getLeads: builder.query({
      query: ({ ownerKey = OWNER_KEY, ...query } = {}) => ({
        url: `/zoho/bigin/${ownerKey}/modules/Leads`,
        method: "GET",
        params: {
          fields:
            "id,Lead_Name,Name,First_Name,Last_Name,Email,Phone,Company,Stage,Budget,Amount,Owner,Created_Time,Modified_Time",
          ...query,
        },
      }),

      transformResponse: (response) => {
        const records = response?.data ?? response?.records ?? response ?? [];

        return records.map(normalizeLead);
      },

      providesTags: ["Leads"],
    }),

    // ----------------------------------------------------------
    // GET ONE LEAD
    // ----------------------------------------------------------

    getLead: builder.query({
      query: ({ id, ownerKey = OWNER_KEY, ...query }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/Leads/${id}`,
        method: "GET",
        params: query,
      }),

      transformResponse: (response) => {
        const record =
          response?.data?.[0] ?? response?.data ?? response?.record ?? response;

        return normalizeLead(record);
      },

      providesTags: (result, error, { id }) => [{ type: "Leads", id }],
    }),

    // ----------------------------------------------------------
    // SEARCH LEADS
    // ----------------------------------------------------------

    searchLeads: builder.query({
      query: ({ ownerKey = OWNER_KEY, ...query }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/Leads/search`,
        method: "GET",
        params: query,
      }),

      transformResponse: (response) => {
        const records = response?.data ?? response?.records ?? response ?? [];

        return records.map(normalizeLead);
      },

      providesTags: ["Leads"],
    }),

    // ----------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------

    createLead: builder.mutation({
      query: ({ ownerKey = OWNER_KEY, ...body }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/Leads`,
        method: "POST",
        body,
      }),

      invalidatesTags: ["Leads"],
    }),

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    updateLead: builder.mutation({
      query: ({ id, ownerKey = OWNER_KEY, ...body }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/Leads/${id}`,
        method: "PUT",
        body,
      }),

      invalidatesTags: (result, error, { id }) => [
        "Leads",
        { type: "Leads", id },
      ],
    }),

    // ----------------------------------------------------------
    // MOVE STAGE
    // ----------------------------------------------------------

    moveStage: builder.mutation({
      query: ({ id, stage, ownerKey = OWNER_KEY }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/Leads/${id}`,
        method: "PUT",
        body: {
          Stage: stage,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Leads",
        { type: "Leads", id },
      ],
    }),

    // ============================================================
    // ADD NOTE TO LEAD
    // ============================================================

    addNote: builder.mutation({
      async queryFn({ id, text }, _api, _extraOptions, baseQuery) {
        try {
          // Bigin Notes are created as a separate record.
          const result = await baseQuery({
            url: `/zoho/bigin/${OWNER_KEY}/modules/Notes`,
            method: "POST",
            body: {
              Note_Title: "Lead Remark",
              Note_Content: text,

              // Relate the note to the Lead.
              Parent_Id: id,
              Parent_Module: "Leads",
            },
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error?.message || "Failed to add note",
            },
          };
        }
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Leads", id },
        "Leads",
      ],
    }),

    // ============================================================
    // SET / UPDATE PROPOSAL
    // ============================================================

    setProposal: builder.mutation({
      async queryFn(
        { id, amount, timeline, remarks },
        _api,
        _extraOptions,
        baseQuery,
      ) {
        try {
          const result = await baseQuery({
            url: `/zoho/bigin/${OWNER_KEY}/modules/Leads/${id}`,
            method: "PUT",
            body: {
              // IMPORTANT:
              // These field API names must match your Bigin Leads fields.
              Stage: "Proposed",

              Quoted_Amount: amount,
              Proposal_Timeline: timeline,
              Proposal_Remarks: remarks || "",
            },
          });

          if (result.error) {
            return { error: result.error };
          }

          return { data: result.data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error?.message || "Failed to save proposal",
            },
          };
        }
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Leads", id },
        "Leads",
      ],
    }),

    // ----------------------------------------------------------
    // DELETE
    // ----------------------------------------------------------

    deleteLead: builder.mutation({
      query: ({ id, ownerKey = OWNER_KEY }) => ({
        url: `/zoho/bigin/${ownerKey}/modules/Leads/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Leads"],
    }),
  }),

  overrideExisting: true,
});

export const {
  useGetBoardQuery,
  useGetLeadsQuery,
  useGetLeadQuery,
  useSearchLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useMoveStageMutation,
  useDeleteLeadMutation,
  useAddNoteMutation,
  useSetProposalMutation,
} = leadsApi;
