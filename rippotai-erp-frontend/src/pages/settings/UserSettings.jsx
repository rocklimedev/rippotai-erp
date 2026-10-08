import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Users, SearchX } from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Toolbar,
  ToolbarSpacer,
  SearchInput,
  Segmented,
  Pill,
  Avatar,
} from "@/components/inos";
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../../api/users/user.api";
import { fmtDate } from "../../lib/settings.utils";
import InviteUserModal from "../../components/users/InviteUserModal";
import UserActionsMenu from "../../components/users/UserActionsMenu";
import {
  AdminAccessDenied,
  SkeletonRows,
  TableEmpty,
  adminCrumbs,
  humanize,
  plural,
} from "./_admin-ui";

export default function UsersSettings() {
  const { user } = useAuth();
  const isAdmin = ["ADMIN", "SUPERADMIN"].includes(user?.role);

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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Deep link from the Admin overview: /console/users?invite=1
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get("invite") === "1") {
      setModalUser("new");
      const next = new URLSearchParams(params);
      next.delete("invite");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

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

  const list = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const activeCount = list.filter((u) => u.is_active !== false).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      const active = u.is_active !== false;
      if (statusFilter === "active" && !active) return false;
      if (statusFilter === "inactive" && active) return false;
      if (!q) return true;
      return [u.name, u.email, u.job_title, u.role?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [list, search, statusFilter]);

  if (!isAdmin) {
    return <AdminAccessDenied crumb="Users" />;
  }

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs("Users")}
        title="Users"
        subtitle="Invite team members, set their role and switch access on or off."
        actions={
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setModalUser("new")}
            data-testid="invite-user-btn"
          >
            Invite user
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or role"
        />
        <Segmented
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: `All · ${list.length}` },
            { value: "active", label: `Active · ${activeCount}` },
            {
              value: "inactive",
              label: `Inactive · ${list.length - activeCount}`,
            },
          ]}
        />
        <ToolbarSpacer />
      </Toolbar>

      <Card flush>
        <div className="inos-table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th>User</th>
                <th className="adm-hide-sm">Email</th>
                <th>Role</th>
                <th className="adm-hide-sm">Joined</th>
                <th>Status</th>
                <th className="actions" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loadingUsers && list.length === 0 ? (
                <SkeletonRows cols={6} />
              ) : list.length === 0 ? (
                <TableEmpty
                  cols={6}
                  icon={Users}
                  title={usersError ? "Couldn't load users" : "No users yet"}
                  text={
                    usersError
                      ? "The users service didn't respond. Try again in a moment."
                      : "Invite your first team member to get started."
                  }
                  action={
                    !usersError && (
                      <Button
                        variant="soft"
                        icon={UserPlus}
                        onClick={() => setModalUser("new")}
                      >
                        Invite user
                      </Button>
                    )
                  }
                />
              ) : visible.length === 0 ? (
                <TableEmpty
                  cols={6}
                  icon={SearchX}
                  title="No matching users"
                  text="Try a different name, email or filter."
                />
              ) : (
                visible.map((u) => {
                  const active = u.is_active !== false;
                  const isSelf = u.id === user.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="adm-cell-main">
                          <Avatar
                            name={u.name}
                            src={u.avatar_url || undefined}
                            size={36}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              className="adm-cell-title"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              {u.name}
                              {isSelf && (
                                <Pill tone="brand" dot={false} size="sm">
                                  You
                                </Pill>
                              )}
                            </div>
                            <div className="adm-cell-sub">
                              {u.job_title ||
                                humanize(u.role?.name) ||
                                "Team member"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="adm-cell-2 adm-hide-sm">{u.email}</td>
                      <td>
                        {u.role?.name ? (
                          <Pill tone="brand" dot={false}>
                            {humanize(u.role.name)}
                          </Pill>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="adm-cell-2 tabular adm-hide-sm">
                        {fmtDate(u.created_at)}
                      </td>
                      <td>
                        <Pill tone={active ? "ok" : "mute"}>
                          {active ? "Active" : "Inactive"}
                        </Pill>
                      </td>
                      <td className="actions">
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
        {list.length > 0 && (
          <div className="adm-table-foot">
            {plural(visible.length, "user")} shown · {activeCount} active
          </div>
        )}
      </Card>

      {modalUser && (
        <InviteUserModal
          user={modalUser === "new" ? undefined : modalUser}
          onClose={() => setModalUser(null)}
        />
      )}
    </Page>
  );
}
