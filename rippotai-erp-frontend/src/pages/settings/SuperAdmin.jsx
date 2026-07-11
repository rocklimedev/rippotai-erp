import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ShieldCheck, Trash2, KeyRound, Save, X } from "lucide-react";

const GREEN = "#1F453B";
const TEXT = "#333333";
const MUTED = "#6B7B7C";
const ALLOWED_ROLES = [
  "admin",
  "project_manager",
  "architect",
  "estimator",
  "site_supervisor",
  "client",
  "member",
];
const ALLOWED_PLANS = [
  "free_trial",
  "studio",
  "firm",
  "enterprise",
  "super_admin",
];

export default function SuperAdminPage() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!user?.is_super_admin) {
      nav("/dashboard", { replace: true });
      return;
    }
    load();
  }, [ready, user, nav]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/super-admin/users");
      setRows(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const patch = async (id, updates) => {
    try {
      const { data } = await api.patch(`/super-admin/users/${id}`, updates);
      setRows((rs) => rs.map((r) => (r.id === id ? data : r)));
      toast.success("Updated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update");
    }
  };

  const softDelete = async (row) => {
    if (!window.confirm(`Soft-delete ${row.email}?`)) return;
    try {
      await api.delete(`/super-admin/users/${row.id}`);
      toast.success("User deactivated");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to delete");
    }
  };

  const resetPassword = async (row) => {
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

  if (!ready || !user?.is_super_admin) return null;

  return (
    <div className="max-w-[1400px] mx-auto p-8" data-testid="super-admin-page">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={22} style={{ color: GREEN }} />
        <div>
          <h1
            className="text-[24px] font-bold"
            style={{ color: TEXT, fontFamily: "Poppins" }}
          >
            Super Admin Console
          </h1>
          <div className="text-[13px]" style={{ color: MUTED }}>
            Manage users, roles, plans and access across the INOS workspace.
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
        <table className="w-full text-[13px]" data-testid="sa-users-table">
          <thead
            className="bg-[#F7F7F5] text-[11px] uppercase tracking-widest"
            style={{ color: MUTED }}
          >
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-center px-4 py-3">Super Admin</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-8"
                  style={{ color: MUTED }}
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-8"
                  style={{ color: MUTED }}
                >
                  No users.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#E8EAF0]"
                  data-testid={`sa-row-${r.id}`}
                >
                  <td
                    className="px-4 py-3 font-semibold"
                    style={{ color: TEXT }}
                  >
                    {r.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>
                    {r.email}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.role || "member"}
                      onChange={(e) => patch(r.id, { role: e.target.value })}
                      className="h-8 px-2 rounded border border-[#DDD8CE] bg-[#FAF8F5] text-[12.5px]"
                      data-testid={`sa-role-${r.id}`}
                    >
                      {ALLOWED_ROLES.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.plan || "free_trial"}
                      onChange={(e) => patch(r.id, { plan: e.target.value })}
                      className="h-8 px-2 rounded border border-[#DDD8CE] bg-[#FAF8F5] text-[12.5px]"
                      data-testid={`sa-plan-${r.id}`}
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
                        patch(r.id, { is_super_admin: e.target.checked })
                      }
                      data-testid={`sa-super-${r.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.is_active === false ? (
                      <span
                        className="px-2 py-1 rounded-full text-[10.5px] font-semibold"
                        style={{ background: "#F4E1D6", color: "#B04D26" }}
                      >
                        Inactive
                      </span>
                    ) : (
                      <span
                        className="px-2 py-1 rounded-full text-[10.5px] font-semibold"
                        style={{ background: "#EAF0EC", color: GREEN }}
                      >
                        Active
                      </span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px]"
                    style={{ color: MUTED }}
                  >
                    {(r.created_at || "").slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => setEditing(r)}
                        className="h-8 px-2.5 rounded border border-[#DDD8CE] text-[11.5px] font-semibold hover:bg-[#F7F7F5]"
                        style={{ color: TEXT }}
                        data-testid={`sa-edit-${r.id}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => resetPassword(r)}
                        className="h-8 px-2 rounded border border-[#DDD8CE] hover:bg-[#F7F7F5]"
                        title="Reset password"
                        data-testid={`sa-reset-${r.id}`}
                      >
                        <KeyRound size={13} style={{ color: TEXT }} />
                      </button>
                      <button
                        onClick={() => softDelete(r)}
                        className="h-8 px-2 rounded border border-[#F4E1D6] hover:bg-[#F4E1D6]"
                        title="Deactivate"
                        data-testid={`sa-delete-${r.id}`}
                      >
                        <Trash2 size={13} style={{ color: "#B04D26" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/40"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E8EAF0] max-w-[420px] w-full p-6"
            onClick={(e) => e.stopPropagation()}
            data-testid="sa-edit-modal"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[17px] font-bold"
                style={{ color: TEXT, fontFamily: "Poppins" }}
              >
                Edit user
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="p-1 rounded hover:bg-[#F7F7F5]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-3">
              <div>
                <label
                  className="text-[12.5px] font-semibold mb-1 block"
                  style={{ color: TEXT }}
                >
                  Name
                </label>
                <input
                  value={editing.name || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-[13.5px]"
                  data-testid="sa-edit-name"
                />
              </div>
              <div>
                <label
                  className="text-[12.5px] font-semibold mb-1 block"
                  style={{ color: TEXT }}
                >
                  Email
                </label>
                <input
                  value={editing.email || ""}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-[#DDD8CE] bg-[#EAEEF0] text-[13.5px]"
                />
              </div>
              <button
                onClick={async () => {
                  await patch(editing.id, { name: editing.name });
                  setEditing(null);
                }}
                className="mt-2 h-11 rounded-lg text-white text-[13.5px] font-semibold flex items-center justify-center gap-2"
                style={{ background: GREEN }}
                data-testid="sa-edit-save"
              >
                <Save size={14} /> Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
