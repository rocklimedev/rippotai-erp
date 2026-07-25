import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, UserPlus } from "lucide-react";
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../../api/user.api";
import { ROLE_LABEL, fmtDate } from "../../lib/settings.utils";
import InviteUserModal from "../../components/users/InviteUserModal";
import UserActionsMenu from "../../components/users/UserActionsMenu";

export default function UsersSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const {
    data: users = [],
    isFetching: loadingUsers,
    error: usersError,
  } = useGetUsersQuery({}, { skip: !isAdmin });

  const [updateUserMutation] = useUpdateUserMutation();
  const [deleteUserMutation] = useDeleteUserMutation();
  const [savingId, setSavingId] = useState(null);

  // null = closed, "new" = invite flow, a user object = edit flow
  const [modalUser, setModalUser] = useState(null);

  useEffect(() => {
    if (usersError) toast.error("Failed to load users");
  }, [usersError]);

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

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This can't be undone.`)) return;

    setSavingId(u.id);
    try {
      await deleteUserMutation(u.id).unwrap();
      toast.success(`${u.name} deleted`);
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete user");
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F1D9D3] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={22} className="text-[#7A2E1A]" />
        </div>
        <div className="text-xl font-semibold mb-2">Access denied</div>
        <p className="text-[#6B7B7C]">You need admin privileges.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#333333]">Users</h2>
          <p className="text-[#6B7B7C]">
            Assign roles, activate or deactivate team members.
          </p>
        </div>
        <button
          onClick={() => setModalUser("new")}
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
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#6B7B7C]">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#6B7B7C]">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const active = u.is_active !== false;
                const isSelf = u.id === user.id;
                return (
                  <tr
                    key={u.id}
                    className="border-t border-[#EFF2F9] hover:bg-[#FAF8F5]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F453B] text-white text-xs font-semibold flex items-center justify-center">
                          {u.avatar_initials ||
                            (u.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="font-semibold text-[#333333]">
                          {u.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#252525]">
                      {u.email}
                    </td>
                    <td className="px-5 py-3 text-sm text-[#333333]">
                      {u.role?.name || "-"}
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
                    <td className="px-5 py-3 text-right">
                      <UserActionsMenu
                        isSelf={isSelf}
                        isActive={active}
                        saving={savingId === u.id}
                        onEdit={() => setModalUser(u)}
                        onToggleActive={() => toggleActive(u)}
                        onDelete={() => deleteUser(u)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalUser && (
        <InviteUserModal
          user={modalUser === "new" ? undefined : modalUser}
          onClose={() => setModalUser(null)}
        />
      )}
    </div>
  );
}
