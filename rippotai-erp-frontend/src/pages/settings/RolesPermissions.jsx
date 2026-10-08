import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Check,
  KeyRound,
  LayoutGrid,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
} from "../../api/users/rbac.api";
import { useGetAppsQuery } from "../../api/meta/app.api";
import {
  Page,
  PageHeader,
  Card,
  Button,
  EmptyState,
  Field,
  TextInput,
  Pill,
} from "@/components/inos";
import {
  AdminAccessDenied,
  AdminModal,
  ModalActions,
  adminCrumbs,
  humanize,
  plural,
} from "./_admin-ui";

export default function RolesPermissions() {
  const { user } = useAuth();
  const isAdmin = ["ADMIN", "SUPERADMIN"].includes(user?.role);

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
  const [revokeRolePermission, { isLoading: revoking }] =
    useRevokeRolePermissionMutation();
  const [setRoleApps, { isLoading: savingApps }] = useSetRoleAppsMutation();

  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newRoleError, setNewRoleError] = useState("");
  const [busyPermId, setBusyPermId] = useState(null);

  // Local toggle state for the apps panel, seeded from the server and
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

  const savedAppCodes = new Set(
    roleApps.map((ra) => ra.app_code ?? ra.app?.code),
  );
  const appsDirty =
    pendingAppCodes.size !== savedAppCodes.size ||
    [...pendingAppCodes].some((c) => !savedAppCodes.has(c));

  // Group permissions by resource ("gates:read" -> gates / read)
  const permissionGroups = useMemo(() => {
    const groups = {};
    (Array.isArray(allPermissions) ? allPermissions : []).forEach((p) => {
      const [res, act] = String(p.name || `${p.resource}:${p.action}`).split(
        ":",
      );
      const key = p.resource || res || "other";
      (groups[key] ||= []).push({ ...p, _action: p.action || act || p.name });
    });
    // Also surface granted permissions the catalogue didn't return
    rolePermissions.forEach((rp) => {
      const id = rp.permission_id ?? rp.permission?.id;
      if ((allPermissions || []).some((p) => p.id === id)) return;
      const name = rp.permission?.name || String(id);
      const [res, act] = name.split(":");
      (groups[res || "other"] ||= []).push({ id, name, _action: act || name });
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allPermissions, rolePermissions]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setNewRoleError("Give the role a name.");
      return;
    }
    try {
      const data = await createRole({ name: newRoleName.trim() }).unwrap();
      toast.success(`Role "${data.name || newRoleName}" created`);
      setNewRoleName("");
      setNewRoleOpen(false);
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

  const handleGrantPermission = async (permissionId) => {
    if (!permissionId || !selectedRoleId) return;
    setBusyPermId(permissionId);
    try {
      await grantPermissionToRole({
        role_id: selectedRoleId,
        permission_id: permissionId,
      }).unwrap();
      toast.success("Permission granted");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to grant permission");
    } finally {
      setBusyPermId(null);
    }
  };

  const handleRevokePermission = async (permissionId) => {
    setBusyPermId(permissionId);
    try {
      await revokeRolePermission({
        roleId: selectedRoleId,
        permissionId,
      }).unwrap();
      toast.success("Permission revoked");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to revoke permission");
    } finally {
      setBusyPermId(null);
    }
  };

  const togglePermission = (permissionId) =>
    grantedPermissionIds.has(permissionId)
      ? handleRevokePermission(permissionId)
      : handleGrantPermission(permissionId);

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
    return <AdminAccessDenied crumb="Roles & permissions" />;
  }

  const appList = Array.isArray(allApps) ? allApps : [];
  const permBusy = granting || revoking;

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Roles & permissions")}
        title="Roles & permissions"
        subtitle="Choose which apps each role can open, then fine-tune what it's allowed to do inside them."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setNewRoleOpen(true)}
            data-testid="new-role-btn"
          >
            New role
          </Button>
        }
      />

      <div className="adm-split">
        {/* Roles list */}
        <Card
          title="Roles"
          subtitle={roles.length ? plural(roles.length, "role") : undefined}
          flush
          className="adm-sticky"
        >
          {loadingRoles && roles.length === 0 ? (
            <div className="adm-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="adm-list__item">
                  <div className="adm-skel" style={{ width: "70%" }} />
                </div>
              ))}
            </div>
          ) : roles.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No roles yet"
              text="Create a role to start granting access."
            />
          ) : (
            <div className="adm-list" role="listbox" aria-label="Roles">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="option"
                  aria-selected={selectedRoleId === r.id}
                  aria-current={selectedRoleId === r.id}
                  className="adm-list__item"
                  onClick={() => setSelectedRoleId(r.id)}
                >
                  <span className="inos-icon-tile inos-icon-tile--sm">
                    <ShieldCheck aria-hidden />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      className="adm-list__name"
                      style={{ display: "block" }}
                    >
                      {humanize(r.name)}
                    </span>
                    <span
                      className="adm-list__sub"
                      style={{ display: "block" }}
                    >
                      {r.description || "Custom role"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Apps + Permissions for selected role */}
        {!selectedRole ? (
          <Card>
            <EmptyState
              icon={ShieldCheck}
              title="Select a role"
              text="Pick a role on the left to manage its app access and permissions."
            />
          </Card>
        ) : (
          <section className="inos-card">
            <div className="inos-card__header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 0,
                }}
              >
                <span className="inos-icon-tile">
                  <ShieldCheck aria-hidden />
                </span>
                <div style={{ minWidth: 0 }}>
                  <h2 className="inos-section-title">
                    {humanize(selectedRole.name)}
                  </h2>
                  <p className="inos-section-sub">
                    {selectedRole.description ||
                      "No description added for this role."}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => handleDeleteRole(selectedRole)}
              >
                Delete role
              </Button>
            </div>

            {/* App access */}
            <div className="adm-section">
              <div className="adm-section__head">
                <div>
                  <h3
                    className="adm-section__title"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <LayoutGrid size={16} aria-hidden /> App access
                  </h3>
                  <p className="adm-section__desc">
                    Tap an app to switch it on or off. This decides whether the
                    role can open the app at all.
                  </p>
                </div>
                <Pill tone="brand" dot={false}>
                  {pendingAppCodes.size} of {appList.length} apps
                </Pill>
              </div>

              {loadingAllApps || loadingRoleApps ? (
                <div className="adm-chips">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="adm-skel"
                      style={{ width: 110, height: 34, borderRadius: 999 }}
                    />
                  ))}
                </div>
              ) : appList.length === 0 ? (
                <p className="adm-section__desc">No apps are registered yet.</p>
              ) : (
                <div className="adm-chips">
                  {appList.map((app) => {
                    const checked = pendingAppCodes.has(app.code);
                    return (
                      <button
                        key={app.code}
                        type="button"
                        className="adm-chip"
                        aria-pressed={checked}
                        onClick={() => toggleAppCode(app.code)}
                      >
                        <span className="adm-chip__mark">
                          <Check aria-hidden strokeWidth={3} />
                        </span>
                        {app.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {appsDirty && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => setPendingAppCodes(new Set(savedAppCodes))}
                    disabled={savingApps}
                  >
                    Undo changes
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveApps}
                    disabled={!appsDirty || savingApps}
                  >
                    {savingApps ? "Saving…" : "Save app access"}
                  </Button>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="adm-section">
              <div className="adm-section__head">
                <div>
                  <h3
                    className="adm-section__title"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <KeyRound size={16} aria-hidden /> Permissions
                  </h3>
                  <p className="adm-section__desc">
                    Actions this role may take inside its apps. Changes save
                    instantly.
                  </p>
                </div>
                <Pill
                  tone={grantedPermissionIds.size ? "ok" : "mute"}
                  dot={false}
                >
                  {plural(grantedPermissionIds.size, "permission")} granted
                </Pill>
              </div>

              {loadingAllPermissions ||
              (loadingRolePermissions && rolePermissions.length === 0) ? (
                <div className="adm-chips">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="adm-skel"
                      style={{ width: 96, height: 34, borderRadius: 999 }}
                    />
                  ))}
                </div>
              ) : permissionGroups.length === 0 ? (
                <EmptyState
                  icon={KeyRound}
                  title="No permissions defined"
                  text="Permissions appear here once they're registered by the platform."
                />
              ) : (
                <div>
                  {permissionGroups.map(([resource, perms]) => (
                    <div key={resource} className="adm-perm-group">
                      <div className="adm-perm-group__name">
                        {humanize(resource)}
                      </div>
                      <div className="adm-chips">
                        {perms.map((p) => {
                          const on = grantedPermissionIds.has(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              className="adm-chip"
                              aria-pressed={on}
                              title={p.description || p.name}
                              disabled={permBusy && busyPermId === p.id}
                              onClick={() => togglePermission(p.id)}
                            >
                              <span className="adm-chip__mark">
                                <Check aria-hidden strokeWidth={3} />
                              </span>
                              {humanize(p._action)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <AdminModal
        open={newRoleOpen}
        as="form"
        onSubmit={handleCreateRole}
        onClose={() => {
          setNewRoleOpen(false);
          setNewRoleError("");
        }}
        busy={creatingRole}
        icon={ShieldCheck}
        title="New role"
        subtitle="Create the role first — you'll choose its apps and permissions next."
        width={460}
        footer={
          <ModalActions
            onCancel={() => setNewRoleOpen(false)}
            submitting={creatingRole}
            submittingLabel="Creating…"
            submitLabel="Create role"
          />
        }
      >
        <Field
          label="Role name"
          required
          htmlFor="nr-name"
          error={newRoleError}
          hint="Short and descriptive, e.g. the job people in it do."
        >
          <TextInput
            id="nr-name"
            autoFocus
            value={newRoleName}
            invalid={!!newRoleError}
            placeholder="e.g. Site engineer"
            onChange={(e) => {
              setNewRoleName(e.target.value);
              setNewRoleError("");
            }}
          />
        </Field>
      </AdminModal>
    </Page>
  );
}
