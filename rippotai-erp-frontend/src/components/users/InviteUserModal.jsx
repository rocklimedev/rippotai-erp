import React, { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useCreateUserMutation } from "../../api/user.api";
import { ROLES, ROLE_LABEL } from "../../lib/settings.utils";

export default function InviteUserModal({ onClose }) {
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
