import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Trash2, X, Plus } from "lucide-react";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetRolePermissionsQuery,
  useGrantPermissionToRoleMutation,
  useRevokeRolePermissionMutation,
} from "../../api/rbac.api";

export default function RolesPermissions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { data: roles = [], isFetching: loadingRoles } = useGetRolesQuery(
    undefined,
    { skip: !isAdmin },
  );
  const { data: allPermissions = [], isFetching: loadingAllPermissions } =
    useGetPermissionsQuery(undefined, { skip: !isAdmin });

  const [selectedRoleId, setSelectedRoleId] = useState(null);

  useEffect(() => {
    if (isAdmin && !selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [isAdmin, roles, selectedRoleId]);

  const { data: rolePermissions = [], isFetching: loadingRolePermissions } =
    useGetRolePermissionsQuery(selectedRoleId, {
      skip: !isAdmin || !selectedRoleId,
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
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#333333]">
          Roles & Permissions
        </h2>
        <p className="text-[#6B7B7C]">
          Define roles and control which permissions each one grants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Roles list */}
        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-3">
          <form onSubmit={handleCreateRole} className="flex gap-2 mb-3">
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
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRole(r);
                    }}
                    className={`p-1 rounded hover:bg-black/10 ${
                      selectedRoleId === r.id ? "text-white" : "text-[#B04D26]"
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
                  onChange={(e) => setPermissionToGrant(e.target.value)}
                  className="h-9 flex-1 px-2 rounded-lg border border-[#DDD8CE] bg-[#FAF8F5] text-sm"
                >
                  <option value="">
                    {loadingAllPermissions
                      ? "Loading permissions…"
                      : "Select permission to grant…"}
                  </option>
                  {grantablePermissions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || `${p.resource}:${p.action}` || p.id}
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
                    const permId = rp.permission_id ?? rp.permission?.id;
                    const permLabel =
                      rp.permission?.name ||
                      allPermissions.find((p) => p.id === permId)?.name ||
                      permId;
                    return (
                      <span
                        key={permId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EAF0EC] text-[#1F453B]"
                      >
                        {permLabel}
                        <button
                          onClick={() => handleRevokePermission(permId)}
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
    </div>
  );
}
