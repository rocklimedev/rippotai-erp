import { TermsFullDisplay } from "@/components/settings/TermsDisplay";
import { termsToText, textToTermsHtml } from "@/lib/terms";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  CheckCircle2,
  Pencil,
  Eye,
  Code,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  Users,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Page,
  EmptyState,
  Button,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  prettyStatus,
} from "@/components/inos";
import {
  RowCard,
  IconButton,
  AddRowButton,
  EmptyRows,
} from "@/components/forms/crm-form-ui";

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

  // Preselect the project when opened from a project (?project_id=…)
  const [searchParams] = useSearchParams();
  const [projectId, setProjectId] = useState(
    () => searchParams.get("project_id") || searchParams.get("projectId") || "",
  );

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
      <>
        <div className="inos-form-grid">
          <Field label="Find a phase" hint="Search the phase library by code, title or description.">
            <label className="inos-search" style={{ maxWidth: "none" }}>
              <Search aria-hidden />
              <input
                type="search"
                className="inos-input"
                value={phaseSearch}
                onChange={(e) => setPhaseSearch(e.target.value)}
                placeholder="e.g. P3 or Civil"
                aria-label="Search phases"
              />
            </label>
          </Field>

          <Field
            label="Add phase"
            hint={`${selectedPhases.length} selected · ${availablePhases.length} available`}
          >
            <SelectInput
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
              disabled={isLoadingPhases || availablePhases.length === 0}
              placeholder={
                isLoadingPhases
                  ? "Loading phases…"
                  : availablePhases.length === 0
                    ? phaseSearch
                      ? "No matching phases left to add"
                      : "No phases available"
                    : "+ Select a phase to add…"
              }
            >
              {availablePhases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.phase_code}
                  {" — "}
                  {phase.title}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {selectedPhases.length === 0 ? (
          <EmptyRows
            icon={ListOrdered}
            title="No phases selected yet"
            text="Pick phases from the library above. You can reorder them and set durations after adding."
          />
        ) : (
          <div className="crmf-rows">
            {selectedPhases.map((phase, index) => (
              <RowCard
                key={phase.project_phase_id}
                index={index + 1}
                title={
                  <>
                    {phase.phase_code ? `${phase.phase_code} · ` : ""}
                    {phase.title}
                  </>
                }
                meta={
                  calculateDurationLabel(
                    phase.duration_min_days,
                    phase.duration_max_days,
                  ) || undefined
                }
                onRemove={() => removePhase(phase.project_phase_id)}
                removeLabel="Remove phase"
                actions={
                  <>
                    <IconButton
                      label="Move up"
                      disabled={index === 0}
                      onClick={() => movePhase(index, "up")}
                    >
                      <ChevronUp />
                    </IconButton>
                    <IconButton
                      label="Move down"
                      disabled={index === selectedPhases.length - 1}
                      onClick={() => movePhase(index, "down")}
                    >
                      <ChevronDown />
                    </IconButton>
                  </>
                }
              >
                {phase.description && (
                  <p className="inos-hint" style={{ margin: 0 }}>
                    {phase.description}
                  </p>
                )}

                <div className="inos-form-grid">
                  <Field label="Minimum duration" hint="Days">
                    <TextInput
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={phase.duration_min_days}
                      onChange={(e) =>
                        updatePhase(
                          index,
                          "duration_min_days",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 30"
                    />
                  </Field>

                  <Field label="Maximum duration" hint="Days">
                    <TextInput
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={phase.duration_max_days}
                      onChange={(e) =>
                        updatePhase(
                          index,
                          "duration_max_days",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 45"
                    />
                  </Field>

                  <Field label="Gantt start offset" hint="Days from site start">
                    <TextInput
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={phase.gantt_start_offset_days}
                      onChange={(e) =>
                        updatePhase(
                          index,
                          "gantt_start_offset_days",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Gantt duration" hint="Days shown on the chart">
                    <TextInput
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={phase.gantt_duration_days}
                      onChange={(e) =>
                        updatePhase(
                          index,
                          "gantt_duration_days",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      placeholder="e.g. 30"
                    />
                  </Field>

                  <Field label="Parallel work note" optional>
                    <TextInput
                      value={phase.parallel_work_note}
                      onChange={(e) =>
                        updatePhase(index, "parallel_work_note", e.target.value)
                      }
                      placeholder="e.g. Overall material selection in parallel"
                    />
                  </Field>

                  <Field label="Inclusion note" optional>
                    <TextInput
                      value={phase.inclusion_note}
                      onChange={(e) =>
                        updatePhase(index, "inclusion_note", e.target.value)
                      }
                      placeholder="e.g. Includes paint 1st coat"
                    />
                  </Field>
                </div>
              </RowCard>
            ))}
          </div>
        )}
      </>
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
      <>
        <datalist id="role-options">
          {ROLE_SUGGESTIONS.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>

        <div className="inos-form-grid">
          <Field
            label="Admin team"
            required
            hint={
              selectedTeamId
                ? "Only members of this team can be assigned. Changing it clears the list below."
                : "Choose a team first, then assign its members."
            }
          >
            <SelectInput
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={isLoadingTeams}
              placeholder={isLoadingTeams ? "Loading teams…" : "Select admin team"}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {!selectedTeamId ? null : isLoadingTeamMembers ? (
          <p className="inos-hint">Loading team members…</p>
        ) : teamMembers.length === 0 ? (
          <EmptyRows
            icon={Users}
            title="No members in this team"
            text="Add people to the admin team before assigning them to this plan."
          />
        ) : (
          <>
            {members.length === 0 ? (
              <EmptyRows
                icon={Users}
                title="No one assigned yet"
                text="Assign the people who will run this project and mark one as the primary contact."
              />
            ) : (
              <div className="crmf-rows">
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

                  const selectedMember = teamMembers.find(
                    (tm) => tm.user_id === member.user_id,
                  );

                  return (
                    <RowCard
                      key={member.id}
                      index={index + 1}
                      title={selectedMember ? getMemberUserName(selectedMember) : "New member"}
                      meta={member.is_primary ? "Primary contact" : member.role_label || undefined}
                      onRemove={() => removeMember(index)}
                      removeLabel="Remove member"
                    >
                      <div className="inos-form-grid">
                        <Field
                          label="Team member"
                          required
                          error={missingUser ? "Select a team member." : undefined}
                        >
                          <SelectInput
                            value={member.user_id}
                            invalid={missingUser}
                            onChange={(e) =>
                              updateMember(index, "user_id", e.target.value)
                            }
                            placeholder="Select team member"
                          >
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
                          </SelectInput>
                        </Field>

                        <Field
                          label="Role"
                          required
                          error={missingRole ? "Enter a role." : undefined}
                        >
                          <TextInput
                            list="role-options"
                            value={member.role_label}
                            invalid={missingRole}
                            onChange={(e) =>
                              updateMember(index, "role_label", e.target.value)
                            }
                            placeholder="e.g. Project Lead"
                          />
                        </Field>
                      </div>

                      <label className="crmf-check">
                        <input
                          type="checkbox"
                          checked={Boolean(member.is_primary)}
                          onChange={(e) =>
                            updateMember(index, "is_primary", e.target.checked)
                          }
                        />
                        Primary contact for the client
                      </label>
                    </RowCard>
                  );
                })}
              </div>
            )}

            {teamMembers.length > members.length && (
              <AddRowButton onClick={addMember}>
                {members.length ? "Add another member" : "Add first member"}
              </AddRowButton>
            )}
          </>
        )}
      </>
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
      const created = await createTermsTemplate({ ...termsCreateForm, name: termsCreateForm.name.trim(), content_html: textToTermsHtml(termsCreateForm.content_html) }).unwrap();
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
    setTermsEditContent(termsToText(template.content_html));
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
        content_html: textToTermsHtml(termsEditContent),
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

    const termsEditor = (value, setValue, preview, setPreview, placeholder) => (
      <>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="ghost"
            size="sm"
            icon={preview ? Code : Eye}
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? "Edit" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <div className="crmf-preview prose prose-sm max-w-none">
            {value.trim() ? (
              <TermsFullDisplay htmlContent={textToTermsHtml(value)} />
            ) : (
              <p className="inos-hint">Enter content to see a preview…</p>
            )}
          </div>
        ) : (
          <TextArea

            style={{ minHeight: 160 }}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </>
    );

    return (
      <>
        {/* Create panel */}
        {termsCreateOpen && (
          <RowCard
            title="New terms template"
            actions={
              <IconButton
                label="Close"
                onClick={() => {
                  setTermsCreateOpen(false);
                  resetTermsCreateForm();
                }}
              >
                <X />
              </IconButton>
            }
          >
            <div className="inos-form-grid">
              <Field label="Template name" required>
                <TextInput
                  placeholder="e.g. Standard residential terms"
                  value={termsCreateForm.name}
                  onChange={(e) =>
                    setTermsCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Field>

              <Field label="Used for">
                <SelectInput
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
                </SelectInput>
              </Field>

              <Field
                label="Terms content"
                required
                full
                hint="Write one term per line."
              >
                {termsEditor(
                  termsCreateForm.content_html,
                  (v) =>
                    setTermsCreateForm((f) => ({
                      ...f,
                      content_html: typeof v === "function" ? v(f.content_html) : v,
                    })),
                  termsCreatePreview,
                  setTermsCreatePreview,
                  `All quantities are approximate and subject to site verification.
Rates include labour, material, tools, and equipment unless otherwise specified.
Any variation in scope shall be treated as extra work.`,
                )}
              </Field>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setTermsCreateOpen(false);
                  resetTermsCreateForm();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateTermsTemplate}
                disabled={isCreatingTerms}
              >
                {isCreatingTerms ? "Creating…" : "Create template"}
              </Button>
            </div>
          </RowCard>
        )}

        {/* Edit panel */}
        {editingTermsTemplate && (
          <RowCard
            title={`Edit “${editingTermsTemplate.name}”`}
            meta={`Saving creates v${(editingTermsTemplate.current_version || 1) + 1}`}
            actions={
              <IconButton label="Close" onClick={() => setEditingTermsTemplate(null)}>
                <X />
              </IconButton>
            }
          >
            <p className="inos-hint" style={{ margin: 0 }}>
              Documents that already used an earlier version keep their
              original text.
            </p>

            <Field label="Content" required>
              {termsEditor(
                termsEditContent,
                setTermsEditContent,
                termsEditPreview,
                setTermsEditPreview,
                "",
              )}
            </Field>

            <Field label="Change note" optional hint="Describe what changed, for version history.">
              <TextInput
                placeholder="e.g. Updated payment terms clause"
                value={termsChangeNote}
                onChange={(e) => setTermsChangeNote(e.target.value)}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="ghost" onClick={() => setEditingTermsTemplate(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveTermsContent}
                disabled={isSavingTermsContent}
              >
                {isSavingTermsContent ? "Saving…" : "Save as new version"}
              </Button>
            </div>
          </RowCard>
        )}

        {/* Template list */}
        {termsTemplates.length === 0 && !termsCreateOpen ? (
          <EmptyRows
            icon={FileText}
            title="No terms templates yet"
            text="Create a template once and reuse it across plans."
            action={
              <Button
                variant="soft"
                icon={Plus}
                onClick={() => {
                  resetTermsCreateForm();
                  setTermsCreateOpen(true);
                }}
              >
                Create first template
              </Button>
            }
          />
        ) : (
          <div className="inos-choices" role="radiogroup" aria-label="Terms template" style={{ gridTemplateColumns: "1fr" }}>
            {termsTemplates.map((template) => {
              const isSelected = selectedId === template.id;

              return (
                <div
                  key={template.id}
                  className="inos-choice"
                  aria-checked={isSelected}
                  style={{ padding: "8px 8px 8px 12px" }}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        terms_template_id: template.id,
                      }))
                    }
                    style={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    {isSelected ? (
                      <CheckCircle2 size={18} aria-hidden />
                    ) : (
                      <span className="crmf-nav__dot" style={{ width: 18, height: 18 }} aria-hidden />
                    )}
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", color: "var(--text)" }}>{template.name}</span>
                      <span className="inos-hint" style={{ fontWeight: 500 }}>
                        {prettyStatus(template.scope)} · v{template.current_version}
                      </span>
                    </span>
                  </button>

                  <IconButton
                    label="Edit content"
                    onClick={() => {
                      setTermsCreateOpen(false);
                      openEditTermsContent(template);
                    }}
                  >
                    <Pencil />
                  </IconButton>
                </div>
              );
            })}
          </div>
        )}
      </>
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
      <Page width="form">
        <EmptyState icon={Loader2} title="Loading plan of action…" />
      </Page>
    );
  }

  /* ============================================================
     ERROR STATE
  ============================================================ */

  if (isEditMode && planError && !existingPlanOfAction) {
    return (
      <Page width="form">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load plan of action"
          text="It may have been deleted, or the connection dropped."
          action={
            <Button onClick={() => navigate("/plan-of-actions")}>
              Back to plans of action
            </Button>
          }
        />
      </Page>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */

  const overviewValues = values.Overview || {};

  const sectionMeta = {
    Overview: {
      description:
        "Name the plan and give the overall duration range. The duration label is worked out for you.",
      done: Boolean(
        overviewValues.execution_description?.trim() ||
          overviewValues.total_duration_min_days !== "" ||
          overviewValues.total_duration_max_days !== "",
      ),
    },
    Phases: {
      description:
        "Pick phases from the library, order them and set how long each takes.",
      done: (values.phases || []).length > 0,
      count: (values.phases || []).length,
    },
    Team: {
      description:
        "Choose the admin team and assign who works on this project.",
      done: (values.team_members || []).some(
        (m) => m.user_id && m.role_label,
      ),
      count: (values.team_members || []).length,
    },
    "Terms & Conditions": {
      description:
        "Attach a terms template. Templates are versioned, so saved documents keep their wording.",
      done: Boolean(values.terms_template_id),
      actions: (
        <Button
          variant="soft"
          size="sm"
          icon={Plus}
          onClick={() => {
            resetTermsCreateForm();
            setTermsCreateOpen(true);
            setEditingTermsTemplate(null);
          }}
        >
          New template
        </Button>
      ),
    },
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(values));
      toast.success("Draft saved on this device.");
    } catch {
      toast.error("Could not save the draft.");
    }
  };

  return (
    <PlanOfActionSectionForm
      title={isEditMode ? "Edit plan of action" : "Plan of action"}
      subtitle={
        isEditMode
          ? "Update the phases, team and terms. Saving updates the plan of action document."
          : "Set out how the project will run — phases, durations, team and terms. Produces the plan of action document."
      }
      crumbs={[
        { label: "CRM", to: "/crm" },
        { label: "Forms" },
        { label: isEditMode ? "Edit plan of action" : "Plan of action" },
      ]}
      sectionMeta={sectionMeta}
      onSaveDraft={handleSaveDraft}
      submitLabel={isEditMode ? "Update plan of action" : "Save plan of action"}
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
