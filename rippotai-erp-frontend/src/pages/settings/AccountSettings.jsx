import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api"; // still used for the signature endpoint (no RTK slice provided for it yet)
import {
  Camera,
  Save,
  User,
  Users as UsersIcon,
  Shield,
  Bell,
  CreditCard,
  ShieldAlert,
  Upload,
  UserPlus,
  X,
  ShieldCheck,
  Trash2,
  KeyRound,
  Activity,
  Plus,
} from "lucide-react";

// ---- RTK Query hooks ----
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useCreateUserMutation,
} from "../../api/user.api";
import { useLazyMeQuery } from "../../api/auth.api";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetRolePermissionsQuery,
  useGrantPermissionToRoleMutation,
  useRevokeRolePermissionMutation,
} from "../../api/rbac.api";
import { useGetActivityLogsQuery } from "../../api/activity-logs.api";

const sidebarItems = [
  { id: "profile", label: "Edit Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "estimate-signature", label: "Estimate Signature", icon: CreditCard },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "role-permissions", label: "Roles & Permissions", icon: Shield },
  { id: "super-admin", label: "Super Admin", icon: ShieldCheck },
];

const ROLES = [
  "admin",
  "project_manager",
  "architect",
  "estimator",
  "site_supervisor",
  "client",
  "member",
];

const ROLE_LABEL = {
  admin: "Admin",
  project_manager: "Project Manager",
  architect: "Architect",
  estimator: "Estimator",
  site_supervisor: "Site Supervisor",
  client: "Client",
  member: "Member",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export default function Settings() {
  const { user, updateUser, ready } = useAuth();
  const nav = useNavigate();

  const [activeSection, setActiveSection] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    jobTitle: user?.jobTitle || "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Estimate Signature State
  const [sigName, setSigName] = useState("");
  const [currentSig, setCurrentSig] = useState({ url: "", name: "" });
  const [sigPreview, setSigPreview] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [sigSaving, setSigSaving] = useState(false);

  // Access Guards
  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = user?.role === "ADMIN";

  // ------------------------------------------------------------------
  // USERS TAB — user list, role assignment, activate/deactivate, invite
  // ------------------------------------------------------------------
  const {
    data: users = [],
    isFetching: loadingUsers,
    error: usersError,
  } = useGetUsersQuery({}, { skip: !(activeSection === "users" && isAdmin) });

  const [updateUserMutation] = useUpdateUserMutation();
  const [savingId, setSavingId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (usersError) toast.error("Failed to load users");
  }, [usersError]);

  const onRoleChange = async (u, newRole) => {
    if (newRole === u.role) return;
    setSavingId(u.id);
    try {
      await updateUserMutation({ id: u.id, role: newRole }).unwrap();
      toast.success(`${u.name} → ${ROLE_LABEL[newRole]}`);
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (u) => {
    setSavingId(u.id);
    const next = !(u.is_active !== false);
    try {
      await updateUserMutation({ id: u.id, is_active: next }).unwrap();
      toast.success(`${u.name} ${next ? "activated" : "deactivated"}`);
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  // ------------------------------------------------------------------
  // ROLES & PERMISSIONS TAB — backed by rbacApi
  // ------------------------------------------------------------------
  const rbacSectionActive = activeSection === "role-permissions" && isAdmin;

  const { data: roles = [], isFetching: loadingRoles } = useGetRolesQuery(
    undefined,
    { skip: !rbacSectionActive },
  );
  const { data: allPermissions = [], isFetching: loadingAllPermissions } =
    useGetPermissionsQuery(undefined, { skip: !rbacSectionActive });

  const [selectedRoleId, setSelectedRoleId] = useState(null);

  useEffect(() => {
    if (rbacSectionActive && !selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [rbacSectionActive, roles, selectedRoleId]);

  const { data: rolePermissions = [], isFetching: loadingRolePermissions } =
    useGetRolePermissionsQuery(selectedRoleId, {
      skip: !rbacSectionActive || !selectedRoleId,
    });

  const [createRole, { isLoading: creatingRole }] = useCreateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [grantPermissionToRole, { isLoading: granting }] =
    useGrantPermissionToRoleMutation();
  const [revokeRolePermission] = useRevokeRolePermissionMutation();

  const [newRoleName, setNewRoleName] = useState("");
  const [permissionToGrant, setPermissionToGrant] = useState("");

  const grantedPermissionIds = new Set(
    rolePermissions.map((rp) => rp.permission_id ?? rp.permission?.id),
  );
  const grantablePermissions = allPermissions.filter(
    (p) => !grantedPermissionIds.has(p.id),
  );

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return toast.error("Role name is required");
    try {
      const data = await createRole({ name: newRoleName.trim() }).unwrap();
      toast.success(`Role "${data.name || newRoleName}" created`);
      setNewRoleName("");
      setSelectedRoleId(data.id);
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to create role");
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await deleteRole(role.id).unwrap();
      toast.success(`Role "${role.name}" deleted`);
      if (selectedRoleId === role.id) setSelectedRoleId(null);
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete role");
    }
  };

  const handleGrantPermission = async () => {
    if (!permissionToGrant || !selectedRoleId) return;
    try {
      await grantPermissionToRole({
        role_id: selectedRoleId,
        permission_id: permissionToGrant,
      }).unwrap();
      toast.success("Permission granted");
      setPermissionToGrant("");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to grant permission");
    }
  };

  const handleRevokePermission = async (permissionId) => {
    try {
      await revokeRolePermission({
        roleId: selectedRoleId,
        permissionId,
      }).unwrap();
      toast.success("Permission revoked");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to revoke permission");
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Handle profile input changes
  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      if (updateUser) {
        await updateUser(formData);
        toast.success("Profile updated successfully");
      }
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ------------------------------------------------------------------
  // Estimate Signature — /auth/me lookup via useLazyMeQuery
  // ------------------------------------------------------------------
  const [fetchMe] = useLazyMeQuery();

  useEffect(() => {
    if (activeSection === "estimate-signature" && user) {
      fetchMe()
        .unwrap()
        .then((data) => {
          setSigName(data?.estimate_signature_name || data?.name || "");
          setCurrentSig({
            url: data?.estimate_signature_url || "",
            name: data?.estimate_signature_name || "",
          });
        })
        .catch(() => {});
    }
  }, [activeSection, user, fetchMe]);

  const readFile = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () =>
        res({ mime: f.type, b64: String(r.result).split(",")[1] || "" });
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const onSigPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Max 2 MB");
    setSigFile(f);
    const rd = new FileReader();
    rd.onload = () => setSigPreview(String(rd.result));
    rd.readAsDataURL(f);
  };

  const saveSignature = async () => {
    // NOTE: no RTK slice endpoint was provided for /users/me/signature,
    // so this still goes through the plain axios `api` client.
    if (!sigFile) return toast.error("Choose a signature image");
    setSigSaving(true);
    try {
      const { b64, mime } = await readFile(sigFile);
      const { data } = await api.post("/users/me/signature", {
        name: sigName.trim() || user?.name,
        image_b64: b64,
        mime,
      });
      toast.success("Signature saved");
      setCurrentSig({ url: data.signature_url, name: data.name });
      setSigFile(null);
      setSigPreview(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSigSaving(false);
    }
  };

  // ------------------------------------------------------------------
  // SUPER ADMIN TAB — Activity Logs, backed by activityLogsApi
  // ------------------------------------------------------------------
  const [logFilters, setLogFilters] = useState({
    user_id: "",
    action: "",
    entity_type: "",
    entity_id: "",
  });

  const {
    data: activityLogs = [],
    isFetching: loadingLogs,
    refetch: refetchLogs,
  } = useGetActivityLogsQuery(logFilters, {
    skip: !(activeSection === "super-admin" && isSuperAdmin),
  });

  const onLogFilterChange = (e) => {
    setLogFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const clearLogFilters = () =>
    setLogFilters({ user_id: "", action: "", entity_type: "", entity_id: "" });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold"
          style={{ color: "var(--ink-green)" }}
        >
          Settings
        </h1>
        <p className="text-[#6B7B7C] mt-1">
          Manage your account, team, and workspace preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-[rgba(31,69,59,0.14)] rounded-3xl p-2 shadow-sm sticky top-6">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? "bg-[#1F453B] text-white"
                        : "hover:bg-[#F4F6F7] text-[#1F453B]"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          <div className="bg-white border border-[rgba(31,69,59,0.14)] rounded-3xl p-8 shadow-sm min-h-[600px]">
            {/* PROFILE */}
            {activeSection === "profile" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Profile Information
                </h2>

                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-semibold overflow-hidden border-4 border-white shadow"
                      style={{ background: "var(--ink-green)", color: "#fff" }}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.avatar_initials || user?.name?.charAt(0) || "?"
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-gray-100"
                    >
                      <Camera size={18} style={{ color: "var(--ink-green)" }} />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-[#1F453B]">
                      Profile Picture
                    </p>
                    <p className="text-sm text-[#6B7B7C]">
                      JPG, PNG or GIF • Maximum 2MB
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F453B]">
                      Full Name
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F453B]">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F453B]">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F453B]">
                      Job Title
                    </label>
                    <input
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-[rgba(31,69,59,0.2)] rounded-xl px-4 py-3 focus:border-[#1F453B] focus:ring-2 focus:ring-[rgba(31,69,59,0.18)] outline-none text-[15px]"
                    />
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="bg-[#1F453B] hover:bg-[#163229] text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70 min-w-[160px] justify-center"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                    {!isSaving && <Save size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeSection === "security" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Security Settings
                </h2>
                <p className="text-[#6B7B7C]">
                  Password and 2FA settings (coming soon)
                </p>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Notification Preferences
                </h2>
                <p className="text-[#6B7B7C]">
                  Email and in-app notifications (coming soon)
                </p>
              </div>
            )}

            {/* BILLING */}
            {activeSection === "billing" && (
              <div>
                <h2
                  className="text-xl font-semibold mb-6"
                  style={{ color: "var(--ink-green)" }}
                >
                  Billing & Subscription
                </h2>
                <p className="text-[#6B7B7C]">
                  Manage your plan and payment methods (coming soon)
                </p>
              </div>
            )}

            {/* ESTIMATE SIGNATURE */}
            {activeSection === "estimate-signature" && (
              <div className="space-y-6">
                {user?.role !== "admin" ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert size={22} className="text-[#7A2E1A]" />
                    </div>
                    <div className="text-xl font-semibold mb-2">Admin only</div>
                    <p className="text-[#6B7B7C] mb-6">
                      Signature setup is available to admins only.
                    </p>
                    <button
                      onClick={() => nav("/dashboard")}
                      className="h-10 px-5 rounded-lg text-white text-sm font-semibold"
                      style={{ backgroundColor: "#1F453B" }}
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
                        SETTINGS
                      </div>
                      <h1 className="text-4xl font-bold text-[#333333]">
                        Estimate Approval Signature
                      </h1>
                      <p className="text-[#6B7B7C] mt-1">
                        This signature appears on estimates approved by you.
                      </p>
                    </div>

                    {currentSig.url && (
                      <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5">
                        <div className="text-xs uppercase tracking-widest text-[#B5C4B6] font-semibold mb-2">
                          CURRENT
                        </div>
                        <img
                          src={currentSig.url}
                          alt="current signature"
                          className="max-h-16 border border-[#EAEEF0] rounded-md bg-[#FAF8F5] p-2"
                        />
                        <div className="text-sm font-semibold text-[#333333] mt-2">
                          {currentSig.name || "—"}
                        </div>
                      </div>
                    )}

                    <div className="bg-white border border-[#DDD8CE] rounded-2xl p-5 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-[#333333] mb-1 block">
                          Display Name
                        </label>
                        <input
                          value={sigName}
                          onChange={(e) => setSigName(e.target.value)}
                          placeholder="e.g. Deepak Rao — Principal Architect"
                          className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#333333] mb-1 block">
                          Signature Image (PNG / JPG, transparent recommended)
                        </label>
                        <label className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#1F453B] text-[#333333] text-sm font-semibold cursor-pointer">
                          <Upload size={14} /> Choose file
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={onSigPick}
                          />
                        </label>
                        {sigPreview && (
                          <div className="mt-3">
                            <img
                              src={sigPreview}
                              alt="preview"
                              className="max-h-20 border border-[#EAEEF0] rounded-md bg-[#FAF8F5] p-2"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <button
                          disabled={sigSaving || !sigFile}
                          onClick={saveSignature}
                          className="h-10 px-5 rounded-lg bg-[#1F453B] text-white text-sm font-semibold disabled:opacity-60"
                        >
                          {sigSaving ? "Saving…" : "Save Signature"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* USERS */}
            {activeSection === "users" && (
              <div>
                {!isAdmin ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert size={22} className="text-[#7A2E1A]" />
                    </div>
                    <div className="text-xl font-semibold mb-2">
                      Access denied
                    </div>
                    <p className="text-[#6B7B7C]">You need admin privileges.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-[#333333]">
                          Users
                        </h2>
                        <p className="text-[#6B7B7C]">
                          Assign roles, activate or deactivate team members.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold"
                        style={{ backgroundColor: "#1F453B" }}
                      >
                        <UserPlus size={15} /> Invite User
                      </button>
                    </div>

                    <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#F3F3F1] text-xs uppercase tracking-wider text-[#6B7B7C]">
                            <th className="px-5 py-3">Name</th>
                            <th className="px-5 py-3">Email</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Joined</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingUsers ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center py-12 text-[#6B7B7C]"
                              >
                                Loading users…
                              </td>
                            </tr>
                          ) : users.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center py-12 text-[#6B7B7C]"
                              >
                                No users found.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => {
                              const active = u.is_active !== false;
                              return (
                                <tr
                                  key={u.id}
                                  className="border-t border-[#EFF2F9] hover:bg-[#FAF8F5]"
                                >
                                  <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[#1F453B] text-white text-xs font-semibold flex items-center justify-center">
                                        {u.avatar_initials ||
                                          (u.name || "?")
                                            .slice(0, 2)
                                            .toUpperCase()}
                                      </div>
                                      <div className="font-semibold text-[#333333]">
                                        {u.name}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-sm text-[#252525]">
                                    {u.email}
                                  </td>
                                  <td className="px-5 py-3">
                                    <select
                                      value={u.role}
                                      disabled={
                                        savingId === u.id || u.id === user.id
                                      }
                                      onChange={(e) =>
                                        onRoleChange(u, e.target.value)
                                      }
                                      className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                                    >
                                      {ROLES.map((r) => (
                                        <option key={r} value={r}>
                                          {ROLE_LABEL[r]}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-5 py-3 text-sm text-[#6B7B7C]">
                                    {fmtDate(u.created_at)}
                                  </td>
                                  <td className="px-5 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${active ? "bg-[#D3E7D3] text-[#2A6B45]" : "bg-[#EAEEF0] text-[#6B7B7C]"}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#2A6B45]" : "bg-[#6B7B7C]"}`}
                                      />
                                      {active ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    <button
                                      onClick={() => toggleActive(u)}
                                      disabled={
                                        savingId === u.id || u.id === user.id
                                      }
                                      className="text-sm font-semibold text-[#333333] hover:underline disabled:opacity-40"
                                    >
                                      {active ? "Deactivate" : "Activate"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ROLES & PERMISSIONS */}
            {activeSection === "role-permissions" && (
              <div>
                {!isAdmin ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert size={22} className="text-[#7A2E1A]" />
                    </div>
                    <div className="text-xl font-semibold mb-2">
                      Access denied
                    </div>
                    <p className="text-[#6B7B7C]">You need admin privileges.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold text-[#333333]">
                        Roles & Permissions
                      </h2>
                      <p className="text-[#6B7B7C]">
                        Define roles and control which permissions each one
                        grants.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                      {/* Roles list */}
                      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-3">
                        <form
                          onSubmit={handleCreateRole}
                          className="flex gap-2 mb-3"
                        >
                          <input
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="New role name"
                            className="h-9 flex-1 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm min-w-0"
                          />
                          <button
                            type="submit"
                            disabled={creatingRole}
                            className="h-9 w-9 shrink-0 rounded-lg text-white flex items-center justify-center disabled:opacity-60"
                            style={{ backgroundColor: "#1F453B" }}
                            title="Create role"
                          >
                            <Plus size={16} />
                          </button>
                        </form>

                        {loadingRoles ? (
                          <div className="text-sm text-[#6B7B7C] py-6 text-center">
                            Loading roles…
                          </div>
                        ) : roles.length === 0 ? (
                          <div className="text-sm text-[#6B7B7C] py-6 text-center">
                            No roles yet.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {roles.map((r) => (
                              <div
                                key={r.id}
                                className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer ${
                                  selectedRoleId === r.id
                                    ? "bg-[#1F453B] text-white"
                                    : "hover:bg-[#F4F6F7] text-[#1F453B]"
                                }`}
                                onClick={() => setSelectedRoleId(r.id)}
                              >
                                <span className="text-sm font-medium truncate">
                                  {r.name}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRole(r);
                                  }}
                                  className={`p-1 rounded hover:bg-black/10 ${
                                    selectedRoleId === r.id
                                      ? "text-white"
                                      : "text-[#B04D26]"
                                  }`}
                                  title="Delete role"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Permissions for selected role */}
                      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5">
                        {!selectedRole ? (
                          <div className="text-sm text-[#6B7B7C] py-10 text-center">
                            Select a role to manage its permissions.
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-[#333333]">
                                {selectedRole.name}
                              </h3>
                            </div>

                            <div className="flex gap-2 mb-4">
                              <select
                                value={permissionToGrant}
                                onChange={(e) =>
                                  setPermissionToGrant(e.target.value)
                                }
                                className="h-9 flex-1 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                              >
                                <option value="">
                                  {loadingAllPermissions
                                    ? "Loading permissions…"
                                    : "Select permission to grant…"}
                                </option>
                                {grantablePermissions.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name ||
                                      `${p.resource}:${p.action}` ||
                                      p.id}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={handleGrantPermission}
                                disabled={!permissionToGrant || granting}
                                className="h-9 px-4 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                                style={{ backgroundColor: "#1F453B" }}
                              >
                                Grant
                              </button>
                            </div>

                            {loadingRolePermissions ? (
                              <div className="text-sm text-[#6B7B7C] py-6 text-center">
                                Loading permissions…
                              </div>
                            ) : rolePermissions.length === 0 ? (
                              <div className="text-sm text-[#6B7B7C] py-6 text-center">
                                No permissions granted to this role yet.
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {rolePermissions.map((rp) => {
                                  const permId =
                                    rp.permission_id ?? rp.permission?.id;
                                  const permLabel =
                                    rp.permission?.name ||
                                    allPermissions.find((p) => p.id === permId)
                                      ?.name ||
                                    permId;
                                  return (
                                    <span
                                      key={permId}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EAF0EC] text-[#1F453B]"
                                    >
                                      {permLabel}
                                      <button
                                        onClick={() =>
                                          handleRevokePermission(permId)
                                        }
                                        className="hover:text-[#B04D26]"
                                        title="Revoke"
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* SUPER ADMIN — Activity Logs */}
            {activeSection === "super-admin" && (
              <div>
                {!isSuperAdmin ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ShieldCheck size={28} className="text-[#1F453B] mb-4" />
                    <div className="text-xl font-semibold mb-2">
                      Super Admin Access Required
                    </div>
                    <p className="text-[#6B7B7C]">
                      This console is restricted to super administrators.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <Activity size={22} style={{ color: "#1F453B" }} />
                      <div>
                        <h1
                          className="text-2xl font-bold"
                          style={{ color: "#333333" }}
                        >
                          Activity Logs
                        </h1>
                        <p className="text-sm text-[#6B7B7C]">
                          Audit trail of actions taken across the workspace.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 mb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          name="user_id"
                          value={logFilters.user_id}
                          onChange={onLogFilterChange}
                          placeholder="User ID"
                          className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                        />
                        <input
                          name="action"
                          value={logFilters.action}
                          onChange={onLogFilterChange}
                          placeholder="Action (e.g. update)"
                          className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                        />
                        <input
                          name="entity_type"
                          value={logFilters.entity_type}
                          onChange={onLogFilterChange}
                          placeholder="Entity type"
                          className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                        />
                        <input
                          name="entity_id"
                          value={logFilters.entity_id}
                          onChange={onLogFilterChange}
                          placeholder="Entity ID"
                          className="h-9 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={clearLogFilters}
                          className="h-9 px-4 rounded-lg border border-[#DDD8CE] text-sm font-semibold text-[#333333] hover:bg-[#F7F7F5]"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => refetchLogs()}
                          className="h-9 px-4 rounded-lg text-white text-sm font-semibold"
                          style={{ backgroundColor: "#1F453B" }}
                        >
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F7F7F5] text-xs uppercase tracking-widest text-[#6B7B7C]">
                          <tr>
                            <th className="text-left px-4 py-3">When</th>
                            <th className="text-left px-4 py-3">User</th>
                            <th className="text-left px-4 py-3">Action</th>
                            <th className="text-left px-4 py-3">Entity</th>
                            <th className="text-left px-4 py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingLogs ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-12 text-center text-[#6B7B7C]"
                              >
                                Loading…
                              </td>
                            </tr>
                          ) : activityLogs.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-12 text-center text-[#6B7B7C]"
                              >
                                No activity found.
                              </td>
                            </tr>
                          ) : (
                            activityLogs.map((log) => (
                              <tr
                                key={log.id}
                                className="border-t border-[#E8EAF0] align-top"
                              >
                                <td className="px-4 py-3 text-xs text-[#6B7B7C] whitespace-nowrap">
                                  {fmtDateTime(log.created_at)}
                                </td>
                                <td className="px-4 py-3 text-[#333333]">
                                  {log.user_name || log.user_id || "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#EAF0EC] text-[#1F453B]">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[#333333]">
                                  {log.entity_type}
                                  {log.entity_id ? ` #${log.entity_id}` : ""}
                                </td>
                                <td className="px-4 py-3 text-[#6B7B7C] max-w-[280px] truncate">
                                  {typeof log.details === "string"
                                    ? log.details
                                    : log.details
                                      ? JSON.stringify(log.details)
                                      : "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}

function InviteUserModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "project_manager",
  });

  // Uses usersApi's createUser mutation — invalidates the "Users" tag,
  // so the Users table refetches automatically.
  const [createUser, { isLoading: saving }] = useCreateUserMutation();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email required");
      return;
    }
    try {
      const data = await createUser(form).unwrap();
      toast.success(
        `Invited ${data.user.name} · Temp password: ${data.temp_password}`,
        { duration: 12000 },
      );
      onClose();
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to invite");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[440px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-[#6B7B7C] hover:text-black"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="text-xl font-semibold mb-1">Invite User</div>
        <div className="text-xs text-[#6B7B7C] mb-5">
          Temporary password will be shown (email mocked).
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block">
              Full Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full h-10 mt-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: "#1F453B" }}
          >
            {saving ? "Creating…" : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
