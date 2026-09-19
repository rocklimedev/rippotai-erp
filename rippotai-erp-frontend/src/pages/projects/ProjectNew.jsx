import { useGetAccessRolesQuery } from '@/api/users/access.api';
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  X,
  UserRound,
  Star,
  Users,
  AlertCircle,
  UsersRound,
  RefreshCw,
} from "lucide-react";

import {
  useCreateProjectMutation,
  useGetProjectByIdQuery,
  useUpdateProjectMutation,
  useGetProjectTeamQuery,
  useAddProjectTeamMemberMutation,
  useRemoveProjectTeamMemberMutation,
} from "../../api/projects/project.api";

import {
  useGetProjectTypesQuery,
  useCreateProjectTypeMutation,
} from "../../api/projects/project-type.api";

import {
  useGetClientsQuery,
  useCreateClientMutation,
} from "../../api/projects/client.api";

import { useGetUsersQuery } from "../../api/users/user.api";

import {
  useGetTeamsQuery,
  useGetTeamMembersQuery,
} from "../../api/users/team.api";

// ============================================================
// CONSTANTS
// ============================================================

const PRIORITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
];

const emptyMemberDraft = {
  user_id: "",
  role_label: "",
  is_primary: false,
};

// ============================================================
// HELPERS
// ============================================================

const toDateInputValue = (value) => {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toISOString().slice(0, 10);
};

const getUserName = (user) => {
  if (!user) return "Unknown user";

  return user.name || user.full_name || user.email || "Unknown user";
};

const getTeamMemberUser = (member) => {
  return member?.user || member?.member || null;
};

const getTeamMemberName = (member) => {
  const user = getTeamMemberUser(member);

  return (
    user?.name ||
    user?.full_name ||
    user?.email ||
    member?.user_name ||
    member?.name ||
    member?.user_id ||
    "Unknown user"
  );
};

const getTeamMemberRole = (member) => {
  return (
    member?.role_label ||
    member?.job_title ||
    member?.role ||
    member?.user?.job_title ||
    "Team Member"
  );
};

// ============================================================
// COMPONENT
// ============================================================

export default function ProjectNew() {
  const { data: projectRoles = [] } = useGetAccessRolesQuery('PROJECT');
  const nav = useNavigate();
  const { id: projectId } = useParams();

  const isEdit = Boolean(projectId);

  // ============================================================
  // PROJECT FORM
  // ============================================================

  const [form, setForm] = useState({
    name: "",
    client_id: "",
    project_type_id: "",
    site_location: "",
    priority: "MEDIUM",
    expected_completion_date: "",
  });

  const [hydrated, setHydrated] = useState(false);

  // ============================================================
  // PROJECT TYPE
  // ============================================================

  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  // ============================================================
  // CLIENT
  // ============================================================

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  // ============================================================
  // TEAM
  // ============================================================

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teamSyncing, setTeamSyncing] = useState(false);

  // ============================================================
  // TEAM MEMBERS
  // ============================================================

  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberDraft, setMemberDraft] = useState(emptyMemberDraft);

  // ============================================================
  // PROJECT
  // ============================================================

  const {
    data: project,
    isFetching: projectLoading,
    isError: projectError,
  } = useGetProjectByIdQuery(projectId, {
    skip: !isEdit,
  });

  // ============================================================
  // PROJECT TYPES
  // ============================================================

  const {
    data: types = [],
    isFetching: typesLoading,
    isError: typesError,
  } = useGetProjectTypesQuery();

  // ============================================================
  // CLIENTS
  // ============================================================

  const {
    data: clients = [],
    isFetching: clientsLoading,
    isError: clientsError,
  } = useGetClientsQuery();

  // ============================================================
  // USERS
  // ============================================================

  const {
    data: users = [],
    isFetching: usersLoading,
    isError: usersError,
  } = useGetUsersQuery({
    is_active: true,
  });

  // ============================================================
  // ADMIN TEAMS
  // ============================================================

  const {
    data: teams = [],
    isFetching: teamsLoading,
    isError: teamsError,
  } = useGetTeamsQuery();

  // ============================================================
  // SELECTED TEAM MEMBERS
  // ============================================================

  const {
    data: selectedTeamMembers = [],
    isFetching: selectedTeamMembersLoading,
    isError: selectedTeamMembersError,
  } = useGetTeamMembersQuery(selectedTeamId, {
    skip: !selectedTeamId,
  });

  // ============================================================
  // PROJECT TEAM
  // ============================================================

  const { data: existingTeam = [], isFetching: existingTeamLoading } =
    useGetProjectTeamQuery(projectId, {
      skip: !isEdit,
    });

  // ============================================================
  // MUTATIONS
  // ============================================================

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

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  useEffect(() => {
    if (projectError) {
      toast.error("Failed to load project");
    }
  }, [projectError]);

  useEffect(() => {
    if (typesError) {
      toast.error("Failed to load project types");
    }
  }, [typesError]);

  useEffect(() => {
    if (clientsError) {
      toast.error("Failed to load clients");
    }
  }, [clientsError]);

  useEffect(() => {
    if (usersError) {
      toast.error("Failed to load users");
    }
  }, [usersError]);

  useEffect(() => {
    if (teamsError) {
      toast.error("Failed to load teams");
    }
  }, [teamsError]);

  useEffect(() => {
    if (selectedTeamMembersError) {
      toast.error("Failed to load team members");
    }
  }, [selectedTeamMembersError]);

  // ============================================================
  // HYDRATE EDIT FORM
  // ============================================================

  useEffect(() => {
    if (!isEdit || !project || hydrated) {
      return;
    }

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

    /*
     * If the project already contains a team reference,
     * use it as the initial selected team.
     */
    const projectTeamId =
      project.team_id ||
      project.team?.id ||
      project.team?.team_id ||
      project.primary_team_id ||
      "";

    if (projectTeamId) {
      setSelectedTeamId(projectTeamId);
    }

    setHydrated(true);
  }, [isEdit, project, hydrated]);

  // ============================================================
  // DEFAULT PROJECT TYPE
  // ============================================================

  useEffect(() => {
    if (isEdit) return;

    if (!form.project_type_id && types.length) {
      setForm((f) => ({
        ...f,
        project_type_id: types[0].id,
      }));
    }
  }, [isEdit, types, form.project_type_id]);

  // ============================================================
  // DEFAULT CLIENT
  // ============================================================

  useEffect(() => {
    if (isEdit) return;

    if (!form.client_id && clients.length) {
      setForm((f) => ({
        ...f,
        client_id: clients[0].id,
      }));
    }
  }, [isEdit, clients, form.client_id]);

  // ============================================================
  // EXISTING PROJECT TEAM USER IDS
  // ============================================================

  const existingTeamUserIds = useMemo(() => {
    return new Set(
      existingTeam.map((member) => member?.user_id).filter(Boolean),
    );
  }, [existingTeam]);

  // ============================================================
  // STAGED TEAM USER IDS
  // ============================================================

  const stagedTeamUserIds = useMemo(() => {
    return new Set(
      teamMembers.map((member) => member?.user_id).filter(Boolean),
    );
  }, [teamMembers]);

  // ============================================================
  // SELECTED TEAM
  // ============================================================

  const selectedTeam = useMemo(() => {
    return teams.find((team) => team.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  // ============================================================
  // SELECTED TEAM MEMBER COUNT
  // ============================================================

  const selectedTeamMemberCount = selectedTeamMembers.length;

  // ============================================================
  // ADD PROJECT TYPE
  // ============================================================

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

      setForm((f) => ({
        ...f,
        project_type_id: data.id,
      }));
    } catch (e) {
      toast.error(
        e?.data?.detail || e?.data?.message || "Failed to add project type",
      );
    }
  };

  // ============================================================
  // ADD CLIENT
  // ============================================================

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

      setForm((f) => ({
        ...f,
        client_id: data.id,
      }));
    } catch (e) {
      toast.error(
        e?.data?.detail || e?.data?.message || "Failed to add client",
      );
    }
  };

  // ============================================================
  // SELECT TEAM
  //
  // CREATE MODE:
  // Automatically stage all team members.
  //
  // EDIT MODE:
  // Automatically add missing team members to project.
  // ============================================================

  const handleTeamChange = async (teamId) => {
    setSelectedTeamId(teamId);

    if (!teamId) {
      if (!isEdit) {
        setTeamMembers([]);
      }

      return;
    }

    /*
     * In create mode the team members are fetched by
     * useGetTeamMembersQuery and automatically staged
     * in the effect below.
     */
  };

  // ============================================================
  // AUTO ASSIGN TEAM MEMBERS
  // ============================================================

  useEffect(() => {
    if (!selectedTeamId) {
      return;
    }

    if (selectedTeamMembersLoading) {
      return;
    }

    if (!selectedTeamMembers.length) {
      if (!isEdit) {
        setTeamMembers([]);
      }

      return;
    }

    // ==========================================================
    // CREATE MODE
    // ==========================================================

    if (!isEdit) {
      const generatedMembers = selectedTeamMembers
        .map((member, index) => {
          const userId = member?.user_id;

          if (!userId) {
            return null;
          }

          const user = users.find((u) => u.id === userId);

          return {
            tempId: `team-${selectedTeamId}-${userId}`,
            user_id: userId,
            user_name: getTeamMemberName(member) || getUserName(user),
            role_label: getTeamMemberRole(member),
            is_primary: Boolean(member?.is_primary),
            sort_order: index,
            team_id: selectedTeamId || undefined,
          };
        })
        .filter(Boolean);

      setTeamMembers(generatedMembers);

      return;
    }

    // ==========================================================
    // EDIT MODE
    //
    // Automatically assign users from selected admin team
    // that are not already project members.
    // ==========================================================

    const missingMembers = selectedTeamMembers.filter((member) => {
      const userId = member?.user_id;

      return userId && !existingTeamUserIds.has(userId);
    });

    if (!missingMembers.length) {
      return;
    }

    let cancelled = false;

    const syncProjectTeam = async () => {
      setTeamSyncing(true);

      let addedCount = 0;

      try {
        for (let index = 0; index < missingMembers.length; index += 1) {
          if (cancelled) {
            return;
          }

          const member = missingMembers[index];

          await addProjectTeamMember({
            projectId,

            user_id: member.user_id,

            role_label: getTeamMemberRole(member),

            is_primary: Boolean(member?.is_primary),

            sort_order: existingTeam.length + index,

            /*
             * This is useful if your project API accepts team_id.
             * Backend can validate that this is an actual team
             * membership.
             */
            team_id: selectedTeamId || undefined,
          }).unwrap();

          addedCount += 1;
        }

        if (!cancelled && addedCount > 0) {
          toast.success(
            `${addedCount} ${addedCount === 1 ? "member" : "members"} from "${selectedTeam?.name || "team"}" assigned to project`,
          );
        }
      } catch (e) {
        if (!cancelled) {
          const messages = e?.data?.message;

          toast.error(
            Array.isArray(messages)
              ? messages[0]
              : messages || e?.data?.detail || "Failed to assign team members",
          );
        }
      } finally {
        if (!cancelled) {
          setTeamSyncing(false);
        }
      }
    };

    syncProjectTeam();

    return () => {
      cancelled = true;
    };
  }, [
    selectedTeamId,
    selectedTeamMembers,
    selectedTeamMembersLoading,
    existingTeamUserIds,
    existingTeam.length,
    isEdit,
    projectId,
    users,
    selectedTeam?.name,
  ]);

  // ============================================================
  // RESET MEMBER DRAFT
  // ============================================================

  const resetMemberDraft = () => {
    setShowAddMember(false);
    setMemberDraft(emptyMemberDraft);
  };

  // ============================================================
  // AVAILABLE MANUAL USERS
  //
  // Manual users are only shown if they are already members
  // of some admin team.
  // ============================================================

  const availableUsers = useMemo(() => {
    if (!selectedTeamId) {
      return users.filter(user => user.is_active !== false && !(isEdit ? existingTeamUserIds : stagedTeamUserIds).has(user.id));
    }

    return selectedTeamMembers
      .map((member) => {
        const user = users.find((u) => u.id === member.user_id);

        if (!user) {
          return null;
        }

        return {
          ...user,
          __teamMember: member,
        };
      })
      .filter(Boolean)
      .filter((user) => {
        if (isEdit) {
          return !existingTeamUserIds.has(user.id);
        }

        return !stagedTeamUserIds.has(user.id);
      });
  }, [
    selectedTeamId,
    selectedTeamMembers,
    users,
    isEdit,
    existingTeamUserIds,
    stagedTeamUserIds,
  ]);

  // ============================================================
  // ADD TEAM MEMBER MANUALLY
  // ============================================================

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

    if (!user) {
      toast.error("Selected user could not be found");
      return;
    }

    // ==========================================================
    // EDIT MODE
    // ==========================================================

    if (isEdit) {
      try {
        await addProjectTeamMember({
          projectId,

          user_id: memberDraft.user_id,

          role_label: memberDraft.role_label.trim(),

          is_primary: memberDraft.is_primary,

          sort_order: existingTeam.length,

          team_id: selectedTeamId || undefined,
        }).unwrap();

        toast.success(`${getUserName(user)} added to project team`);

        resetMemberDraft();
      } catch (e) {
        const messages = e?.data?.message;

        toast.error(
          Array.isArray(messages)
            ? messages[0]
            : messages || e?.data?.detail || "Failed to add team member",
        );
      }

      return;
    }

    // ==========================================================
    // CREATE MODE
    // ==========================================================

    setTeamMembers((prev) => [
      ...prev,
      {
        tempId: `${Date.now()}-${Math.random()}`,

        user_id: memberDraft.user_id,

        user_name: getUserName(user),

        role_label: memberDraft.role_label.trim(),

        is_primary: memberDraft.is_primary,

        team_id: selectedTeamId || undefined,
      },
    ]);

    resetMemberDraft();
  };

  // ============================================================
  // REMOVE STAGED MEMBER
  // ============================================================

  const removeStagedMember = (tempId) => {
    setTeamMembers((prev) => prev.filter((m) => m.tempId !== tempId));
  };

  // ============================================================
  // REMOVE SAVED MEMBER
  // ============================================================

  const removeSavedMember = async (teamMemberId) => {
    try {
      await removeProjectTeamMember({
        projectId,
        teamMemberId,
      }).unwrap();

      toast.success("Team member removed");
    } catch (e) {
      toast.error(
        e?.data?.message || e?.data?.detail || "Failed to remove team member",
      );
    }
  };

  // ============================================================
  // SUBMIT PROJECT
  // ============================================================

  const submit = async () => {
    if (!form.name.trim()) {
      return toast.error("Name required");
    }

    if (!form.site_location.trim()) {
      return toast.error("Location required");
    }

    const payload = {
      name: form.name.trim(),

      site_location: form.site_location.trim(),

      priority: form.priority,

      /*
       * The selected organizational team.
       *
       * Keep this if CreateProjectDto / UpdateProjectDto
       * supports team_id.
       */
      team_id: selectedTeamId || undefined,

      ...(form.client_id
        ? {
            client_id: form.client_id,
          }
        : {}),

      ...(form.project_type_id
        ? {
            project_type_id: form.project_type_id,
          }
        : {}),

      ...(form.expected_completion_date
        ? {
            expected_completion_date: form.expected_completion_date,
          }
        : {}),

      /*
       * CREATE ONLY
       *
       * The selected team's members have already been
       * populated into teamMembers automatically.
       */
      ...(!isEdit && teamMembers.length
        ? {
            team_members: teamMembers.map((member, index) => ({
              user_id: member.user_id,

              role_label: member.role_label,

              is_primary: Boolean(member.is_primary),

              sort_order: index,

              team_id: selectedTeamId || undefined,
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

      toast.error(
        Array.isArray(messages)
          ? messages[0]
          : messages || e?.data?.detail || "Failed",
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (isEdit && projectLoading && !hydrated) {
    return (
      <div className="max-w-[900px] mx-auto p-6">
        <div className="text-[13px] text-[#6B7B7C]">Loading project…</div>
      </div>
    );
  }

  const backTarget = isEdit ? `/projects/${projectId}` : "/projects";

  // ============================================================
  // TEAM ROWS
  // ============================================================

  const teamRows = isEdit
    ? existingTeam.map((m) => ({
        key: m.id,
        saved: true,
        id: m.id,

        user_name:
          m.user?.name || m.user?.full_name || m.user?.email || m.user_id,

        role_label: m.role_label || m.user?.job_title || "Team Member",

        is_primary: m.is_primary,

        team_name: m.team?.name || m.team_name || selectedTeam?.name || "",
      }))
    : teamMembers.map((m) => ({
        key: m.tempId,
        saved: false,
        tempId: m.tempId,

        user_name: m.user_name,

        role_label: m.role_label,

        is_primary: m.is_primary,

        team_name: selectedTeam?.name || "",
      }));

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-[900px] mx-auto p-6">
      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        onClick={() => nav(backTarget)}
        className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={14} />

        {isEdit ? "Project" : "Projects"}
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <h1 className="text-[36px] font-bold text-[#333333]">
        {isEdit ? "Edit Project" : "Create Project"}
      </h1>

      <p className="text-[13px] text-[#6B7B7C] mt-1">
        {isEdit
          ? "Update project details and manage the project team."
          : "Set up a new project and assign an organizational team."}
      </p>

      {/* ======================================================
          PROJECT DETAILS
      ====================================================== */}

      <div className="bg-white border border-[#B5C4B6] rounded-xl p-6 mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PROJECT NAME */}

        <div className="md:col-span-2">
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Project Name *
          </label>

          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-name"
          />
        </div>

        {/* CLIENT */}

        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Client
          </label>

          <div className="flex items-center gap-2 mt-1">
            <select
              value={form.client_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  client_id: e.target.value,
                })
              }
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

        {/* PROJECT TYPE */}

        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Project Type
          </label>

          <div className="flex items-center gap-2 mt-1">
            <select
              value={form.project_type_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  project_type_id: e.target.value,
                })
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

        {/* LOCATION */}

        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Location *
          </label>

          <input
            value={form.site_location}
            onChange={(e) =>
              setForm({
                ...form,
                site_location: e.target.value,
              })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-site-location"
          />
        </div>

        {/* PRIORITY */}

        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Priority
          </label>

          <select
            value={form.priority}
            onChange={(e) =>
              setForm({
                ...form,
                priority: e.target.value,
              })
            }
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

        {/* EXPECTED COMPLETION */}

        <div>
          <label className="text-[12px] font-semibold text-[#6B7B7C]">
            Expected Completion
          </label>

          <input
            type="date"
            value={form.expected_completion_date}
            onChange={(e) =>
              setForm({
                ...form,
                expected_completion_date: e.target.value,
              })
            }
            className="w-full mt-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
            data-testid="new-expected-completion"
          />
        </div>

        {/* ==================================================
            TEAM
        ================================================== */}

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-semibold text-[#6B7B7C]">
              Organizational Team *
            </label>

            {selectedTeam && (
              <span className="text-[11px] text-[#6B7B7C] flex items-center gap-1">
                <UsersRound size={13} />
                {selectedTeamMemberCount} member
                {selectedTeamMemberCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <select
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={teamsLoading || teamSyncing}
              className="flex-1 px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]"
              data-testid="project-team-select"
            >
              <option value="">
                {teamsLoading ? "Loading teams…" : "Select organizational team"}
              </option>

              {!teamsLoading &&
                teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                    {team.status === "INACTIVE" ? " (Inactive)" : ""}
                  </option>
                ))}
            </select>

            {teamSyncing && (
              <div className="w-9 h-9 flex items-center justify-center text-[#1F453B]">
                <RefreshCw size={16} className="animate-spin" />
              </div>
            )}
          </div>

          {selectedTeam && (
            <div className="mt-2 p-3 rounded-lg bg-[#F4F7F4] border border-[#D8E0DA]">
              <div className="flex items-start gap-2">
                <Users size={15} className="text-[#1F453B] mt-0.5 shrink-0" />

                <div>
                  <div className="text-[12px] font-semibold text-[#333333]">
                    {selectedTeam.name}
                  </div>

                  <div className="text-[11.5px] text-[#6B7B7C] mt-0.5">
                    {isEdit
                      ? "Members from this team are automatically added to this project."
                      : "All members of this team will automatically be assigned to this project when it is created."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTeamId && selectedTeamMembersLoading && (
            <div className="text-[11.5px] text-[#6B7B7C] mt-2">
              Loading team members…
            </div>
          )}

          {selectedTeamId &&
            !selectedTeamMembersLoading &&
            selectedTeamMembers.length === 0 && (
              <div className="flex items-start gap-2 text-[12px] text-[#6B7B7C] mt-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />

                <span>
                  This team currently has no members. Add users to the team from
                  the Team Administration page first.
                </span>
              </div>
            )}
        </div>
      </div>

      {/* ======================================================
          TEAM MEMBERS
      ====================================================== */}

      <div className="bg-white border border-[#B5C4B6] rounded-xl p-6 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold text-[#333333] flex items-center gap-2">
              <Users size={17} className="text-[#1F453B]" />
              Project Team
              {selectedTeam && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EAEEF0] text-[#6B7B7C]">
                  {selectedTeam.name}
                </span>
              )}
            </div>

            <p className="text-[12.5px] text-[#6B7B7C] mt-0.5">
              {selectedTeam
                ? isEdit
                  ? "Members of the selected organizational team are automatically assigned."
                  : "Members of the selected organizational team will be assigned automatically."
                : "Select an organizational team to populate the project team."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            disabled={usersLoading}
            className="h-9 px-3 rounded-lg border border-[#1F453B] text-[#333333] text-[13px] font-semibold flex items-center gap-1 hover:bg-[#EAEEF0] disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="add-team-member-btn"
          >
            <Plus size={15} />
            Add Member
          </button>
        </div>

        {/* TEAM SYNC */}

        {teamSyncing && (
          <div className="mt-4 p-3 rounded-lg bg-[#F4F7F4] border border-[#D8E0DA] flex items-center gap-2 text-[12px] text-[#1F453B]">
            <RefreshCw size={14} className="animate-spin" />
            Assigning team members to this project…
          </div>
        )}

        {/* TEAM LOADING */}

        {isEdit && existingTeamLoading && (
          <div className="text-[13px] text-[#6B7B7C] mt-4">
            Loading project team…
          </div>
        )}

        {/* NO TEAM */}

        {(!isEdit || !existingTeamLoading) &&
          !teamSyncing &&
          teamRows.length === 0 && (
            <div className="mt-4 p-4 rounded-lg bg-[#F8FAF9] border border-[#EAEEF0]">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="text-[#6B7B7C] mt-0.5" />

                <div>
                  <div className="text-[13px] font-semibold text-[#333333]">
                    No project team members
                  </div>

                  <div className="text-[12px] text-[#6B7B7C] mt-0.5">
                    {selectedTeam
                      ? "The selected team has no members."
                      : "Select a team above to automatically load its members."}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* TEAM LIST */}

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

                    {row.team_name && (
                      <div className="text-[11px] text-[#8A9899] mt-0.5">
                        Team: {row.team_name}
                      </div>
                    )}
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

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => nav(backTarget)}
          className="px-4 py-2 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold"
        >
          Cancel
        </button>

        <button
          onClick={submit}
          disabled={busy || teamSyncing}
          className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-50"
          data-testid="btn-create-project-confirm"
        >
          {isEdit ? "Save Changes" : "Create Project"}
        </button>
      </div>

      {/* ======================================================
          ADD PROJECT TYPE MODAL
      ====================================================== */}

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

      {/* ======================================================
          ADD CLIENT MODAL
      ====================================================== */}

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

      {/* ======================================================
          ADD TEAM MEMBER MODAL
      ====================================================== */}

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

            {/* HEADER */}

            <div className="text-[18px] font-semibold text-[#333333] mb-1">
              Add Project Team Member
            </div>

            <div className="text-[12.5px] text-[#6B7B7C] mb-4">
              Select another member from the selected organizational team.
            </div>

            {/* TEAM */}

            <div className="mb-4 p-3 rounded-lg bg-[#F4F7F4] border border-[#D8E0DA]">
              <div className="text-[11px] text-[#6B7B7C]">
                Organizational Team
              </div>

              <div className="text-[13px] font-semibold text-[#333333] mt-0.5">
                {selectedTeam?.name || "No team selected"}
              </div>
            </div>

            {/* USER */}

            <label className="text-[12px] font-semibold text-[#6B7B7C]">
              User *
            </label>

            <select
              autoFocus
              value={memberDraft.user_id}
              onChange={(e) =>
                setMemberDraft({
                  ...memberDraft,
                  user_id: e.target.value,
                })
              }
              disabled={
                usersLoading || selectedTeamMembersLoading
              }
              className="w-full h-10 px-3 mt-1 rounded-lg border border-[#B5C4B6] bg-[#EAEEF0] text-[13.5px]"
              data-testid="team-member-user-select"
            >
              <option value="">
                {selectedTeamMembersLoading
                  ? "Loading team members…"
                  : "Select team member"}
              </option>

              {!selectedTeamMembersLoading &&
                availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getUserName(u)}
                  </option>
                ))}
            </select>

            {!selectedTeamMembersLoading &&
              selectedTeamId &&
              availableUsers.length === 0 && (
                <div className="flex items-start gap-2 text-[12px] text-[#6B7B7C] mt-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />

                  <span>
                    All members of this team are already assigned to this
                    project.
                  </span>
                </div>
              )}

            {/* ROLE */}

            <label className="text-[12px] font-semibold text-[#6B7B7C] mt-3 block">
              Project Role *
            </label>

            <select
              value={memberDraft.role_label}
              onChange={event => setMemberDraft({ ...memberDraft, role_label: event.target.value })}
              className="w-full h-10 px-3 mt-1 rounded-lg border border-[#B5C4B6] bg-[#EAEEF0] text-[13.5px]"
              data-testid="team-member-role-label"
            >
              <option value="">Select project role</option>
              {projectRoles.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
            </select>

            {/* PRIMARY */}

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

              <span>Primary contact for this project</span>
            </label>

            {/* ACTIONS */}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={resetMemberDraft}
                className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333]"
              >
                Cancel
              </button>

              <button
                onClick={saveTeamMember}
                disabled={
                  addingMember ||
                  !memberDraft.user_id ||
                  !memberDraft.role_label.trim()
                }
                className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold disabled:opacity-50"
                data-testid="team-member-save"
              >
                {addingMember ? "Adding…" : "Add to Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
