import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PlanOfActionSectionForm } from "../../components/plan-of-action/PlanOfActionSectionForm";
import { useAutoSave } from "../../hooks/use-autosave";
import {
  useGetProjectsQuery,
  useGetProjectPhasesQuery,
} from "../../api/project.api";
import { useCreatePlanOfActionMutation } from "../../api/plan-of-actions.api";
import { POA_SECTIONS } from "../../hooks/plan-of-action-sections";
import { Search, Plus, Trash2, CheckCircle2 } from "lucide-react";

import { useGetUsersQuery } from "../../api/user.api";
import { useGetTermsTemplatesQuery } from "../../api/terms.api";

const SAVE_KEY = "bc.plan-of-action";

const ROLE_SUGGESTIONS = [
  "Principal Architect",
  "Project Lead",
  "Design Lead",
  "Site Supervisor",
  "Site Engineer",
];

const toNumberOrUndefined = (v) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

export function PlanOfActionForm() {
  const navigate = useNavigate();
  const { data: projects = [] } = useGetProjectsQuery();
  const [phaseSearch, setPhaseSearch] = useState("");
  const { data: projectPhases = [], isLoading: isLoadingPhases } =
    useGetProjectPhasesQuery({
      search: phaseSearch,
    });
  const { data: users = [] } = useGetUsersQuery();
  const { data: termsTemplates = [] } = useGetTermsTemplatesQuery();
  const [createPlanOfAction, { isLoading }] = useCreatePlanOfActionMutation();

  const [projectId, setProjectId] = useState("");
  const [values, setValues] = useAutoSave(SAVE_KEY, {
    Overview: {
      title: "Plan of Action",
      execution_description: "",
      total_duration_min_days: "",
      total_duration_max_days: "",
      total_duration_label: "",
    },
    phases: [],
    team_members: [],
    terms_template_id: "",
  });

  const handleFieldChange = (section, key, value) => {
    setValues((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  };

  // ====================== PHASES SECTION ======================

  const renderPhasesSection = () => {
    const selectedPhases = values.phases || [];

    const isSelected = (phaseId) => {
      return selectedPhases.some((phase) => phase.project_phase_id === phaseId);
    };

    const addPhase = (phase) => {
      if (isSelected(phase.id)) {
        return;
      }

      const nextOrder = selectedPhases.length + 1;

      setValues((prev) => ({
        ...prev,
        phases: [
          ...(prev.phases || []),
          {
            id: crypto.randomUUID(),

            // ProjectPhase reference
            project_phase_id: phase.id,

            // Read-only master phase data
            phase_number: nextOrder,
            phase_code: phase.phase_code,
            title: phase.title,
            description: phase.description ?? "",

            // POA Phase configuration
            duration_min_days: "",
            duration_max_days: "",
            parallel_work_note: "",
            inclusion_note: "",
            gantt_start_offset_days: 0,
            gantt_duration_days: 0,

            // Ordering
            sort_order: nextOrder,
          },
        ],
      }));
    };

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

    /**
     * Update a POA-specific phase field.
     */
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

    const availablePhases = projectPhases.filter(
      (phase) => !isSelected(phase.id),
    );

    return (
      <div className="space-y-6">
        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

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

        {/* ====================================================== */}
        {/* SEARCH */}
        {/* ====================================================== */}

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

        {/* ====================================================== */}
        {/* AVAILABLE PHASES */}
        {/* ====================================================== */}

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
                    {phase.phase_code} — {phase.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ====================================================== */}
        {/* SELECTED / CONFIGURED PHASES */}
        {/* ====================================================== */}

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
                  {/* ================================================== */}
                  {/* PHASE HEADER */}
                  {/* ================================================== */}

                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      {/* Number */}

                      <div className="w-10 h-10 rounded-lg bg-[#1F453B] text-white flex items-center justify-center font-semibold shrink-0">
                        {index + 1}
                      </div>

                      {/* Master Phase */}

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

                      {/* Ordering */}

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

                  {/* ================================================== */}
                  {/* POA-SPECIFIC CONFIGURATION */}
                  {/* ================================================== */}

                  <div className="p-5 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Minimum Duration */}

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

                      {/* Maximum Duration */}

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

                      {/* Gantt Start */}

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

                      {/* Gantt Duration */}

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

                    {/* ================================================== */}
                    {/* NOTES */}
                    {/* ================================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Parallel Work */}

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

                      {/* Inclusion */}

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
  // ====================== TEAM SECTION ======================
  const renderTeamSection = () => {
    const members = values.team_members || [];

    const addMember = () => {
      setValues((prev) => ({
        ...prev,
        team_members: [
          ...(prev.team_members || []),
          {
            id: crypto.randomUUID(),
            user_id: "",
            role_label: "",
            is_primary: false,
          },
        ],
      }));
    };

    const updateMember = (index, field, value) => {
      setValues((prev) => {
        const newMembers = [...(prev.team_members || [])];
        newMembers[index] = { ...newMembers[index], [field]: value };
        return { ...prev, team_members: newMembers };
      });
    };

    const removeMember = (index) => {
      setValues((prev) => ({
        ...prev,
        team_members: prev.team_members.filter((_, i) => i !== index),
      }));
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Team</h3>
          <button
            onClick={addMember}
            className="flex items-center gap-2 bg-[#1F453B] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1a3a32]"
          >
            <Plus size={16} />
            Add Member
          </button>
        </div>

        <datalist id="role-options">
          {ROLE_SUGGESTIONS.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>

        {members.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No team members added yet.</p>
            <button
              onClick={addMember}
              className="mt-4 text-[#1F453B] hover:underline"
            >
              Add the first member
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => {
              const missingUser = !member.user_id;
              const missingRole = !member.role_label;

              return (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={member.user_id}
                      onChange={(e) =>
                        updateMember(index, "user_id", e.target.value)
                      }
                      className={`bc-input h-10 w-full ${
                        missingUser ? "border-red-400" : ""
                      }`}
                    >
                      <option value="">Select person</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[180px]">
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

                  <label className="flex items-center gap-2 text-sm text-[#333333] whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={member.is_primary}
                      onChange={(e) =>
                        updateMember(index, "is_primary", e.target.checked)
                      }
                    />
                    Primary contact
                  </label>

                  <button
                    onClick={() => removeMember(index)}
                    className="text-red-500 hover:text-red-700 p-2 ml-auto"
                  >
                    <Trash2 size={18} />
                  </button>

                  {(missingUser || missingRole) && (
                    <p className="w-full text-xs text-red-500">
                      {missingUser && missingRole
                        ? "Select a person and enter a role."
                        : missingUser
                          ? "Select a person."
                          : "Enter a role."}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ====================== TERMS SECTION ======================
  const renderTermsSection = () => {
    const selectedId = values.terms_template_id;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Terms & Conditions</h3>
        <p className="text-sm text-[#6B7B7C]">
          Pick the template to attach. It's applied when the plan is created and
          can be swapped later without losing this document's history.
        </p>

        {termsTemplates.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No terms templates available.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {termsTemplates.map((template) => {
              const isSelected = selectedId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      terms_template_id: template.id,
                    }))
                  }
                  className={`text-left border rounded-lg p-4 flex items-start justify-between gap-3 transition ${
                    isSelected
                      ? "border-[#1F453B] bg-[#F4F6F7]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-[#333333]">
                      {template.name}
                    </div>
                    <div className="text-xs text-[#94A3A5] mt-1">
                      {template.scope} • v{template.current_version}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2
                      size={20}
                      className="text-[#1F453B] shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section) => {
    if (section.type === "phases") return renderPhasesSection();
    if (section.type === "team") return renderTeamSection();
    if (section.type === "terms") return renderTermsSection();
    return null;
  };

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Please select a project.");
    if (!values.phases?.length) return toast.error("Add at least one phase.");

    const overview = values.Overview || {};

    // Validate team members BEFORE they'd otherwise be silently
    // filtered out of the payload. A row with a person selected but no
    // role (or vice versa) used to just vanish on save with no warning.
    const rawMembers = values.team_members || [];
    const incompleteMembers = rawMembers.filter(
      (m) => !(m.user_id && m.role_label),
    );
    if (incompleteMembers.length > 0) {
      return toast.error(
        `${incompleteMembers.length} team member${
          incompleteMembers.length > 1 ? "s are" : " is"
        } missing a person or role. Fill both fields or remove the row before saving.`,
      );
    }

    const payload = {
      project_id: projectId,
      title: overview.title || "Plan of Action",
      execution_description: overview.execution_description || undefined,
      total_duration_min_days: toNumberOrUndefined(
        overview.total_duration_min_days,
      ),
      total_duration_max_days: toNumberOrUndefined(
        overview.total_duration_max_days,
      ),
      total_duration_label: overview.total_duration_label || undefined,
      // only include when it is a real UUID
      ...(values.terms_template_id
        ? { terms_template_id: values.terms_template_id }
        : {}),
      phases: values.phases.map(({ id, ...phase }) => ({
        ...phase,
        phase_number: Number(phase.phase_number),
        duration_min_days: toNumberOrUndefined(phase.duration_min_days),
        duration_max_days: toNumberOrUndefined(phase.duration_max_days),
        gantt_start_offset_days: toNumberOrUndefined(
          phase.gantt_start_offset_days,
        ),
        gantt_duration_days: toNumberOrUndefined(phase.gantt_duration_days),
      })),
      // rawMembers is already validated complete above, so no filtering
      // is needed (and none should happen silently again).
      team_members: rawMembers.map(({ id, ...member }) => member),
    };

    try {
      const plan = await createPlanOfAction(payload).unwrap();
      toast.success("Plan of Action created successfully.");
      localStorage.removeItem(SAVE_KEY);
      navigate(`/plan-of-actions/${plan.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create Plan of Action.");
    }
  };

  return (
    <PlanOfActionSectionForm
      title="Plan of Action"
      subtitle="Define phases, team and terms for this project"
      submitLabel="Save Plan of Action"
      sections={POA_SECTIONS}
      values={values}
      onFieldChange={handleFieldChange}
      projects={projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      renderSection={renderSection}
    />
  );
}
