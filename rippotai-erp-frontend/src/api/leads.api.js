// src/api/leads.api.js

import { baseApi } from "../store/baseApi";

// ------------------------------------------------------------
// OWNER KEY RESOLUTION
// ------------------------------------------------------------
// The backend keys a connected Zoho/Bigin token by the
// authenticated user's id (see ZohoOAuthController.callback,
// which stores the token under req.user.id from the JWT).
//
// AuthProvider (see src/context/AuthContext.jsx) persists the
// logged-in user to localStorage under "bc_user" rather than
// putting it in Redux state, so we read it from there. This must
// stay in sync with whatever id AuthProvider stores as `user.id`.
const getOwnerKey = () => {
  try {
    const raw = localStorage.getItem("bc_user");
    const user = raw ? JSON.parse(raw) : null;

    return user?.id ?? user?._id ?? null;
  } catch {
    return null;
  }
};

// ------------------------------------------------------------
// BIGIN MODULE
// ------------------------------------------------------------
// Bigin's "Leads" and "Pipelines" are DIFFERENT modules with
// DIFFERENT record ids. This board reads deals/opportunities
// (Stage, Amount, Closing_Date) which live on Pipelines — so
// every endpoint in this file (read AND write) must target the
// same module, or an id fetched from one module will 404/patch
// the wrong record when used against the other.
//
// If you separately need Bigin's actual pre-conversion "Leads"
// module (name/email/phone capture before it becomes a deal),
// that is a distinct, second set of endpoints — not this file.
const MODULE = "Pipelines";

// ------------------------------------------------------------
// STAGE MAPPING (READ)
// ------------------------------------------------------------
// Bigin's Stage field is an org-configured picklist. Real values
// look like "Qualification", "Proposal/Price Quote",
// "Closed Won", "Closed Lost" — not the lowercase ids the UI
// uses internally. This maps *incoming* Bigin values -> internal
// column ids for grouping onto the board.
const normalizeStage = (value) => {
  const input = String(value || "")
    .trim()
    .toLowerCase();

  if (!input) return "new";

  if (input.includes("contact")) return "contacted";
  if (input.includes("qualif")) return "qualified";
  if (input.includes("propos") || input.includes("quote")) return "proposed";
  if (input.includes("won")) return "won";
  if (input.includes("lost")) return "lost";

  return "new";
};

// ------------------------------------------------------------
// STAGE MAPPING (WRITE)
// ------------------------------------------------------------
// The reverse direction. When the board drags a card into a
// column, or a modal marks something "Proposed", we must send
// back one of YOUR org's actual picklist labels — not the
// internal id — or Bigin will reject the update.
//
// CONFIRM THESE against Setup → Modules and Fields → Pipelines →
// Stage in your Bigin org, then adjust the right-hand values to
// match exactly (case-sensitive).
const STAGE_WRITE_LABELS = {
  new: "Qualification",
  contacted: "Contact Made",
  qualified: "Qualification",
  proposed: "Proposal/Price Quote",
  won: "Closed Won",
  lost: "Closed Lost",
};

const toWriteStage = (columnId) =>
  STAGE_WRITE_LABELS[columnId] ?? STAGE_WRITE_LABELS.new;

const PIPELINE_STAGES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "proposed", label: "Proposed" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
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

// Bigin returns MANY fields as lookup objects, not plain strings —
// Owner: { name, id, email }, Account_Name: { name, id },
// Contact_Name: { name, id }, Pipeline: { name, id }. Any of these
// rendered directly as a JSX child crashes React ("Objects are not
// valid as a React child"), so every one must be flattened here,
// not just Owner.
const flattenRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === "string") return ref;

  return ref.name || ref.email || null;
};

const normalizeLead = (record) => {
  const stage = getValue(record, "Stage", "stage");

  const budget = getValue(
    record,
    "Amount",
    "amount",
    "Budget",
    "budget",
    "Budget_Value",
    "budgetValue",
  );

  return {
    ...record,

    id: record.id ?? record.Id,

    // Pipelines module field is Deal_Name (not Lead_Name).
    name: getValue(record, "Deal_Name", "Name", "name") || "Unnamed Deal",

    // Account_Name / Contact_Name are lookup objects on Pipelines
    // records ({ name, id }) — flatten before use, and null is a
    // normal value here (a deal with no linked account/contact yet).
    company: flattenRef(record.Account_Name) ?? getValue(record, "Company"),

    contact: flattenRef(record.Contact_Name),

    companyId: record?.Account_Name?.id ?? null,

    contactId: record?.Contact_Name?.id ?? null,

    email: getValue(record, "Email", "email"),

    phone: getValue(record, "Phone", "phone", "Mobile"),

    pipelineName: flattenRef(record.Pipeline),

    // Raw Bigin picklist label, kept as-is for display/debugging.
    rawStage: stage,

    // Normalized column id used by the board for grouping.
    stage: normalizeStage(stage),

    budgetValue: budget,

    owner: flattenRef(record.Owner) ?? getValue(record, "owner"),

    ownerId: record?.Owner?.id ?? null,

    closingDate: getValue(record, "Closing_Date", "closingDate"),

    createdAt: getValue(record, "Created_Time", "createdAt", "created_at"),

    updatedAt: getValue(record, "Modified_Time", "updatedAt", "updated_at"),
  };
};

// ------------------------------------------------------------
// Board normalizer
// ------------------------------------------------------------

const buildBoard = (records = []) => {
  const leads = records.map(normalizeLead);

  const columns = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    leads: leads.filter((lead) => lead.stage === stage.id),
  }));

  const activeCount = leads.filter(
    (lead) => lead.stage !== "won" && lead.stage !== "lost",
  ).length;

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
        const ownerKey = getOwnerKey();

        if (!ownerKey) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No authenticated user found. Please log in again.",
            },
          };
        }

        const result = await fetchWithBQ({
          url: `/zoho/bigin/${ownerKey}/modules/${MODULE}`,
          method: "GET",
          params: {
            fields:
              "id,Deal_Name,Account_Name,Contact_Name,Amount,Stage,Pipeline,Closing_Date,Owner,Created_Time,Modified_Time",
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
    // GET LEADS (list of Pipelines records)
    // ----------------------------------------------------------

    getLeads: builder.query({
      query: ({ ownerKey, ...query } = {}) => ({
        url: `/zoho/bigin/${ownerKey ?? getOwnerKey()}/modules/${MODULE}`,
        method: "GET",
        params: {
          fields:
            "id,Deal_Name,Account_Name,Contact_Name,Amount,Stage,Pipeline,Closing_Date,Owner,Created_Time,Modified_Time",
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
    // GET ONE
    // ----------------------------------------------------------

    getLead: builder.query({
      query: ({ id, ownerKey, ...query }) => ({
        url: `/zoho/bigin/${ownerKey ?? getOwnerKey()}/modules/${MODULE}/${id}`,
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
    // SEARCH
    // ----------------------------------------------------------

    searchLeads: builder.query({
      query: ({ ownerKey, ...query }) => ({
        url: `/zoho/bigin/${ownerKey ?? getOwnerKey()}/modules/${MODULE}/search`,
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
      query: ({ ownerKey, ...body }) => ({
        url: `/zoho/bigin/${ownerKey ?? getOwnerKey()}/modules/${MODULE}`,
        method: "POST",
        body,
      }),

      invalidatesTags: ["Leads"],
    }),

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    updateLead: builder.mutation({
      query: ({ id, ownerKey, ...body }) => ({
        url: `/zoho/bigin/${ownerKey ?? getOwnerKey()}/modules/${MODULE}/${id}`,
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
    // `stage` arrives as the internal column id ("won", "proposed",
    // etc.) from drag-and-drop — translate it to the org's real
    // Bigin picklist label before writing, or Zoho rejects it.

    moveStage: builder.mutation({
      query: ({ id, stage, ownerKey }) => ({
        url: `/zoho/bigin/${ownerKey ?? getOwnerKey()}/modules/${MODULE}/${id}`,
        method: "PUT",
        body: {
          Stage: toWriteStage(stage),
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        "Leads",
        { type: "Leads", id },
      ],
    }),

    // ============================================================
    // ADD NOTE
    // ============================================================
    // Bigin notes are NOT a standalone module with Parent_Id/
    // Parent_Module (that's Zoho CRM's shape). In Bigin they're a
    // sub-resource of the parent record:
    //   POST /{module}/{record_id}/Notes
    // body: { data: [{ Note_Title, Note_Content }] }

    addNote: builder.mutation({
      async queryFn({ id, text, ownerKey }, _api, _extraOptions, baseQuery) {
        try {
          const resolvedOwnerKey = ownerKey ?? getOwnerKey();

          if (!resolvedOwnerKey) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "No authenticated user found. Please log in again.",
              },
            };
          }

          if (!id) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "Missing record id for note.",
              },
            };
          }

          const result = await baseQuery({
            url: `/zoho/bigin/${resolvedOwnerKey}/modules/${MODULE}/${id}/Notes`,
            method: "POST",
            body: {
              data: [
                {
                  Note_Title: "Lead Remark",
                  Note_Content: text,
                },
              ],
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
    // Custom fields (Quoted_Amount, Proposal_Timeline,
    // Proposal_Remarks) must exist on your Pipelines module layout
    // in Bigin — confirm the exact API names under Setup → Modules
    // and Fields → Pipelines if these were renamed.

    setProposal: builder.mutation({
      async queryFn(
        { id, amount, timeline, remarks, ownerKey },
        _api,
        _extraOptions,
        baseQuery,
      ) {
        try {
          const resolvedOwnerKey = ownerKey ?? getOwnerKey();

          if (!resolvedOwnerKey) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "No authenticated user found. Please log in again.",
              },
            };
          }

          const result = await baseQuery({
            url: `/zoho/bigin/${resolvedOwnerKey}/modules/${MODULE}/${id}`,
            method: "PUT",
            body: {
              Stage: toWriteStage("proposed"),

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
      query: ({ id, ownerKey }) => ({
        url: `/zoho/bigin/${ownerKey ?? getOwnerKey()}/modules/${MODULE}/${id}`,
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
