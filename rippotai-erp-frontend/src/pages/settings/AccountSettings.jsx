import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  Camera,
  Save,
  User,
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
} from "lucide-react";

const sidebarItems = [
  { id: "profile", label: "Edit Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "estimate-signature", label: "Estimate Signature", icon: CreditCard },
  { id: "role-permissions", label: "Role & Permissions", icon: CreditCard },
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

const ALLOWED_PLANS = [
  "free_trial",
  "studio",
  "firm",
  "enterprise",
  "super_admin",
];

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

  // Roles & Permissions State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [savingId, setSavingId] = useState(null);

  // Super Admin State
  const [superUsers, setSuperUsers] = useState([]);
  const [loadingSuper, setLoadingSuper] = useState(true);
  const [editingSuper, setEditingSuper] = useState(null);

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

  // Estimate Signature Logic
  useEffect(() => {
    if (activeSection === "estimate-signature" && user) {
      api
        .get("/auth/me")
        .then((r) => {
          setSigName(r.data?.estimate_signature_name || r.data?.name || "");
          setCurrentSig({
            url: r.data?.estimate_signature_url || "",
            name: r.data?.estimate_signature_name || "",
          });
        })
        .catch(() => {});
    }
  }, [activeSection, user]);

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

  // Roles & Permissions Logic
  useEffect(() => {
    if (activeSection === "role-permissions" && user?.role === "admin") {
      setLoadingUsers(true);
      api
        .get("/users")
        .then((res) => setUsers(res.data))
        .catch(() => toast.error("Failed to load users"))
        .finally(() => setLoadingUsers(false));
    }
  }, [activeSection, user]);

  const onRoleChange = async (u, newRole) => {
    if (newRole === u.role) return;
    setSavingId(u.id);
    try {
      const { data } = await api.patch(`/users/${u.id}`, { role: newRole });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, ...data } : x)),
      );
      toast.success(`${u.name} → ${ROLE_LABEL[newRole]}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (u) => {
    setSavingId(u.id);
    const next = !(u.is_active !== false);
    try {
      const { data } = await api.patch(`/users/${u.id}`, { is_active: next });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, ...data } : x)),
      );
      toast.success(`${u.name} ${next ? "activated" : "deactivated"}`);
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  // Super Admin Logic
  useEffect(() => {
    if (activeSection === "super-admin" && user?.is_super_admin) {
      setLoadingSuper(true);
      api
        .get("/super-admin/users")
        .then((res) => setSuperUsers(res.data))
        .catch((e) =>
          toast.error(e?.response?.data?.detail || "Failed to load"),
        )
        .finally(() => setLoadingSuper(false));
    }
  }, [activeSection, user]);

  const patchSuperUser = async (id, updates) => {
    try {
      const { data } = await api.patch(`/super-admin/users/${id}`, updates);
      setSuperUsers((rs) => rs.map((r) => (r.id === id ? data : r)));
      toast.success("Updated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update");
    }
  };

  const softDeleteSuper = async (row) => {
    if (!window.confirm(`Soft-delete ${row.email}?`)) return;
    try {
      await api.delete(`/super-admin/users/${row.id}`);
      toast.success("User deactivated");
      // Reload
      const { data } = await api.get("/super-admin/users");
      setSuperUsers(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to delete");
    }
  };

  const resetPasswordSuper = async (row) => {
    try {
      const { data } = await api.post(
        `/super-admin/users/${row.id}/reset-password`,
      );
      toast.success(
        `Temp password for ${row.email}: ${data.temp_password} (email MOCKED)`,
        { duration: 10000 },
      );
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to reset");
    }
  };

  // Access Guards
  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = user?.role === "ADMIN";

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

            {/* ROLE & PERMISSIONS */}
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
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-[#333333]">
                          Roles & Permissions
                        </h2>
                        <p className="text-[#6B7B7C]">
                          Assign roles to users. Only admins can change roles.
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

            {/* SUPER ADMIN */}
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
                      <ShieldCheck size={22} style={{ color: "#1F453B" }} />
                      <div>
                        <h1
                          className="text-2xl font-bold"
                          style={{ color: "#333333" }}
                        >
                          Super Admin Console
                        </h1>
                        <p className="text-sm text-[#6B7B7C]">
                          Manage users, roles, plans and access.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F7F7F5] text-xs uppercase tracking-widest text-[#6B7B7C]">
                          <tr>
                            <th className="text-left px-4 py-3">Name</th>
                            <th className="text-left px-4 py-3">Email</th>
                            <th className="text-left px-4 py-3">Role</th>
                            <th className="text-left px-4 py-3">Plan</th>
                            <th className="text-center px-4 py-3">
                              Super Admin
                            </th>
                            <th className="text-center px-4 py-3">Status</th>
                            <th className="text-left px-4 py-3">Created</th>
                            <th className="text-right px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingSuper ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="py-12 text-center text-[#6B7B7C]"
                              >
                                Loading…
                              </td>
                            </tr>
                          ) : superUsers.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="py-12 text-center text-[#6B7B7C]"
                              >
                                No users.
                              </td>
                            </tr>
                          ) : (
                            superUsers.map((r) => (
                              <tr
                                key={r.id}
                                className="border-t border-[#E8EAF0]"
                              >
                                <td className="px-4 py-3 font-semibold text-[#333333]">
                                  {r.name}
                                </td>
                                <td className="px-4 py-3 text-[#6B7B7C]">
                                  {r.email}
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={r.role || "member"}
                                    onChange={(e) =>
                                      patchSuperUser(r.id, {
                                        role: e.target.value,
                                      })
                                    }
                                    className="h-8 px-2 rounded border border-[#DDD8CE] bg-[#FAF8F5] text-xs"
                                  >
                                    {ROLES.map((x) => (
                                      <option key={x} value={x}>
                                        {x}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={r.plan || "free_trial"}
                                    onChange={(e) =>
                                      patchSuperUser(r.id, {
                                        plan: e.target.value,
                                      })
                                    }
                                    className="h-8 px-2 rounded border border-[#DDD8CE] bg-[#FAF8F5] text-xs"
                                  >
                                    {ALLOWED_PLANS.map((x) => (
                                      <option key={x} value={x}>
                                        {x}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!r.is_super_admin}
                                    onChange={(e) =>
                                      patchSuperUser(r.id, {
                                        is_super_admin: e.target.checked,
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {r.is_active === false ? (
                                    <span
                                      className="px-2 py-1 rounded-full text-xs font-semibold"
                                      style={{
                                        background: "#F4E1D6",
                                        color: "#B04D26",
                                      }}
                                    >
                                      Inactive
                                    </span>
                                  ) : (
                                    <span
                                      className="px-2 py-1 rounded-full text-xs font-semibold"
                                      style={{
                                        background: "#EAF0EC",
                                        color: "#1F453B",
                                      }}
                                    >
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-[#6B7B7C]">
                                  {(r.created_at || "").slice(0, 10)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="inline-flex gap-1">
                                    <button
                                      onClick={() => setEditingSuper(r)}
                                      className="h-8 px-2.5 rounded border border-[#DDD8CE] text-xs font-semibold hover:bg-[#F7F7F5]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => resetPasswordSuper(r)}
                                      className="h-8 px-2 rounded border border-[#DDD8CE] hover:bg-[#F7F7F5]"
                                      title="Reset password"
                                    >
                                      <KeyRound size={13} />
                                    </button>
                                    <button
                                      onClick={() => softDeleteSuper(r)}
                                      className="h-8 px-2 rounded border border-[#F4E1D6] hover:bg-[#F4E1D6]"
                                      title="Deactivate"
                                    >
                                      <Trash2
                                        size={13}
                                        className="text-[#B04D26]"
                                      />
                                    </button>
                                  </div>
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
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onCreated={(newUser) => setUsers((prev) => [...prev, newUser])}
        />
      )}

      {/* Super Admin Edit Modal */}
      {editingSuper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setEditingSuper(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E8EAF0] max-w-[420px] w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#333333]">Edit User</h3>
              <button onClick={() => setEditingSuper(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block text-[#333333]">
                  Name
                </label>
                <input
                  value={editingSuper.name || ""}
                  onChange={(e) =>
                    setEditingSuper({ ...editingSuper, name: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block text-[#333333]">
                  Email
                </label>
                <input
                  value={editingSuper.email}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#EAEEF0]"
                />
              </div>
              <button
                onClick={async () => {
                  await patchSuperUser(editingSuper.id, {
                    name: editingSuper.name,
                  });
                  setEditingSuper(null);
                }}
                className="w-full h-11 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
                style={{ background: "#1F453B" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InviteUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "project_manager",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email required");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/users", form);
      onCreated(data.user);
      toast.success(
        `Invited ${data.user.name} · Temp password: ${data.temp_password}`,
        { duration: 12000 },
      );
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to invite");
    } finally {
      setSaving(false);
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
