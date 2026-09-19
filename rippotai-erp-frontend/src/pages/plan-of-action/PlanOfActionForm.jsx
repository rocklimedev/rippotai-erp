import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { PlanOfActionSectionForm } from "../../components/plan-of-action/PlanOfActionSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";

import {
  useGetProjectsQuery,
  useGetProjectPhasesQuery,
} from "../../api/projects/project.api";

import {
  useCreatePlanOfActionMutation,
  useGetPlanOfActionQuery,
  useUpdatePlanOfActionMutation,
} from "../../api/documents/plan-of-actions.api";

import { POA_SECTIONS } from "../../hooks/plan-of-action-sections";

import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Pencil,
  Eye,
  Code,
  Loader2,
} from "lucide-react";

import { useGetUsersQuery } from "../../api/users/user.api";
import {
  useGetTermsTemplatesQuery,
  useCreateTermsTemplateMutation,
  useUpdateTermsTemplateContentMutation,
} from "../../api/meta/terms.api";
import {
  useGetTeamsQuery,
  useGetTeamMembersQuery,
} from "../../api/users/team.api";

/* ============================================================
   ROLE SUGGESTIONS
============================================================ */

const ROLE_SUGGESTIONS = [
  "Principal Architect",
  "Project Lead",
  "Design Lead",
  "Site Supervisor",
  "Site Engineer",
];

/* ============================================================
   HELPERS
============================================================ */

const toNumberOrUndefined = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const number = Number(value);

  return Number.isNaN(number) ? undefined : number;
};

const calculateDurationLabel = (minDays, maxDays) => {
  const min =
    minDays !== "" && minDays !== null && minDays !== undefined
      ? Number(minDays)
      : null;

  const max =
    maxDays !== "" && maxDays !== null && maxDays !== undefined
      ? Number(maxDays)
      : null;

  if (min === null && max === null) {
    return "";
  }

  if (min !== null && max !== null) {
    if (min === max) {
      return `${min} days`;
    }

    return `${min}-${max} days`;
  }

  if (min !== null) {
    return `${min}+ days`;
  }

  return `Up to ${max} days`;
};

/**
 * Convert API Plan of Action response
 * into the exact structure expected by the form.
 */
const mapPlanOfActionToForm = (plan) => {
  if (!plan) {
    return {
      projectId: "",
      values: {
        Overview: {
          title: "Plan of Action",
          execution_description: "",
          total_duration_min_days: "",
          total_duration_max_days: "",
          total_duration_label: "",
        },

        phases: [],

        team_id: "",

        team_members: [],

        terms_template_id: "",
      },
    };
  }

  return {
    projectId: plan.project_id || "",

    values: {
      Overview: {
        title: plan.title || "Plan of Action",

        execution_description: plan.execution_description || "",

        total_duration_min_days: plan.total_duration_min_days ?? "",

        total_duration_max_days: plan.total_duration_max_days ?? "",

        total_duration_label: plan.total_duration_label || "",
      },

      phases: (plan.phases || []).map((phase, index) => {
        const poaPhase = phase.PlanOfActionPhase || {};

        return {
          id: crypto.randomUUID(),

          project_phase_id: phase.id,

          phase_number: phase.phase_number ?? index + 1,

          phase_code: phase.phase_code || "",

          title: phase.title || "",

          description: phase.description || "",

          duration_min_days: poaPhase.duration_min_days ?? "",

          duration_max_days: poaPhase.duration_max_days ?? "",

          parallel_work_note: poaPhase.parallel_work_note || "",

          inclusion_note: poaPhase.inclusion_note || "",

          gantt_start_offset_days: poaPhase.gantt_start_offset_days ?? 0,

          gantt_duration_days: poaPhase.gantt_duration_days ?? 0,

          sort_order: poaPhase.sort_order ?? index + 1,
        };
      }),

      /* ======================================================
         ADMIN TEAM
      ====================================================== */

      team_id:
        plan.team_id ||
        plan.team_members?.find((member) => member.team_id)?.team_id ||
        "",

      /* ======================================================
         TEAM MEMBERS
      ====================================================== */

      team_members: (plan.team_members || []).map((member) => ({
        id: crypto.randomUUID(),

        team_id: member.team_id || "",

        user_id: member.user_id || "",

        role_label: member.role_label || "",

        is_primary: Boolean(member.is_primary),
      })),

      terms_template_id: plan.terms_template_id || "",
    },
  };
};

/* ============================================================
   COMPONENT
============================================================ */

export function PlanOfActionForm() {
  const navigate = useNavigate();

  /*
   * If id exists:
   *
   * /plan-of-actions/:id/edit
   *
   * otherwise:
   *
   * /plan-of-actions/new
   */
  const { id } = useParams();

  const isEditMode = Boolean(id);

  /* ============================================================
     AUTOSAVE KEY
  ============================================================ */

  const SAVE_KEY = isEditMode
    ? `bc.plan-of-action.edit.${id}`
    : "bc.plan-of-action";

  /* ============================================================
     API QUERIES
  ============================================================ */

  const { data: projects = [] } = useGetProjectsQuery();

  const {
    data: existingPlanOfAction,
    isLoading: isLoadingPlan,
    isFetching: isFetchingPlan,
    error: planError,
  } = useGetPlanOfActionQuery(id, {
    skip: !isEditMode,
  });

  const [phaseSearch, setPhaseSearch] = useState("");

  const { data: projectPhases = [], isLoading: isLoadingPhases } =
    useGetProjectPhasesQuery({
      search: phaseSearch,
    });

  const { data: users = [] } = useGetUsersQuery();
  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeamsQuery();

  const [selectedTeamId, setSelectedTeamId] = useState("");

  const {
    data: teamMembersResponse,
    isLoading: isLoadingTeamMembers,
    isFetching: isFetchingTeamMembers,
  } = useGetTeamMembersQuery(selectedTeamId, {
    skip: !selectedTeamId,
  });

  const teamMembers = Array.isArray(teamMembersResponse)
    ? teamMembersResponse
    : teamMembersResponse?.data || teamMembersResponse?.items || [];

  const { data: termsTemplates = [], refetch: refetchTermsTemplates } =
    useGetTermsTemplatesQuery();

  const [createTermsTemplate, { isLoading: isCreatingTerms }] =
    useCreateTermsTemplateMutation();
  const [updateTermsContent, { isLoading: isSavingTermsContent }] =
    useUpdateTermsTemplateContentMutation();

  /* ============================================================
     MUTATIONS
  ============================================================ */

  const [createPlanOfAction, { isLoading: isCreating }] =
    useCreatePlanOfActionMutation();

  const [updatePlanOfAction, { isLoading: isUpdating }] =
    useUpdatePlanOfActionMutation();

  const isSubmitting = isCreating || isUpdating;

  /* ============================================================
     PROJECT
  ============================================================ */

  const [projectId, setProjectId] = useState("");

  /* ============================================================
     FORM STATE
  ============================================================ */

  const [values, setValues] = useAutoSave(SAVE_KEY, {
    Overview: {
      title: "Plan of Action",
      execution_description: "",
      total_duration_min_days: "",
      total_duration_max_days: "",
      total_duration_label: "",
    },

    phases: [],
    team_id: "",

    team_members: [],

    terms_template_id: "",
  });

  /* ============================================================
     TERMS CREATE / EDIT STATE
  ============================================================ */

  const [termsCreateOpen, setTermsCreateOpen] = useState(false);
  const [termsCreateForm, setTermsCreateForm] = useState({
    name: "",
    scope: "PROJECT",
    content_html: "",
  });
  const [termsCreatePreview, setTermsCreatePreview] = useState(false);

  const [editingTermsTemplate, setEditingTermsTemplate] = useState(null);
  const [termsEditContent, setTermsEditContent] = useState("");
  const [termsChangeNote, setTermsChangeNote] = useState("");
  const [termsEditPreview, setTermsEditPreview] = useState(false);

  /* ============================================================
     LOAD EXISTING POA FOR EDIT
  ============================================================ */

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    if (!existingPlanOfAction) {
      return;
    }

    const mapped = mapPlanOfActionToForm(existingPlanOfAction);

    setProjectId(mapped.projectId);

    setSelectedTeamId(mapped.values.team_id || "");

    setValues(mapped.values);
  }, [isEditMode, existingPlanOfAction, setValues]);

  /* ============================================================
     ERROR LOADING POA
  ============================================================ */

  useEffect(() => {
    if (isEditMode && planError) {
      console.error("Failed to load Plan of Action:", planError);

      toast.error("Failed to load Plan of Action.");
    }
  }, [isEditMode, planError]);

  /* ============================================================
     FIELD CHANGE
  ============================================================ */

  const handleFieldChange = (section, key, value) => {
    setValues((prev) => {
      const nextSection = {
        ...(prev[section] || {}),
        [key]: value,
      };

      /*
       * Automatically calculate total duration label
       * whenever minimum or maximum duration changes.
       */
      if (
        section === "Overview" &&
        (key === "total_duration_min_days" || key === "total_duration_max_days")
      ) {
        nextSection.total_duration_label = calculateDurationLabel(
          nextSection.total_duration_min_days,
          nextSection.total_duration_max_days,
        );
      }

      return {
        ...prev,
        [section]: nextSection,
      };
    });
  };

  /* ============================================================
     PHASES SECTION
  ============================================================ */

  const renderPhasesSection = () => {
    const selectedPhases = values.phases || [];

    /* ========================================================
       CHECK SELECTED
    ======================================================== */

    const isSelected = (phaseId) => {
      return selectedPhases.some((phase) => phase.project_phase_id === phaseId);
    };

    /* ========================================================
       ADD PHASE
    ======================================================== */

    const addPhase = (phase) => {
      if (!phase?.id) {
        return;
      }

      if (isSelected(phase.id)) {
        return;
      }

      const nextOrder = selectedPhases.length + 1;

      setValues((prev) => ({
        ...prev,

        phases: [
          ...(prev.phases || []),

          {
            /*
             * Local UI ID only.
             */
            id: crypto.randomUUID(),

            /*
             * IMPORTANT:
             * Existing reusable ProjectPhase ID.
             */
            project_phase_id: phase.id,

            /*
             * Master phase data
             */
            phase_number: nextOrder,

            phase_code: phase.phase_code || "",

            title: phase.title || "",

            description: phase.description ?? "",

            /*
             * POA-specific configuration
             */
            duration_min_days: "",

            duration_max_days: "",

            parallel_work_note: "",

            inclusion_note: "",

            gantt_start_offset_days: 0,

            gantt_duration_days: 0,

            /*
             * Ordering
             */
            sort_order: nextOrder,
          },
        ],
      }));
    };

    /* ========================================================
       REMOVE PHASE
    ======================================================== */

    const removePhase = (phaseId) => {
      setValues((prev) => {
        const remaining = (prev.phases || []).filter(
          (phase) => phase.project_phase_id !== phaseId,
        );

        return {
          ...prev,

          phases: remaining.map((phase, index) => ({
            ...phase,

            phase_number: index + 1,

            sort_order: index + 1,
          })),
        };
      });
    };

    /* ========================================================
       MOVE PHASE
    ======================================================== */

    const movePhase = (index, direction) => {
      setValues((prev) => {
        const phases = [...(prev.phases || [])];

        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= phases.length) {
          return prev;
        }

        [phases[index], phases[newIndex]] = [phases[newIndex], phases[index]];

        return {
          ...prev,

          phases: phases.map((phase, i) => ({
            ...phase,

            phase_number: i + 1,

            sort_order: i + 1,
          })),
        };
      });
    };

    /* ========================================================
       UPDATE PHASE
    ======================================================== */

    const updatePhase = (index, field, value) => {
      setValues((prev) => ({
        ...prev,

        phases: (prev.phases || []).map((phase, i) =>
          i === index
            ? {
                ...phase,
                [field]: value,
              }
            : phase,
        ),
      }));
    };

    /* ========================================================
       AVAILABLE PHASES
    ======================================================== */

    const availablePhases = projectPhases.filter(
      (phase) => !isSelected(phase.id),
    );

    /* ========================================================
       RENDER
    ======================================================== */

    return (
      <div className="space-y-6">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Execution Phases</h3>

            <p className="text-sm text-[#6B7B7C] mt-1">
              Select reusable project phases and configure them for this Plan of
              Action.
            </p>
          </div>

          <span className="text-sm text-[#6B7B7C]">
            {selectedPhases.length} selected
          </span>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3A5]"
          />

          <input
            type="text"
            value={phaseSearch}
            onChange={(e) => setPhaseSearch(e.target.value)}
            placeholder="Search phases by code, title or description..."
            className="bc-input w-full pl-10"
          />
        </div>

        {/* ==================================================
            AVAILABLE PHASES
        ================================================== */}

        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h4 className="font-semibold text-[#333333]">Available Phases</h4>

            <p className="text-xs text-[#94A3A5] mt-1">
              Select a reusable phase to add it to this Plan of Action.
            </p>
          </div>

          <div className="p-5">
            {isLoadingPhases ? (
              <div className="text-sm text-[#6B7B7C]">Loading phases...</div>
            ) : (
              <select
                className="bc-input h-10 w-full"
                value=""
                onChange={(e) => {
                  const phaseId = e.target.value;

                  if (!phaseId) {
                    return;
                  }

                  const phase = projectPhases.find((p) => p.id === phaseId);

                  if (phase) {
                    addPhase(phase);
                  }
                }}
                disabled={availablePhases.length === 0}
              >
                <option value="">
                  {availablePhases.length === 0
                    ? phaseSearch
                      ? "No matching phases left to add"
                      : "No phases available"
                    : "Select a phase to add..."}
                </option>

                {availablePhases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.phase_code}
                    {" — "}
                    {phase.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ==================================================
            SELECTED PHASES
        ================================================== */}

        <div>
          <div className="mb-3">
            <h4 className="font-semibold text-[#333333]">Selected Phases</h4>

            <p className="text-xs text-[#94A3A5] mt-1">
              Configure the timing, Gantt position and additional notes for each
              phase.
            </p>
          </div>

          {selectedPhases.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500">No phases selected yet.</p>

              <p className="text-xs text-[#94A3A5] mt-1">
                Select a reusable phase above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPhases.map((phase, index) => (
                <div
                  key={phase.project_phase_id}
                  className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                >
                  {/* ========================================
                        PHASE HEADER
                    ======================================== */}

                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1F453B] text-white flex items-center justify-center font-semibold shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1F453B]">
                            {phase.phase_code}
                          </span>

                          <h5 className="font-semibold text-[#333333] truncate">
                            {phase.title}
                          </h5>
                        </div>

                        {phase.description && (
                          <p className="text-xs text-[#6B7B7C] mt-1">
                            {phase.description}
                          </p>
                        )}
                      </div>

                      {/* ORDER */}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => movePhase(index, "up")}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={index === selectedPhases.length - 1}
                          onClick={() => movePhase(index, "down")}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() => removePhase(phase.project_phase_id)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Remove phase"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ========================================
                        CONFIGURATION
                    ======================================== */}

                  <div className="p-5 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* MIN */}

                      <div>
                        <label className="bc-label">Minimum Duration</label>

                        <input
                          type="number"
                          min="0"
                          value={phase.duration_min_days}
                          onChange={(e) =>
                            updatePhase(
                              index,
                              "duration_min_days",
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                          placeholder="e.g. 30"
                          className="bc-input w-full"
                        />

                        <p className="text-[11px] text-[#94A3A5] mt-1">Days</p>
                      </div>

                      {/* MAX */}

                      <div>
                        <label className="bc-label">Maximum Duration</label>

                        <input
                          type="number"
                          min="0"
                          value={phase.duration_max_days}
                          onChange={(e) =>
                            updatePhase(
                              index,
                              "duration_max_days",
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                          placeholder="e.g. 45"
                          className="bc-input w-full"
                        />

                        <p className="text-[11px] text-[#94A3A5] mt-1">Days</p>
                      </div>

                      {/* GANTT START */}

                      <div>
                        <label className="bc-label">Gantt Start Offset</label>

                        <input
                          type="number"
                          min="0"
                          value={phase.gantt_start_offset_days}
                          onChange={(e) =>
                            updatePhase(
                              index,
                              "gantt_start_offset_days",
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                            )
                          }
                          placeholder="0"
                          className="bc-input w-full"
                        />

                        <p className="text-[11px] text-[#94A3A5] mt-1">
                          Days from site start
                        </p>
                      </div>

                      {/* GANTT DURATION */}

                      <div>
                        <label className="bc-label">Gantt Duration</label>

                        <input
                          type="number"
                          min="0"
                          value={phase.gantt_duration_days}
                          onChange={(e) =>
                            updatePhase(
                              index,
                              "gantt_duration_days",
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value),
                            )
                          }
                          placeholder="e.g. 30"
                          className="bc-input w-full"
                        />

                        <p className="text-[11px] text-[#94A3A5] mt-1">Days</p>
                      </div>
                    </div>

                    {/* NOTES */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* PARALLEL */}

                      <div>
                        <label className="bc-label">Parallel Work Note</label>

                        <input
                          type="text"
                          value={phase.parallel_work_note}
                          onChange={(e) =>
                            updatePhase(
                              index,
                              "parallel_work_note",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. PARALLEL WORK — OVERALL MATERIAL SELECTION"
                          className="bc-input w-full"
                        />
                      </div>

                      {/* INCLUSION */}

                      <div>
                        <label className="bc-label">Inclusion Note</label>

                        <input
                          type="text"
                          value={phase.inclusion_note}
                          onChange={(e) =>
                            updatePhase(index, "inclusion_note", e.target.value)
                          }
                          placeholder="e.g. INCLUDES — PAINT 1ST COAT"
                          className="bc-input w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ============================================================
     TEAM SECTION
  ============================================================ */

  const renderTeamSection = () => {
    const members = values.team_members || [];

    /* ========================================================
     TEAM CHANGE
  ======================================================== */

    const handleTeamChange = (teamId) => {
      setSelectedTeamId(teamId);

      setValues((prev) => ({
        ...prev,

        team_id: teamId,

        /*
         * Members belong to the selected Admin Team.
         * Changing the team therefore clears the old
         * member selection.
         */
        team_members: [],
      }));
    };

    /* ========================================================
     ADD
  ======================================================== */

    const addMember = () => {
      if (!selectedTeamId) {
        toast.error("Please select an Admin Team first.");
        return;
      }

      setValues((prev) => ({
        ...prev,

        team_members: [
          ...(prev.team_members || []),

          {
            id: crypto.randomUUID(),

            team_id: selectedTeamId,

            user_id: "",

            role_label: "",

            is_primary: false,
          },
        ],
      }));
    };

    /* ========================================================
     UPDATE
  ======================================================== */

    const updateMember = (index, field, value) => {
      setValues((prev) => {
        const newMembers = [...(prev.team_members || [])];

        newMembers[index] = {
          ...newMembers[index],
          [field]: value,
        };

        /*
         * Only one primary contact is allowed.
         */
        if (field === "is_primary" && value === true) {
          return {
            ...prev,

            team_members: newMembers.map((member, memberIndex) => ({
              ...member,
              is_primary: memberIndex === index,
            })),
          };
        }

        return {
          ...prev,

          team_members: newMembers,
        };
      });
    };

    /* ========================================================
     REMOVE
  ======================================================== */

    const removeMember = (index) => {
      setValues((prev) => ({
        ...prev,

        team_members: (prev.team_members || []).filter((_, i) => i !== index),
      }));
    };

    /* ========================================================
     TEAM MEMBER USER HELPERS
  ======================================================== */

    const getMemberUser = (teamMember) => {
      return teamMember?.user || teamMember?.User || null;
    };

    const getMemberUserName = (teamMember) => {
      const user = getMemberUser(teamMember);

      return (
        user?.name ||
        user?.full_name ||
        user?.display_name ||
        user?.email ||
        teamMember?.user_id ||
        "Unknown User"
      );
    };

    /* ========================================================
     RENDER
  ======================================================== */

    return (
      <div className="space-y-5">
        {/* ==================================================
          HEADER
      ================================================== */}

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Team</h3>

            <p className="text-sm text-[#6B7B7C] mt-1">
              Select an Admin Team and assign members from that team to this
              Plan of Action.
            </p>
          </div>

          <button
            type="button"
            onClick={addMember}
            disabled={!selectedTeamId}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a3a32] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Member
          </button>
        </div>

        {/* ==================================================
          ADMIN TEAM
      ================================================== */}

        <div className="border border-gray-200 rounded-xl bg-white p-5">
          <div className="mb-2">
            <label className="bc-label">Admin Team</label>

            <p className="text-xs text-[#94A3A5] mt-1">
              Only members of this Admin Team can be assigned to the Plan of
              Action.
            </p>
          </div>

          {isLoadingTeams ? (
            <div className="text-sm text-[#6B7B7C]">Loading teams...</div>
          ) : (
            <select
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="bc-input h-10 w-full"
            >
              <option value="">Select Admin Team</option>

              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}

          {!selectedTeamId && (
            <p className="text-xs text-amber-600 mt-2">
              Select an Admin Team before adding team members.
            </p>
          )}
        </div>

        {/* ==================================================
          ROLE SUGGESTIONS
      ================================================== */}

        <datalist id="role-options">
          {ROLE_SUGGESTIONS.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>

        {/* ==================================================
          NO TEAM SELECTED
      ================================================== */}

        {!selectedTeamId ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">
              Select an Admin Team to assign team members.
            </p>
          </div>
        ) : (
          <>
            {/* ==================================================
              TEAM MEMBER COUNT
          ================================================== */}

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#333333]">Team Members</h4>

                <p className="text-xs text-[#94A3A5] mt-1">
                  Select people from the selected Admin Team.
                </p>
              </div>

              <span className="text-sm text-[#6B7B7C]">
                {members.length} assigned
              </span>
            </div>

            {/* ==================================================
              LOADING MEMBERS
          ================================================== */}

            {isLoadingTeamMembers ? (
              <div className="text-sm text-[#6B7B7C] border border-gray-200 rounded-xl p-6 bg-white">
                Loading team members...
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-500">
                  No members found in this Admin Team.
                </p>

                <p className="text-xs text-[#94A3A5] mt-1">
                  Add members to the Admin Team before assigning them to this
                  Plan of Action.
                </p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-500">No team members assigned yet.</p>

                <button
                  type="button"
                  onClick={addMember}
                  className="mt-4 text-[#1F453B] hover:underline"
                >
                  Add the first member
                </button>
              </div>
            ) : (
              /* ==================================================
               MEMBER ROWS
            ================================================== */

              <div className="space-y-3">
                {members.map((member, index) => {
                  const missingUser = !member.user_id;
                  const missingRole = !member.role_label;

                  /*
                   * Prevent selecting the same Admin Team member
                   * twice in the POA.
                   */
                  const alreadySelectedUserIds = members
                    .filter((_, memberIndex) => memberIndex !== index)
                    .map((item) => item.user_id)
                    .filter(Boolean);

                  return (
                    <div
                      key={member.id}
                      className="flex flex-wrap items-center gap-3 border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      {/* ======================================
                        USER
                    ====================================== */}

                      <div className="flex-1 min-w-[220px]">
                        <label className="bc-label">Team Member</label>

                        <select
                          value={member.user_id}
                          onChange={(e) =>
                            updateMember(index, "user_id", e.target.value)
                          }
                          className={`bc-input h-10 w-full ${
                            missingUser ? "border-red-400" : ""
                          }`}
                        >
                          <option value="">Select team member</option>

                          {teamMembers.map((teamMember) => {
                            const userId = teamMember.user_id;

                            const isAlreadySelected =
                              alreadySelectedUserIds.includes(userId);

                            return (
                              <option
                                key={teamMember.id}
                                value={userId}
                                disabled={isAlreadySelected}
                              >
                                {getMemberUserName(teamMember)}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* ======================================
                        ROLE
                    ====================================== */}

                      <div className="flex-1 min-w-[180px]">
                        <label className="bc-label">Role</label>

                        <input
                          type="text"
                          list="role-options"
                          value={member.role_label}
                          onChange={(e) =>
                            updateMember(index, "role_label", e.target.value)
                          }
                          placeholder="Role, e.g. Project Lead"
                          className={`bc-input h-10 w-full ${
                            missingRole ? "border-red-400" : ""
                          }`}
                        />
                      </div>

                      {/* ======================================
                        PRIMARY
                    ====================================== */}

                      <label className="flex items-center gap-2 text-sm text-[#333333] whitespace-nowrap pt-5">
                        <input
                          type="checkbox"
                          checked={Boolean(member.is_primary)}
                          onChange={(e) =>
                            updateMember(index, "is_primary", e.target.checked)
                          }
                        />
                        Primary contact
                      </label>

                      {/* ======================================
                        DELETE
                    ====================================== */}

                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="text-red-500 hover:text-red-700 p-2 ml-auto mt-5"
                        title="Remove member"
                      >
                        <Trash2 size={18} />
                      </button>

                      {/* ======================================
                        VALIDATION
                    ====================================== */}

                      {(missingUser || missingRole) && (
                        <p className="w-full text-xs text-red-500">
                          {missingUser && missingRole
                            ? "Select a team member and enter a role."
                            : missingUser
                              ? "Select a team member."
                              : "Enter a role."}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ==================================================
              ADD MEMBER
          ================================================== */}

            {teamMembers.length > members.length && (
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-2 text-sm text-[#1F453B] hover:underline"
              >
                <Plus size={16} />
                Add another member
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  /* ============================================================
     TERMS SECTION — select + add + edit
  ============================================================ */

  const resetTermsCreateForm = () => {
    setTermsCreateForm({
      name: "",
      scope: "PROJECT",
      content_html: "",
    });
    setTermsCreatePreview(false);
  };

  const handleCreateTermsTemplate = async () => {
    if (!termsCreateForm.name.trim() || !termsCreateForm.content_html.trim()) {
      toast.error("Name and content are required");
      return;
    }

    try {
      const created = await createTermsTemplate(termsCreateForm).unwrap();
      toast.success("Terms template created");
      setTermsCreateOpen(false);
      resetTermsCreateForm();
      await refetchTermsTemplates();

      if (created?.id) {
        setValues((prev) => ({
          ...prev,
          terms_template_id: created.id,
        }));
      }
    } catch {
      toast.error("Failed to create terms template");
    }
  };

  const openEditTermsContent = (template) => {
    setEditingTermsTemplate(template);
    setTermsEditContent(template.content_html || "");
    setTermsChangeNote("");
    setTermsEditPreview(false);
  };

  const handleSaveTermsContent = async () => {
    if (!editingTermsTemplate) return;

    if (!termsEditContent.trim()) {
      toast.error("Content can't be empty");
      return;
    }

    try {
      await updateTermsContent({
        id: editingTermsTemplate.id,
        content_html: termsEditContent,
        change_note: termsChangeNote || undefined,
      }).unwrap();

      toast.success(
        `Saved as v${(editingTermsTemplate.current_version || 1) + 1}`,
      );
      setEditingTermsTemplate(null);
      await refetchTermsTemplates();
    } catch {
      toast.error("Failed to save terms changes");
    }
  };

  const renderTermsSection = () => {
    const selectedId = values.terms_template_id;

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold">Terms & Conditions</h3>
            <p className="text-sm text-[#6B7B7C] mt-1">
              Pick a template to attach, or create / edit one. Templates are
              versioned — documents keep the wording that was current when they
              were saved.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetTermsCreateForm();
              setTermsCreateOpen(true);
              setEditingTermsTemplate(null);
            }}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a3a32] shrink-0"
          >
            <Plus size={16} />
            Add Terms & Condition
          </button>
        </div>

        {/* Create panel */}
        {termsCreateOpen && (
          <div className="border border-[#1F453B]/30 rounded-xl bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-[#333333]">
                New Terms Template
              </h4>
              <button
                type="button"
                onClick={() => {
                  setTermsCreateOpen(false);
                  resetTermsCreateForm();
                }}
                className="text-sm text-[#6B7B7C] hover:text-[#333333]"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="bc-label">Template Name</label>
              <input
                type="text"
                className="bc-input w-full"
                placeholder="e.g. Standard Residential Terms"
                value={termsCreateForm.name}
                onChange={(e) =>
                  setTermsCreateForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="bc-label">Scope</label>
              <select
                className="bc-input h-10 w-full"
                value={termsCreateForm.scope}
                onChange={(e) =>
                  setTermsCreateForm((f) => ({ ...f, scope: e.target.value }))
                }
              >
                <option value="GLOBAL">Global</option>
                <option value="PROJECT">Projects</option>
                <option value="CLIENT">Clients</option>
                <option value="BOQ">Bill of Quantities</option>
                <option value="ESTIMATE">Estimates</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="bc-label">Terms Content</label>
                <button
                  type="button"
                  onClick={() => setTermsCreatePreview((v) => !v)}
                  className="text-xs text-[#1F453B] hover:underline flex items-center gap-1"
                >
                  {termsCreatePreview ? <Code size={14} /> : <Eye size={14} />}
                  {termsCreatePreview ? "Edit" : "Preview"}
                </button>
              </div>

              {termsCreatePreview ? (
                <div className="w-full min-h-[140px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm prose prose-sm max-w-none">
                  {termsCreateForm.content_html.trim() ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: termsCreateForm.content_html,
                      }}
                    />
                  ) : (
                    <p className="text-[#6B7B7C] italic">
                      Enter content to see preview…
                    </p>
                  )}
                </div>
              ) : (
                <textarea
                  className="bc-input w-full min-h-[140px] font-mono text-xs"
                  placeholder={`<ol>
  <li>All quantities are approximate and subject to site verification.</li>
  <li>Rates include labour, material, tools, and equipment unless otherwise specified.</li>
  <li>Any variation in scope shall be treated as extra work.</li>
</ol>`}
                  value={termsCreateForm.content_html}
                  onChange={(e) =>
                    setTermsCreateForm((f) => ({
                      ...f,
                      content_html: e.target.value,
                    }))
                  }
                />
              )}
              <p className="text-[11px] text-[#94A3A5] mt-1">
                Paste HTML list format or plain text with line breaks
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setTermsCreateOpen(false);
                  resetTermsCreateForm();
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTermsTemplate}
                disabled={isCreatingTerms}
                className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-sm hover:bg-[#1a3a32] disabled:opacity-50 flex items-center gap-2"
              >
                {isCreatingTerms && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {isCreatingTerms ? "Creating…" : "Create Template"}
              </button>
            </div>
          </div>
        )}

        {/* Edit panel */}
        {editingTermsTemplate && (
          <div className="border border-[#1F453B]/30 rounded-xl bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-[#333333]">
                Edit &ldquo;{editingTermsTemplate.name}&rdquo;
              </h4>
              <button
                type="button"
                onClick={() => setEditingTermsTemplate(null)}
                className="text-sm text-[#6B7B7C] hover:text-[#333333]"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-[#6B7B7C]">
              Saving creates v{(editingTermsTemplate.current_version || 1) + 1}.
              Documents that already used an earlier version keep their original
              text.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="bc-label">Content</label>
                <button
                  type="button"
                  onClick={() => setTermsEditPreview((v) => !v)}
                  className="text-xs text-[#1F453B] hover:underline flex items-center gap-1"
                >
                  {termsEditPreview ? <Code size={14} /> : <Eye size={14} />}
                  {termsEditPreview ? "Edit" : "Preview"}
                </button>
              </div>

              {termsEditPreview ? (
                <div className="w-full min-h-[180px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm overflow-y-auto max-h-[320px]">
                  <div dangerouslySetInnerHTML={{ __html: termsEditContent }} />
                </div>
              ) : (
                <textarea
                  className="bc-input w-full min-h-[180px] font-mono text-xs"
                  value={termsEditContent}
                  onChange={(e) => setTermsEditContent(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="bc-label">Change Note (optional)</label>
              <input
                type="text"
                className="bc-input w-full"
                placeholder="e.g. Updated payment terms clause"
                value={termsChangeNote}
                onChange={(e) => setTermsChangeNote(e.target.value)}
              />
              <p className="text-[11px] text-[#94A3A5] mt-1">
                Describe what changed for version history
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingTermsTemplate(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTermsContent}
                disabled={isSavingTermsContent}
                className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-sm hover:bg-[#1a3a32] disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingTermsContent && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {isSavingTermsContent ? "Saving…" : "Save as new version"}
              </button>
            </div>
          </div>
        )}

        {/* Template list */}
        {termsTemplates.length === 0 && !termsCreateOpen ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No terms templates available.</p>
            <button
              type="button"
              onClick={() => {
                resetTermsCreateForm();
                setTermsCreateOpen(true);
              }}
              className="mt-4 text-[#1F453B] hover:underline text-sm"
            >
              Add the first terms template
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {termsTemplates.map((template) => {
              const isSelected = selectedId === template.id;

              return (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 flex items-start justify-between gap-3 transition ${
                    isSelected
                      ? "border-[#1F453B] bg-[#F4F6F7]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        terms_template_id: template.id,
                      }))
                    }
                    className="text-left flex-1 min-w-0"
                  >
                    <div className="font-semibold text-[#333333]">
                      {template.name}
                    </div>
                    <div className="text-xs text-[#94A3A5] mt-1">
                      {template.scope}
                      {" • "}v{template.current_version}
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setTermsCreateOpen(false);
                        openEditTermsContent(template);
                      }}
                      title="Edit content"
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-[#6B7B7C]"
                    >
                      <Pencil size={16} />
                    </button>

                    {isSelected ? (
                      <CheckCircle2
                        size={20}
                        className="text-[#1F453B] shrink-0"
                      />
                    ) : (
                      <span className="w-5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ============================================================
     SECTION ROUTER
  ============================================================ */

  const renderSection = (section) => {
    if (section.type === "phases") {
      return renderPhasesSection();
    }

    if (section.type === "team") {
      return renderTeamSection();
    }

    if (section.type === "terms") {
      return renderTermsSection();
    }

    return null;
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async () => {
    /* ======================================================
       PROJECT VALIDATION
    ====================================================== */

    if (!projectId) {
      return toast.error("Please select a project.");
    }

    /* ======================================================
       UUID VALIDATION
    ====================================================== */

    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!UUID_REGEX.test(projectId)) {
      console.error("Invalid projectId:", projectId);

      return toast.error("Selected project has an invalid ID.");
    }

    /* ======================================================
       PHASE VALIDATION
    ====================================================== */

    if (!values.phases?.length) {
      return toast.error("Add at least one phase.");
    }

    /*
     * Every phase must reference an existing
     * reusable ProjectPhase.
     */
    const invalidPhase = values.phases.find(
      (phase) =>
        !phase.project_phase_id || !UUID_REGEX.test(phase.project_phase_id),
    );

    if (invalidPhase) {
      console.error("Invalid phase:", invalidPhase);

      return toast.error(
        "One or more selected phases have an invalid Project Phase ID.",
      );
    }

    const overview = values.Overview || {};

    /* ======================================================
       TEAM VALIDATION
    ====================================================== */

    const rawMembers = values.team_members || [];

    const incompleteMembers = rawMembers.filter(
      (member) => !(member.user_id && member.role_label),
    );

    if (incompleteMembers.length > 0) {
      return toast.error(
        `${incompleteMembers.length} team member${
          incompleteMembers.length > 1 ? "s are" : " is"
        } missing a person or role. Fill both fields or remove the row before saving.`,
      );
    }

    /*
     * Prevent the same user from being added
     * more than once to the POA.
     */
    const memberUserIds = rawMembers.map((member) => member.user_id);

    const uniqueMemberUserIds = new Set(memberUserIds);

    if (uniqueMemberUserIds.size !== memberUserIds.length) {
      return toast.error("A team member cannot be added more than once.");
    }

    /* ======================================================
       PAYLOAD
    ====================================================== */

    const payload = {
      /*
       * Backend DTO expects project_id.
       */
      project_id: projectId,

      /*
       * OVERVIEW
       */
      title: overview.title || "Plan of Action",

      execution_description: overview.execution_description || undefined,

      total_duration_min_days: toNumberOrUndefined(
        overview.total_duration_min_days,
      ),

      total_duration_max_days: toNumberOrUndefined(
        overview.total_duration_max_days,
      ),

      total_duration_label: overview.total_duration_label || undefined,

      /*
       * TERMS
       */
      ...(values.terms_template_id
        ? {
            terms_template_id: values.terms_template_id,
          }
        : {}),

      /* ====================================================
         PHASES
      ==================================================== */

      phases: values.phases.map(
        ({ id: localId, project_phase_id, ...phase }) => ({
          /*
           * IMPORTANT:
           * Send the reusable ProjectPhase UUID.
           */
          project_phase_id,

          /*
           * Existing master phase information.
           */
          phase_number: Number(phase.phase_number),

          phase_code: phase.phase_code,

          title: phase.title,

          description: phase.description || undefined,

          /*
           * POA configuration.
           */
          duration_min_days: toNumberOrUndefined(phase.duration_min_days),

          duration_max_days: toNumberOrUndefined(phase.duration_max_days),

          parallel_work_note: phase.parallel_work_note || undefined,

          inclusion_note: phase.inclusion_note || undefined,

          gantt_start_offset_days:
            toNumberOrUndefined(phase.gantt_start_offset_days) ?? 0,

          gantt_duration_days:
            toNumberOrUndefined(phase.gantt_duration_days) ?? 0,
        }),
      ),

      /* ====================================================
         TEAM
      ==================================================== */

      /*
       * IMPORTANT:
       *
       * Do NOT send team_id here.
       *
       * Backend TeamService resolves the user's
       * Admin Team automatically and stores that
       * team_id on the owner-scoped team_members row.
       */
      team_members: rawMembers.map(
        ({ id: localId, user_id, role_label, is_primary }) => ({
          user_id,

          role_label,

          is_primary: Boolean(is_primary),
        }),
      ),
    };

    /* ======================================================
       DEBUG
    ====================================================== */

    console.log("Plan of Action payload:", payload);

    /* ======================================================
       SAVE
    ====================================================== */

    try {
      let plan;

      /* ====================================================
         EDIT
      ==================================================== */

      if (isEditMode) {
        plan = await updatePlanOfAction({
          id,
          ...payload,
        }).unwrap();

        toast.success("Plan of Action updated successfully.");
      } else {
        /* ==================================================
           CREATE
        ================================================== */

        plan = await createPlanOfAction(payload).unwrap();

        toast.success("Plan of Action created successfully.");
      }

      /* ======================================================
         CLEAR AUTOSAVE
      ====================================================== */

      localStorage.removeItem(SAVE_KEY);

      /* ======================================================
         REDIRECT
      ====================================================== */

      navigate(`/plan-of-actions/${plan?.id || id}`);
    } catch (error) {
      console.error("Plan of Action save failed:", error);

      /*
       * Show backend validation message
       * when available.
       */
      const backendMessage = error?.data?.message || error?.error || null;

      if (Array.isArray(backendMessage)) {
        toast.error(backendMessage.join(", "));
      } else {
        toast.error(
          backendMessage ||
            (isEditMode
              ? "Failed to update Plan of Action."
              : "Failed to create Plan of Action."),
        );
      }
    }
  };

  /* ============================================================
     LOADING EXISTING POA
  ============================================================ */

  if (isEditMode && (isLoadingPlan || isFetchingPlan)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-[#6B7B7C]">Loading Plan of Action...</div>
      </div>
    );
  }

  /* ============================================================
     ERROR STATE
  ============================================================ */

  if (isEditMode && planError && !existingPlanOfAction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500">Failed to load Plan of Action.</p>

        <button
          type="button"
          onClick={() => navigate("/plan-of-actions")}
          className="mt-4 text-[#1F453B] hover:underline"
        >
          Back to Plans of Action
        </button>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <PlanOfActionSectionForm
      title={isEditMode ? "Edit Plan of Action" : "Plan of Action"}
      subtitle={
        isEditMode
          ? "Update phases, team and terms for this project"
          : "Define phases, team and terms for this project"
      }
      submitLabel={isEditMode ? "Update Plan of Action" : "Save Plan of Action"}
      sections={POA_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      renderSection={renderSection}
    />
  );
}
