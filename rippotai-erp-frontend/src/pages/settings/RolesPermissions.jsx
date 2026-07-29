import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Trash2, X, Plus, Check } from "lucide-react";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetRolePermissionsQuery,
  useGrantPermissionToRoleMutation,
  useRevokeRolePermissionMutation,
  useGetRoleAppsQuery,
  useSetRoleAppsMutation,
} from "../../api/rbac.api";
import { useGetAppsQuery } from "../../api/app.api";
export default function RolesPermissions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { data: roles = [], isFetching: loadingRoles } = useGetRolesQuery(
    undefined,
    { skip: !isAdmin },
  );
  const { data: allPermissions = [], isFetching: loadingAllPermissions } =
    useGetPermissionsQuery(undefined, { skip: !isAdmin });
  const { data: allApps = [], isFetching: loadingAllApps } = useGetAppsQuery(
    undefined,
    { skip: !isAdmin },
  );

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
  const { data: roleApps = [], isFetching: loadingRoleApps } =
    useGetRoleAppsQuery(selectedRoleId, {
      skip: !isAdmin || !selectedRoleId,
    });

  const [createRole, { isLoading: creatingRole }] = useCreateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [grantPermissionToRole, { isLoading: granting }] =
    useGrantPermissionToRoleMutation();
  const [revokeRolePermission] = useRevokeRolePermissionMutation();
  const [setRoleApps, { isLoading: savingApps }] = useSetRoleAppsMutation();

  const [newRoleName, setNewRoleName] = useState("");
  const [permissionToGrant, setPermissionToGrant] = useState("");

  // Local checkbox state for the apps panel, seeded from the server and
  // re-synced whenever the selected role (or its fetched grants) change.
  const [pendingAppCodes, setPendingAppCodes] = useState(new Set());

  useEffect(() => {
    setPendingAppCodes(
      new Set(roleApps.map((ra) => ra.app_code ?? ra.app?.code)),
    );
  }, [roleApps, selectedRoleId]);

  const grantedPermissionIds = new Set(
    rolePermissions.map((rp) => rp.permission_id ?? rp.permission?.id),
  );
  const grantablePermissions = allPermissions.filter(
    (p) => !grantedPermissionIds.has(p.id),
  );

  const savedAppCodes = new Set(
    roleApps.map((ra) => ra.app_code ?? ra.app?.code),
  );
  const appsDirty =
    pendingAppCodes.size !== savedAppCodes.size ||
    [...pendingAppCodes].some((c) => !savedAppCodes.has(c));

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

  const toggleAppCode = (code) => {
    setPendingAppCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSaveApps = async () => {
    if (!selectedRoleId) return;
    try {
      await setRoleApps({
        roleId: selectedRoleId,
        app_codes: [...pendingAppCodes],
      }).unwrap();
      toast.success("App access updated");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to update app access");
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
          Define roles, control which apps each one can open, and which
          permissions it grants inside those apps.
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

        {/* Apps + Permissions for selected role */}
        <div className="space-y-6">
          {!selectedRole ? (
            <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5">
              <div className="text-sm text-[#6B7B7C] py-10 text-center">
                Select a role to manage its access.
              </div>
            </div>
          ) : (
            <>
              {/* App access */}
              <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-[#333333]">
                    {selectedRole.name} — App Access
                  </h3>
                  <button
                    onClick={handleSaveApps}
                    disabled={!appsDirty || savingApps}
                    className="h-8 px-4 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
                    style={{ backgroundColor: "#1F453B" }}
                  >
                    {savingApps ? "Saving…" : "Save"}
                  </button>
                </div>
                <p className="text-xs text-[#6B7B7C] mb-4">
                  Gates whether this role can open an app at all — checked
                  independently of the permissions below.
                </p>

                {loadingAllApps || loadingRoleApps ? (
                  <div className="text-sm text-[#6B7B7C] py-4 text-center">
                    Loading apps…
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allApps.map((app) => {
                      const checked = pendingAppCodes.has(app.code);
                      return (
                        <button
                          key={app.code}
                          type="button"
                          onClick={() => toggleAppCode(app.code)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            checked
                              ? "bg-[#1F453B] text-white border-[#1F453B]"
                              : "bg-[#FAF8F5] text-[#1F453B] border-[#DDD8CE]"
                          }`}
                        >
                          {checked && <Check size={12} />}
                          {app.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#333333]">
                    {selectedRole.name} — Permissions
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
