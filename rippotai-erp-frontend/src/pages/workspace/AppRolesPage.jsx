// "Roles and Permissions" menu item inside each app: the access level every role has in this app.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, Users, ExternalLink } from "lucide-react";
import { Page, PageHeader, Card, Button, Pill, EmptyState, Avatar, Stats, StatTile, prettyStatus } from "@/components/inos";
import { APP_META, navigationAppFor } from "@/config/appNav";
import { useGetAppRoleAccessQuery, useSetRoleAccessMutation } from "@/api/users/rbac.api";
import { useAuth } from "@/context/AuthContext";
import { ACCESS_LEVELS, hasPermission } from "@/lib/permissions";
import { useUsersList, Loading, Meta } from "./shared";

const LEVEL_LABEL = Object.fromEntries(ACCESS_LEVELS.map((l) => [l.key, l.label]));

export default function AppRolesPage({ appKey }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAssign = hasPermission(user, "role-permissions", "assign");
  const app = navigationAppFor(appKey);
  const meta = APP_META[app] || APP_META[appKey] || { name: prettyStatus(appKey), base: "/" };
  const { data, isLoading, isError, refetch } = useGetAppRoleAccessQuery(app);
  const { users } = useUsersList();
  const [setAccess] = useSetRoleAccessMutation();
  const [busy, setBusy] = useState(null);

  const roles = data?.roles || [];
  const peopleByRole = useMemo(() => {
    const m = {};
    for (const u of users) (m[u.role_id] ||= []).push(u);
    return m;
  }, [users]);

  const allowedRoles = roles.filter((r) => r.level !== "none");
  const allowedPeople = allowedRoles.reduce((n, r) => n + (peopleByRole[r.id]?.length || 0), 0);

  const change = async (role, level) => {
    setBusy(role.id);
    try {
      await setAccess({ roleId: role.id, apps: { [app]: level } }).unwrap();
      toast.success(`${prettyStatus(String(role.name).toLowerCase())}: ${LEVEL_LABEL[level]} in ${meta.name}`);
      refetch();
    } catch (e) {
      const d = e?.data;
      toast.error(d?.message?.message || d?.message || "Couldn't update access");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: meta.name, to: meta.base }, { label: "Roles and permissions" }]}
        title="Roles and permissions"
        subtitle={`How much each role can do in ${meta.name}. Per-document levels live in the Admin Console.`}
        actions={<Button icon={ExternalLink} onClick={() => navigate("/console/roles-permissions")}>Per-document access</Button>}
      />
      <Stats>
        <StatTile label="Roles with access" value={isLoading ? "—" : `${allowedRoles.length} of ${roles.length}`} icon={<ShieldCheck size={16} />} tone="ok" />
        <StatTile label="People with access" value={isLoading ? "—" : allowedPeople} icon={<Users size={16} />} tone="info" />
      </Stats>
      <Card title="Access by role" subtitle="Setting a level here applies it to every document in this app." flush>
        {isLoading ? (
          <Loading />
        ) : isError ? (
          <EmptyState icon={ShieldCheck} title="Couldn't load roles" action={<Button onClick={refetch}>Retry</Button>} />
        ) : !roles.length ? (
          <EmptyState icon={ShieldCheck} title="No roles defined" text="Create roles in the Admin Console first." />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>People</th>
                  <th>Access level</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => {
                  const people = peopleByRole[r.id] || [];
                  return (
                    <tr key={r.id} data-testid={`role-row-${r.name}`}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prettyStatus(String(r.name).toLowerCase())}</div>
                        {r.description && <Meta>{r.description}</Meta>}
                      </td>
                      <td>
                        {people.length ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex" }}>
                              {people.slice(0, 5).map((u, i) => (
                                <span key={u.id} title={u.name} style={{ marginLeft: i ? -4 : 0, borderRadius: 999, boxShadow: "0 0 0 2px var(--surface)" }}>
                                  <Avatar name={u.name} src={u.avatar_url} size={28} />
                                </span>
                              ))}
                            </div>
                            <Meta>{people.length} {people.length === 1 ? "person" : "people"}</Meta>
                          </div>
                        ) : (
                          <Meta>Nobody yet</Meta>
                        )}
                      </td>
                      <td>
                        {canAssign ? (
                          <select
                            className="inos-select"
                            style={{ width: 230 }}
                            aria-label={`${r.name} access level`}
                            value={r.level}
                            disabled={busy === r.id}
                            onChange={(e) => change(r, e.target.value)}
                          >
                            {r.level === "mixed" && <option value="mixed" disabled>Custom mix</option>}
                            {ACCESS_LEVELS.map((l) => (
                              <option key={l.key} value={l.key}>{l.label}</option>
                            ))}
                          </select>
                        ) : (
                          <Pill tone={r.level === "none" ? "mute" : "ok"}>{r.level === "mixed" ? "Custom mix" : LEVEL_LABEL[r.level]}</Pill>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}
