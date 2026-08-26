import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, UserRound, Star } from "lucide-react";
import {
  useCreateProjectMutation,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useGetProjectTeamQuery,
  useAddProjectTeamMemberMutation,
  useRemoveProjectTeamMemberMutation,
} from "../../api/project.api"; // adjust import path
import {
  useGetProjectTypesQuery,
  useCreateProjectTypeMutation,
} from "../../api/project-type.api"; // adjust import path
import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../../api/client.api"; // adjust import path
import { useGetUsersQuery } from "../../api/user.api"; // adjust import path

// UI shows friendly labels; CreateProjectDto/UpdateProjectDto's `priority`
// is validated against the ProjectPriority enum, which is uppercase.
const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

// Dates come back from the API as ISO datetimes (e.g. 2026-07-22T00:00:00.000Z)
// but <input type="date"> needs a plain yyyy-mm-dd value.
const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const emptyMemberDraft = { user_id: "", role_label: "", is_primary: false };

export default function ProjectNew() {
  const nav = useNavigate();
  const { id: projectId } = useParams(); // present on /projects/:id/edit, absent on /projects/new
  const isEdit = Boolean(projectId);

  const [form, setForm] = useState({
    name: "",
    client_id: "",
    project_type_id: "",
    site_location: "",
    priority: "MEDIUM",
    expected_completion_date: "",
  });
  const [hydrated, setHydrated] = useState(false);

  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  // Team members staged locally while creating a project (CreateProjectDto
  // accepts `team_members`; UpdateProjectDto does not, so in edit mode new
  // members are added immediately via the dedicated team endpoint instead).
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberDraft, setMemberDraft] = useState(emptyMemberDraft);

  const {
    data: project,
    isFetching: projectLoading,
    isError: projectError,
  } = useGetProjectByIdQuery(projectId, { skip: !isEdit });

  const {
    data: types = [],
    isFetching: typesLoading,
    isError: typesError,
  } = useGetProjectTypesQuery();

  const {
    data: clients = [],
    isFetching: clientsLoading,
    isError: clientsError,
  } = useGetClientsQuery();

  const {
    data: users = [],
    isFetching: usersLoading,
    isError: usersError,
  } = useGetUsersQuery({ is_active: true });

  const { data: existingTeam = [], isFetching: existingTeamLoading } =
    useGetProjectTeamQuery(projectId, { skip: !isEdit });

  const [createProjectType, { isLoading: creatingType }] =
    useCreateProjectTypeMutation();
  const [createClient, { isLoading: creatingClient }] =
    useCreateClientMutation();
  const [createProject, { isLoading: creatingProject }] =
    useCreateProjectMutation();
  const [updateProject, { isLoading: updatingProject }] =
    useUpdateProjectMutation();
  const [addProjectTeamMember, { isLoading: addingMember }] =
    useAddProjectTeamMemberMutation();
  const [removeProjectTeamMember, { isLoading: removingMember }] =
    useRemoveProjectTeamMemberMutation();

  const busy = isEdit ? updatingProject : creatingProject;

  // Surface fetch errors the same way the old axios .catch() did.
  useEffect(() => {
    if (projectError) toast.error("Failed to load project");
  }, [projectError]);
  useEffect(() => {
    if (typesError) toast.error("Failed to load project types");
  }, [typesError]);
  useEffect(() => {
    if (clientsError) toast.error("Failed to load clients");
  }, [clientsError]);
  useEffect(() => {
    if (usersError) toast.error("Failed to load users");
  }, [usersError]);

  // Edit mode: hydrate the form once the project has loaded. Guarded by
  // `hydrated` so a refetch afterwards doesn't clobber what's being typed.
  useEffect(() => {
    if (!isEdit || !project || hydrated) return;
    setForm({
      name: project.name || "",
      client_id: project.client_id || project.client?.id || "",
      project_type_id:
        project.project_type_id || project.project_type?.id || "",
      site_location: project.site_location || "",
      priority: project.priority || "MEDIUM",
      expected_completion_date: toDateInputValue(
        project.expected_completion_date,
      ),
    });
    setHydrated(true);
  }, [isEdit, project, hydrated]);

  // Create mode: default the selects to the first option once data loads.
  useEffect(() => {
    if (isEdit) return;
    if (!form.project_type_id && types.length) {
      setForm((f) => ({ ...f, project_type_id: types[0].id }));
    }
  }, [isEdit, types, form.project_type_id]);
  useEffect(() => {
    if (isEdit) return;
    if (!form.client_id && clients.length) {
      setForm((f) => ({ ...f, client_id: clients[0].id }));
    }
  }, [isEdit, clients, form.client_id]);

  const saveNewType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      const data = await createProjectType({
        name: newTypeName.trim(),
      }).unwrap();
      toast.success(`Project type "${data.name}" added`);
      setShowAddType(false);
      setNewTypeName("");
      setForm((f) => ({ ...f, project_type_id: data.id }));
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to add project type");
    }
  };

  const saveNewClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      const data = await createClient({
        name: newClientName.trim(),
      }).unwrap();
      toast.success(`Client "${data.name}" added`);
      setShowAddClient(false);
      setNewClientName("");
      setForm((f) => ({ ...f, client_id: data.id }));
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to add client");
    }
  };

  // Users already assigned, whether staged locally (create) or already
  // saved on the project (edit) — used to stop the same person being added
  // twice.
  const assignedUserIds = new Set([
    ...teamMembers.map((m) => m.user_id),
    ...(isEdit ? existingTeam.map((m) => m.user_id) : []),
  ]);

  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id));

  const resetMemberDraft = () => {
    setShowAddMember(false);
    setMemberDraft(emptyMemberDraft);
  };

  const saveTeamMember = async () => {
    if (!memberDraft.user_id) {
      toast.error("Select a user");
      return;
    }
    if (!memberDraft.role_label.trim()) {
      toast.error("Role required");
      return;
    }

    const user = users.find((u) => u.id === memberDraft.user_id);

    if (isEdit) {
      // Project already exists — assign the member right away.
      try {
        await addProjectTeamMember({
          projectId,
          user_id: memberDraft.user_id,
          role_label: memberDraft.role_label.trim(),
          is_primary: memberDraft.is_primary,
          sort_order: existingTeam.length,
        }).unwrap();
        toast.success(
          `${user?.name || user?.full_name || "Member"} added to team`,
        );
        resetMemberDraft();
      } catch (e) {
        const messages = e?.data?.message;
        toast.error(
          Array.isArray(messages)
            ? messages[0]
            : messages || e?.data?.detail || "Failed to add team member",
        );
      }
    } else {
      // Project doesn't exist yet — stage locally, sent with the create payload.
      setTeamMembers((prev) => [
        ...prev,
        {
          tempId: `${Date.now()}-${Math.random()}`,
          user_id: memberDraft.user_id,
          user_name: user?.name || user?.full_name || "Unknown user",
          role_label: memberDraft.role_label.trim(),
          is_primary: memberDraft.is_primary,
        },
      ]);
      resetMemberDraft();
    }
  };

  const removeStagedMember = (tempId) => {
    setTeamMembers((prev) => prev.filter((m) => m.tempId !== tempId));
  };

  const removeSavedMember = async (teamMemberId) => {
    try {
      await removeProjectTeamMember({ projectId, teamMemberId }).unwrap();
      toast.success("Team member removed");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to remove team member");
    }
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    if (!form.site_location.trim()) return toast.error("Location required");

    // Send only what CreateProjectDto/UpdateProjectDto accepts, with the
    // exact field names/types it validates. Optional fields are omitted
    // rather than sent as empty strings, since e.g. an empty client_id
    // would fail @IsUUID().
    const payload = {
      name: form.name.trim(),
      site_location: form.site_location.trim(),
      priority: form.priority,
      ...(form.client_id ? { client_id: form.client_id } : {}),
      ...(form.project_type_id
        ? { project_type_id: form.project_type_id }
        : {}),
      ...(form.expected_completion_date
        ? { expected_completion_date: form.expected_completion_date }
        : {}),
      // team_members is only accepted by CreateProjectDto — UpdateProjectDto
      // omits it, so edits never send this key.
      ...(!isEdit && teamMembers.length
        ? {
            team_members: teamMembers.map((m, idx) => ({
              user_id: m.user_id,
              role_label: m.role_label,
              is_primary: m.is_primary,
              sort_order: idx,
            })),
          }
        : {}),
    };

    try {
      if (isEdit) {
        const data = await updateProject({
          id: projectId,
          ...payload,
        }).unwrap();
        toast.success("Project updated");
        nav(`/projects/${data?.id || projectId}`);
      } else {
        const data = await createProject(payload).unwrap();
        toast.success("Project created");
        nav(`/projects/${data.id}`);
      }
    } catch (e) {
      const messages = e?.data?.message;
      toast.error(Array.isArray(messages) ? messages[0] : messages || "Failed");
    }
  };

  if (isEdit && projectLoading && !hydrated) {
    return (
      <div className="max-w-[900px] mx-auto p-6">
        <div className="text-[13px] text-[#6B7B7C]">Loading project…</div>
      </div>
    );
  }

  const backTarget = isEdit ? `/projects/${projectId}` : "/projects";

  // Unified list for rendering: saved members (edit mode) + staged members
  // (create mode, or additions made this session before hitting Save on edit).
  const teamRows = isEdit
    ? existingTeam.map((m) => ({
        key: m.id,
        saved: true,
        id: m.id,
        user_name: m.user?.name || m.user?.full_name || m.user_id,
        role_label: m.role_label,
        is_primary: m.is_primary,
      }))
    : teamMembers.map((m) => ({
        key: m.tempId,
        saved: false,
        tempId: m.tempId,
        user_name: m.user_name,
        role_label: m.role_label,
        is_primary: m.is_primary,
      }));

  return (
    <div className="max-w-[900px] mx-auto p-6">
      <button
        onClick={() => nav(backTarget)}
        className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={14} /> {isEdit ? "Project" : "Projects"}
      </button>
      <h1 className="text-[36px] font-bold text-[#333333]">
        {isEdit ? "Edit Project" : "Create Project"}
      </h1>
      <p className="text-[13px] text-[#6B7B7C] mt-1">
        {isEdit
          ? "Update project details. The phase tracker keeps updating automatically as documents are finalized."
          : "Set up a new project — the phase tracker is populated automatically as documents are finalized."}
      </p>

      <div className="bg-white border border-[#B5C4B6] rounded-xl p-6 mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Project Name *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-name"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Client
          </label>
          <div className="flex items-center gap-2 mt-1">
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              disabled={clientsLoading}
              className="flex-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
              data-testid="client-select"
            >
              {clientsLoading && <option>Loading…</option>}
              {!clientsLoading && clients.length === 0 && (
                <option value="">No clients yet</option>
              )}
              {!clientsLoading &&
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAddClient(true)}
              className="w-9 h-9 rounded-lg border border-[#1F453B] text-[#333333] flex items-center justify-center hover:bg-[#EAEEF0]"
              title="Add new client"
              data-testid="add-client-btn"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Project Type
          </label>
          <div className="flex items-center gap-2 mt-1">
            <select
              value={form.project_type_id}
              onChange={(e) =>
                setForm({ ...form, project_type_id: e.target.value })
              }
              disabled={typesLoading}
              className="flex-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
              data-testid="project-type-select"
            >
              {typesLoading && <option>Loading…</option>}
              {!typesLoading &&
                types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => setShowAddType(true)}
              className="w-9 h-9 rounded-lg border border-[#1F453B] text-[#333333] flex items-center justify-center hover:bg-[#EAEEF0]"
              title="Add new project type"
              data-testid="add-project-type-btn"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Location *
          </label>
          <input
            value={form.site_location}
            onChange={(e) =>
              setForm({ ...form, site_location: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-site-location"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-priority"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Expected Completion
          </label>
          <input
            type="date"
            value={form.expected_completion_date}
            onChange={(e) =>
              setForm({ ...form, expected_completion_date: e.target.value })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-expected-completion"
          />
        </div>
      </div>

      {/* ===================== Team Members ===================== */}
      <div className="bg-white border border-[#B5C4B6] rounded-xl p-6 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold text-[#333333]">
              Team Members
            </div>
            <p className="text-[12.5px] text-[#6B7B7C] mt-0.5">
              {isEdit
                ? "Assign people to this project. Changes here take effect immediately."
                : "Assign people to this project. They'll be attached as soon as the project is created."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="h-9 px-3 rounded-lg border border-[#1F453B] text-[#333333] text-[13px] font-semibold flex items-center gap-1 hover:bg-[#EAEEF0]"
            data-testid="add-team-member-btn"
          >
            <Plus size={15} /> Add Member
          </button>
        </div>

        {isEdit && existingTeamLoading && (
          <div className="text-[13px] text-[#6B7B7C] mt-4">Loading team…</div>
        )}

        {(!isEdit || !existingTeamLoading) && teamRows.length === 0 && (
          <div className="text-[13px] text-[#6B7B7C] mt-4">
            No team members assigned yet.
          </div>
        )}

        {teamRows.length > 0 && (
          <div className="mt-4 divide-y divide-[#EAEEF0]">
            {teamRows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between py-2.5"
                data-testid="team-member-row"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EAEEF0] text-[#1F453B] flex items-center justify-center">
                    <UserRound size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#333333] flex items-center gap-1.5">
                      {row.user_name}
                      {row.is_primary && (
                        <span
                          title="Primary contact"
                          className="text-[#C08B1F]"
                        >
                          <Star size={13} fill="currentColor" />
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-[#6B7B7C]">
                      {row.role_label}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    row.saved
                      ? removeSavedMember(row.id)
                      : removeStagedMember(row.tempId)
                  }
                  disabled={row.saved && removingMember}
                  className="text-[#6B7B7C] hover:text-[#B3261E] p-1"
                  title="Remove"
                  data-testid="remove-team-member-btn"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => nav(backTarget)}
          className="px-4 py-2 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
          data-testid="btn-create-project-confirm"
        >
          {isEdit ? "Save Changes" : "Create Project"}
        </button>
      </div>

      {showAddType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAddType(false)}
        >
          <div
            className="bg-white rounded-2xl w-[420px] p-6 relative"
            onClick={(e) => e.stopPropagation()}
            data-testid="add-type-modal"
          >
            <button
              className="absolute top-4 right-4 text-[#6B7B7C]"
              onClick={() => setShowAddType(false)}
            >
              <X size={18} />
            </button>
            <div className="text-[18px] font-semibold text-[#333333] mb-1">
              New Project Type
            </div>
            <div className="text-[12.5px] text-[#6B7B7C] mb-4">
              Add a project type on the fly. It becomes available for all future
              projects.
            </div>
            <input
              autoFocus
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Boutique Retail"
              className="w-full h-10 px-3 rounded-lg border border-[#B5C4B6] bg-[#EAEEF0] text-[13.5px]"
              data-testid="new-type-name"
              onKeyDown={(e) => e.key === "Enter" && saveNewType()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddType(false)}
                className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333]"
              >
                Cancel
              </button>
              <button
                onClick={saveNewType}
                disabled={creatingType}
                className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
                data-testid="new-type-save"
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAddClient(false)}
        >
          <div
            className="bg-white rounded-2xl w-[420px] p-6 relative"
            onClick={(e) => e.stopPropagation()}
            data-testid="add-client-modal"
          >
            <button
              className="absolute top-4 right-4 text-[#6B7B7C]"
              onClick={() => setShowAddClient(false)}
            >
              <X size={18} />
            </button>
            <div className="text-[18px] font-semibold text-[#333333] mb-1">
              New Client
            </div>
            <div className="text-[12.5px] text-[#6B7B7C] mb-4">
              Add a client on the fly. It becomes available for all future
              projects.
            </div>
            <input
              autoFocus
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="e.g. Apex Buildcon Pvt Ltd"
              className="w-full h-10 px-3 rounded-lg border border-[#B5C4B6] bg-[#EAEEF0] text-[13.5px]"
              data-testid="new-client-name"
              onKeyDown={(e) => e.key === "Enter" && saveNewClient()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddClient(false)}
                className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333]"
              >
                Cancel
              </button>
              <button
                onClick={saveNewClient}
                disabled={creatingClient}
                className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
                data-testid="new-client-save"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={resetMemberDraft}
        >
          <div
            className="bg-white rounded-2xl w-[420px] p-6 relative"
            onClick={(e) => e.stopPropagation()}
            data-testid="add-team-member-modal"
          >
            <button
              className="absolute top-4 right-4 text-[#6B7B7C]"
              onClick={resetMemberDraft}
            >
              <X size={18} />
            </button>
            <div className="text-[18px] font-semibold text-[#333333] mb-1">
              Assign Team Member
            </div>
            <div className="text-[12.5px] text-[#6B7B7C] mb-4">
              Pick a user and describe their role on this project.
            </div>

            <label className="text-[12px] font-semibold text-[#6B7B7C]">
              User *
            </label>
            <select
              autoFocus
              value={memberDraft.user_id}
              onChange={(e) =>
                setMemberDraft({ ...memberDraft, user_id: e.target.value })
              }
              disabled={usersLoading}
              className="w-full h-10 px-3 mt-1 rounded-lg border border-[#B5C4B6] bg-[#EAEEF0] text-[13.5px]"
              data-testid="team-member-user-select"
            >
              <option value="">
                {usersLoading ? "Loading…" : "Select a user"}
              </option>
              {!usersLoading &&
                availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.full_name || u.email}
                  </option>
                ))}
            </select>
            {!usersLoading && availableUsers.length === 0 && (
              <div className="text-[12px] text-[#6B7B7C] mt-1">
                Every active user is already assigned.
              </div>
            )}

            <label className="text-[12px] font-semibold text-[#6B7B7C] mt-3 block">
              Role *
            </label>
            <input
              value={memberDraft.role_label}
              onChange={(e) =>
                setMemberDraft({ ...memberDraft, role_label: e.target.value })
              }
              placeholder="e.g. Site Engineer"
              className="w-full h-10 px-3 mt-1 rounded-lg border border-[#B5C4B6] bg-[#EAEEF0] text-[13.5px]"
              data-testid="team-member-role-label"
              onKeyDown={(e) => e.key === "Enter" && saveTeamMember()}
            />

            <label className="flex items-center gap-2 mt-3 text-[13px] text-[#333333]">
              <input
                type="checkbox"
                checked={memberDraft.is_primary}
                onChange={(e) =>
                  setMemberDraft({
                    ...memberDraft,
                    is_primary: e.target.checked,
                  })
                }
                data-testid="team-member-is-primary"
              />
              Primary contact for this project
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={resetMemberDraft}
                className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333]"
              >
                Cancel
              </button>
              <button
                onClick={saveTeamMember}
                disabled={addingMember}
                className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold"
                data-testid="team-member-save"
              >
                {isEdit ? "Add to Team" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
