// Roles & permissions: one role at a time, apps as collapsible rows, each
// with a named access level; expand an app to set each document / part.
import { appConfirm } from "@/lib/app-dialog";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetRoleAccessCatalogueQuery,
  useGetRoleAccessQuery,
  useSetRoleAccessMutation,
} from "../../api/users/rbac.api";
import { Page, PageHeader, Card, Button, EmptyState, Field, TextInput, Pill } from "@/components/inos";
import { ACCESS_LEVELS, hasPermission } from "@/lib/permissions";
import { AdminAccessDenied, AdminModal, ModalActions, adminCrumbs, humanize, plural } from "./_admin-ui";

const LEVEL_TONE = { none: "mute", view: "info", edit: "lilac", create: "brand", full: "ok", mixed: "warn" };
const LEVEL_LABEL = Object.fromEntries(ACCESS_LEVELS.map((l) => [l.key, l.label]));

function LevelSelect({ value, onChange, available, disabled, label, testId }) {
  const options = ACCESS_LEVELS.filter((l) => !available || available.includes(l.key));
  return (
    <select
      className="inos-select rp-level"
      aria-label={label}
      data-testid={testId}
      data-level={value}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {value === "mixed" && (
        <option value="mixed" disabled>
          Custom mix
        </option>
      )}
      {options.map((l) => (
        <option key={l.key} value={l.key}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

function Legend() {
  return (
    <div className="rp-legend" aria-label="Access levels">
      {ACCESS_LEVELS.filter((l) => l.key !== "none").map((l, i) => (
        <div key={l.key} className="rp-legend__item">
          <Pill tone={LEVEL_TONE[l.key]} size="sm">
            {i + 1}. {l.label}
          </Pill>
          <span>{l.description}</span>
        </div>
      ))}
    </div>
  );
}

export default function RolesPermissions() {
  const { user } = useAuth();
  const canRead = hasPermission(user, "role-permissions", "read");
  const canAssign = hasPermission(user, "role-permissions", "assign");

  const { data: roles = [], isFetching: loadingRoles } = useGetRolesQuery(undefined, { skip: !canRead });
  const { data: catalogue } = useGetRoleAccessCatalogueQuery(undefined, { skip: !canRead });
  const [pickedRoleId, setSelectedRoleId] = useState(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [open, setOpen] = useState({});
  const [busyKey, setBusyKey] = useState(null);

  const selectedRoleId = roles.some((r) => r.id === pickedRoleId) ? pickedRoleId : roles[0]?.id ?? null;

  const { data: access, isFetching: loadingAccess } = useGetRoleAccessQuery(selectedRoleId, {
    skip: !canRead || !selectedRoleId,
  });
  const [setRoleAccess] = useSetRoleAccessMutation();
  const [createRole, { isLoading: creatingRole }] = useCreateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newRoleError, setNewRoleError] = useState("");

  const accessByApp = useMemo(() => Object.fromEntries((access?.apps || []).map((a) => [a.code, a])), [access]);

  const q = roleSearch.toLowerCase().replace(/[_:-]+/g, " ").trim();
  const filteredRoles = roles.filter((r) => `${r.name} ${r.description || ""}`.toLowerCase().replace(/[_:-]+/g, " ").includes(q));
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isProtected = Boolean(access?.protected);

  const save = async (key, body, label) => {
    setBusyKey(key);
    try {
      const res = await setRoleAccess({ roleId: selectedRoleId, ...body }).unwrap();
      const changed = (res?.added || 0) + (res?.removed || 0);
      toast.success(changed ? label : "Already set — nothing changed");
    } catch (e) {
      const d = e?.data;
      toast.error(d?.message?.message || d?.message || d?.detail || "Couldn't update access");
    } finally {
      setBusyKey(null);
    }
  };

  const setApp = (app, level) =>
    save(app.code, { apps: { [app.code]: level } }, `${app.name}: ${LEVEL_LABEL[level]} for every document`);
  const setPart = (part, level) => save(part.key, { parts: { [part.key]: level } }, `${part.name}: ${LEVEL_LABEL[level]}`);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return setNewRoleError("Give the role a name.");
    try {
      const data = await createRole({ name: newRoleName.trim() }).unwrap();
      toast.success(`Role "${data.name || newRoleName}" created`);
      setRoleSearch("");
      setNewRoleName("");
      setNewRoleOpen(false);
      setSelectedRoleId(data.id);
    } catch (err) {
      toast.error(err?.data?.message || err?.data?.detail || "Failed to create role");
    }
  };

  const handleDeleteRole = async (role) => {
    if (!(await appConfirm(`Delete role "${humanize(role.name)}"? People in it lose all access.`))) return;
    try {
      await deleteRole(role.id).unwrap();
      toast.success(`Role "${humanize(role.name)}" deleted`);
      setSelectedRoleId(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.data?.detail || "Failed to delete role");
    }
  };

  if (!canRead) return <AdminAccessDenied crumb="Roles & permissions" />;

  return (
    <Page>
      <style>{CSS}</style>
      <PageHeader
        crumbs={adminCrumbs("Roles & permissions")}
        title="Roles & permissions"
        subtitle="For each role, choose how much it can do in every app — and, if needed, in each document inside it."
        actions={
          canAssign && (
            <Button variant="primary" icon={Plus} onClick={() => setNewRoleOpen(true)} data-testid="new-role-btn">
              New role
            </Button>
          )
        }
      />

      <div className="adm-split">
        <Card title="Roles" subtitle={roles.length ? plural(roles.length, "role") : undefined} flush className="adm-sticky adm-roles-sidebar">
          <div className="adm-roles-search">
            <Field label="Search roles" htmlFor="roles-search">
              <TextInput id="roles-search" type="search" placeholder="Search roles…" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} />
            </Field>
          </div>
          {loadingRoles && roles.length === 0 ? (
            <div className="adm-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="adm-list__item">
                  <div className="adm-skel" style={{ width: "70%" }} />
                </div>
              ))}
            </div>
          ) : roles.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No roles yet" text="Create a role to start granting access." />
          ) : (
            <div className="adm-list adm-roles-list" role="listbox" aria-label="Roles">
              {filteredRoles.length === 0 && (
                <p className="adm-section__desc" role="status" style={{ padding: 16 }}>
                  No roles match your search.
                </p>
              )}
              {filteredRoles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="option"
                  aria-selected={selectedRoleId === r.id}
                  aria-current={selectedRoleId === r.id}
                  className="adm-list__item"
                  data-testid={`role-item-${r.name}`}
                  onClick={() => setSelectedRoleId(r.id)}
                >
                  <span className="inos-icon-tile inos-icon-tile--sm">
                    <ShieldCheck aria-hidden />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="adm-list__name" style={{ display: "block" }}>
                      {humanize(r.name)}
                    </span>
                    <span className="adm-list__sub" style={{ display: "block" }}>
                      {r.description || (r.scope === "PROJECT" ? "Project role" : "Custom role")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {!selectedRole ? (
          <Card>
            <EmptyState icon={ShieldCheck} title="Select a role" text="Pick a role on the left to set what it can do." />
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
            <Card
              title={humanize(selectedRole.name)}
              subtitle={selectedRole.description || "Set an access level per app. Expand an app to fine-tune individual documents."}
              actions={
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {isProtected && (
                    <Pill tone="brand" title="Administrators always keep full access to users, roles and permissions">
                      <Lock size={12} aria-hidden /> Administrator
                    </Pill>
                  )}
                  {canAssign && !isProtected && (
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDeleteRole(selectedRole)} data-testid="delete-role-btn">
                      Delete role
                    </Button>
                  )}
                </div>
              }
            >
              <Legend />
            </Card>

            <Card flush>
              <div className="rp-matrix" aria-label="App access" aria-busy={loadingAccess || undefined}>
                <div className="rp-head">
                  <span>App / document</span>
                  <span>Access level</span>
                </div>
                {(catalogue?.apps || []).map((app) => {
                  const a = accessByApp[app.code];
                  const expanded = Boolean(open[app.code]);
                  const meaningful = app.parts.filter((p) => p.permissions.length);
                  return (
                    <div key={app.code} className="rp-app" data-testid={`rp-app-${app.code}`}>
                      <div className="rp-row rp-row--app">
                        <button
                          type="button"
                          className="rp-toggle"
                          aria-expanded={expanded}
                          onClick={() => setOpen((o) => ({ ...o, [app.code]: !expanded }))}
                          data-testid={`rp-toggle-${app.code}`}
                        >
                          <ChevronRight size={16} className={expanded ? "rp-chev rp-chev--open" : "rp-chev"} aria-hidden />
                          <span className="rp-name">
                            <strong>{app.name}</strong>
                            <span className="rp-sub">
                              {app.description} · {plural(meaningful.length, "document/part", "documents/parts")}
                            </span>
                          </span>
                        </button>
                        <LevelSelect
                          label={`${app.name} access level`}
                          testId={`rp-level-${app.code}`}
                          value={a?.level || "none"}
                          disabled={!canAssign || !a || busyKey === app.code}
                          onChange={(lvl) => setApp(app, lvl)}
                        />
                      </div>
                      {expanded && (
                        <div role="group" aria-label={`${app.name} documents`}>
                          {meaningful.map((part) => {
                            const pa = a?.parts.find((x) => x.key === part.key);
                            return (
                              <div key={part.key} className="rp-row rp-row--part" data-testid={`rp-part-${part.key}`}>
                                <span className="rp-name">
                                  <span>
                                    {part.name}
                                    {part.kind === "document" && <span className="rp-tag">Document</span>}
                                    {pa?.custom && (
                                      <span className="rp-tag rp-tag--warn" title={`Granted individually: ${(pa?.granted || []).join(", ")}`}>
                                        Custom
                                      </span>
                                    )}
                                  </span>
                                  <span className="rp-sub" title={part.permissions.map((p) => p.name).join(", ")}>
                                    {part.description || plural(part.permissions.length, "permission")}
                                  </span>
                                </span>
                                <LevelSelect
                                  label={`${part.name} access level`}
                                  testId={`rp-level-${part.key}`}
                                  value={pa?.level || "none"}
                                  available={pa?.available}
                                  disabled={!canAssign || !pa || busyKey === part.key || busyKey === app.code}
                                  onChange={(lvl) => setPart(part, lvl)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
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
        subtitle="Create the role first — then choose its access levels."
        width={460}
        footer={<ModalActions onCancel={() => setNewRoleOpen(false)} submitting={creatingRole} submittingLabel="Creating…" submitLabel="Create role" />}
      >
        <Field label="Role name" required htmlFor="nr-name" error={newRoleError} hint="Short and descriptive, e.g. the job people in it do.">
          <TextInput
            id="nr-name"
            autoFocus
            value={newRoleName}
            onChange={(e) => {
              setNewRoleName(e.target.value);
              setNewRoleError("");
            }}
            placeholder="e.g. Site Supervisor"
          />
        </Field>
      </AdminModal>
    </Page>
  );
}

const CSS = `
.rp-legend { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.rp-legend__item { display: grid; gap: 6px; align-content: start; font-size: 13px; color: var(--text-2); line-height: 1.45; }
.rp-legend__item .inos-pill { justify-self: start; }
.rp-head { display: flex; justify-content: space-between; padding: 12px 20px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); }
.rp-app + .rp-app { border-top: 1px solid var(--line); }
.rp-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 20px; }
.rp-row--part { padding-left: 52px; background: var(--sage-50, #f6f8f7); border-top: 1px solid var(--line); }
.rp-toggle { display: flex; align-items: center; gap: 10px; background: none; border: 0; padding: 0; text-align: left; cursor: pointer; min-width: 0; flex: 1; color: inherit; font: inherit; }
.rp-chev { flex-shrink: 0; color: var(--muted); transition: transform .15s; }
.rp-chev--open { transform: rotate(90deg); }
.rp-name { display: grid; gap: 2px; min-width: 0; }
.rp-sub { font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rp-level { width: 230px; flex-shrink: 0; }
.rp-level[data-level="none"] { color: var(--muted); }
.rp-level[data-level="mixed"] { border-color: #d9a441; }
.rp-tag { display: inline-block; margin-left: 8px; padding: 1px 7px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--mist-soft, #eef2f1); color: var(--text-2); vertical-align: 1px; }
.rp-tag--warn { background: #fdf3df; color: #8a5a00; cursor: help; }
@media (max-width: 720px) { .rp-row { flex-wrap: wrap; } .rp-level { width: 100%; } .rp-row--part { padding-left: 20px; } }
`;
