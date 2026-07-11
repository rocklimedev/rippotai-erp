import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, UserPlus, X } from "lucide-react";

const ROLES = [
  "admin",
  "project_manager",
  "architect",
  "estimator",
  "site_supervisor",
  "client",
];
const ROLE_LABEL = {
  admin: "Admin",
  project_manager: "Project Manager",
  architect: "Architect",
  estimator: "Estimator",
  site_supervisor: "Site Supervisor",
  client: "Client",
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

export default function RolesPermissions() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") return;
    (async () => {
      try {
        const { data } = await api.get("/users");
        setUsers(data);
      } catch (e) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div
          className="bg-white border border-[#E8EAF0] rounded-2xl px-10 py-12 max-w-md text-center"
          data-testid="access-denied"
        >
          <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={22} className="text-[#7A2E1A]" />
          </div>
          <div className="text-[18px] font-semibold text-[#333333] mb-2">
            Access denied
          </div>
          <div className="text-[13.5px] text-[#6B7B7C] mb-6">
            You need admin privileges to view Roles &amp; Permissions.
          </div>
          <button
            onClick={() => nav("/dashboard")}
            className="h-10 px-5 rounded-lg text-white text-[13px] font-semibold"
            style={{ backgroundColor: "#1F453B" }}
            data-testid="access-denied-home"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div
      className="min-h-screen bg-[#F7F7F5] px-8 py-8"
      data-testid="roles-permissions-page"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div
              className="text-[24px] font-semibold text-[#333333]"
              style={{ fontFamily: "Poppins,Arial,sans-serif" }}
            >
              Roles &amp; Permissions
            </div>
            <div className="text-[13.5px] text-[#6B7B7C] mt-1">
              Assign roles to users. Only admins can change roles.
            </div>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-white text-[13px] font-semibold"
            style={{ backgroundColor: "#1F453B" }}
            data-testid="invite-user-btn"
          >
            <UserPlus size={15} /> Invite User
          </button>
        </div>

        <div
          className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
        >
          <table className="w-full text-left" data-testid="users-table">
            <thead>
              <tr className="bg-[#F3F3F1] text-[12px] uppercase tracking-wider text-[#6B7B7C]">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-[13px] text-[#6B7B7C]"
                  >
                    Loading users…
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-[13px] text-[#6B7B7C]"
                  >
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const active = u.is_active !== false;
                return (
                  <tr
                    key={u.id}
                    className="border-t border-[#EFF2F9] hover:bg-[#FAF8F5]"
                    data-testid={`user-row-${u.email}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F453B] text-white text-[11px] font-semibold flex items-center justify-center">
                          {u.avatar_initials ||
                            (u.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-[13.5px] font-semibold text-[#333333]">
                          {u.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#252525]">
                      {u.email}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        className="h-9 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13px] text-[#333333] font-medium disabled:opacity-60"
                        value={u.role}
                        disabled={savingId === u.id || u.id === user.id}
                        onChange={(e) => onRoleChange(u, e.target.value)}
                        data-testid={`role-select-${u.email}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#6B7B7C]">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${active ? "bg-[#D3E7D3] text-[#2A6B45]" : "bg-[#EAEEF0] text-[#6B7B7C]"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#2A6B45]" : "bg-[#6B7B7C]"}`}
                        ></span>
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={savingId === u.id || u.id === user.id}
                        className="text-[12.5px] font-semibold text-[#333333] hover:underline disabled:opacity-40"
                        data-testid={`toggle-active-${u.email}`}
                      >
                        {active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onCreated={(newUser) => setUsers((prev) => [...prev, newUser])}
        />
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
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/users", form);
      onCreated(data.user);
      toast.success(
        `Invited ${data.user.name} · Temporary password: ${data.temp_password}`,
        { duration: 12000 },
      );
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to invite user");
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
        className="bg-white rounded-2xl w-[440px] p-6 relative"
        onClick={(e) => e.stopPropagation()}
        data-testid="invite-user-modal"
      >
        <button
          className="absolute top-4 right-4 text-[#6B7B7C] hover:text-[#333333]"
          onClick={onClose}
          data-testid="invite-close"
        >
          <X size={18} />
        </button>
        <div className="text-[18px] font-semibold text-[#333333] mb-1">
          Invite User
        </div>
        <div className="text-[12.5px] text-[#6B7B7C] mb-5">
          A temporary password will be shown after creation (email is mocked).
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Full name
            </label>
            <input
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="invite-name"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Email
            </label>
            <input
              type="email"
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              data-testid="invite-email"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#333333] mb-1 block">
              Role
            </label>
            <select
              className="h-10 w-full px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              data-testid="invite-role"
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
            className="h-10 mt-2 rounded-lg text-white text-[13px] font-semibold disabled:opacity-60"
            style={{ backgroundColor: "#1F453B" }}
            data-testid="invite-submit"
          >
            {saving ? "Creating…" : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
