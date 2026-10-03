// "Roles and Permissions" menu item inside each app: who can open this app, by role, with the people behind each role.
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, Users, ExternalLink } from "lucide-react";
import { Page, PageHeader, Card, Button, Pill, EmptyState, Avatar, Stats, StatTile, prettyStatus } from "@/components/inos";
import { APP_META } from "@/config/appNav";
import { useGetRoleAppMatrixQuery, useGrantAppToRoleMutation, useRevokeRoleAppMutation } from "@/api/users/rbac.api";
import { useUsersList, Loading, Meta } from "./shared";

export default function AppRolesPage({ appKey }) {
  const navigate = useNavigate();
  const meta = APP_META[appKey] || { name: prettyStatus(appKey), base: "/" };
  const { data, isLoading, isError, refetch } = useGetRoleAppMatrixQuery();
  const { users } = useUsersList();
  const [grant] = useGrantAppToRoleMutation();
  const [revoke] = useRevokeRoleAppMutation();
  const [busy, setBusy] = useState(null);

  const roles = data?.roles || [];
  const has = useMemo(() => {
    const s = new Set();
    for (const a of data?.assignments || []) s.add(`${a.role_id}:${a.app_code}`);
    return s;
  }, [data]);
  const peopleByRole = useMemo(() => {
    const m = {};
    for (const u of users) (m[u.role_id] ||= []).push(u);
    return m;
  }, [users]);

  const allowedRoles = roles.filter((r) => has.has(`${r.id}:${appKey}`));
  const allowedPeople = allowedRoles.reduce((n, r) => n + (peopleByRole[r.id]?.length || 0), 0);

  const toggle = async (role) => {
    const on = has.has(`${role.id}:${appKey}`);
    if (on && role.name === "ADMIN") return toast.error("Admins always keep access to every app.");
    setBusy(role.id);
    try {
      if (on) await revoke({ roleId: role.id, appCode: appKey }).unwrap();
      else await grant({ role_id: role.id, app_code: appKey }).unwrap();
      toast.success(`${prettyStatus(String(role.name).toLowerCase())} ${on ? "can no longer open" : "can now open"} ${meta.name}`);
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || "Couldn't update access");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: meta.name, to: meta.base }, { label: "Roles and permissions" }]}
        title="Roles and permissions"
        subtitle={`Choose which roles can open ${meta.name}. Fine-grained permissions live in the Admin Console.`}
        actions={<Button icon={ExternalLink} onClick={() => navigate("/console/roles-permissions")}>Full permission matrix</Button>}
      />
      <Stats>
        <StatTile label="Roles with access" value={isLoading ? "—" : `${allowedRoles.length} of ${roles.length}`} icon={<ShieldCheck size={16} />} tone="ok" />
        <StatTile label="People with access" value={isLoading ? "—" : allowedPeople} icon={<Users size={16} />} tone="info" />
      </Stats>
      <Card title="Access by role" subtitle="Switch a role on to show this app on its launcher." flush>
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
                  <th>Access</th>
                  <th className="actions" />
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => {
                  const on = has.has(`${r.id}:${appKey}`);
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
                      <td>{on ? <Pill tone="ok">Can open</Pill> : <Pill>No access</Pill>}</td>
                      <td className="actions">
                        <Button size="sm" variant={on ? "ghost" : "soft"} loading={busy === r.id} onClick={() => toggle(r)} disabled={on && r.name === "ADMIN"}>
                          {on ? "Remove access" : "Give access"}
                        </Button>
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
