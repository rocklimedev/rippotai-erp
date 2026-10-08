import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Building2,
  FileText,
  Layers3,
  Network,
  PenLine,
  ScrollText,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  Page,
  PageHeader,
  Card,
  Button,
  StatTile,
  EmptyState,
  Pill,
  Avatar,
} from "@/components/inos";
import { useGetUsersQuery } from "../../api/users/user.api";
import { useGetRolesQuery } from "../../api/users/rbac.api";
import { useGetClientsQuery } from "../../api/projects/client.api";
import { useGetProjectPhasesQuery } from "../../api/projects/project.api";
import { useGetDocumentTypesQuery } from "../../api/documents/document.api";
import { useGetTermsTemplatesQuery } from "../../api/meta/terms.api";
import { useGetActivityLogsQuery } from "../../api/engagement/activity-logs.api";
import { AdminAccessDenied, actionTone, humanize, plural } from "./_admin-ui";

const arr = (d) =>
  Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];

const timeAgo = (iso) => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

function SetupCard({ to, icon: Icon, tone, title, desc, count, unit, status }) {
  return (
    <Link to={to} className="adm-setup">
      <div className="adm-setup__top">
        <span
          className={`inos-icon-tile${tone ? ` inos-icon-tile--${tone}` : ""}`}
        >
          <Icon aria-hidden />
        </span>
        {status}
      </div>
      <div>
        <h3 className="adm-setup__title">{title}</h3>
        <p className="adm-setup__desc">{desc}</p>
      </div>
      <div className="adm-setup__foot">
        {count != null ? (
          <span className="adm-setup__count">
            {count}
            <small>{unit}</small>
          </span>
        ) : (
          <span>Open</span>
        )}
        <ArrowRight aria-hidden />
      </div>
    </Link>
  );
}

export default function AdminOverview() {
  const { user } = useAuth();
  const nav = useNavigate();
  const isAdmin = ["ADMIN", "SUPERADMIN"].includes(user?.role);
  const skip = { skip: !isAdmin };

  // Same cache keys as the individual admin pages, so counts are shared.
  const users = useGetUsersQuery({}, skip);
  const roles = useGetRolesQuery(undefined, skip);
  const clients = useGetClientsQuery({ includeDeleted: false }, skip);
  const phases = useGetProjectPhasesQuery({ search: undefined }, skip);
  const docTypes = useGetDocumentTypesQuery({}, skip);
  const terms = useGetTermsTemplatesQuery(undefined, skip);
  const logs = useGetActivityLogsQuery(
    { user_id: "", action: "", entity_type: "", entity_id: "" },
    skip,
  );

  if (!isAdmin) return <AdminAccessDenied />;

  const count = (q) =>
    q.isLoading ? "…" : q.isError ? "—" : arr(q.data).length;
  const n = (q) => (q.isLoading || q.isError ? null : arr(q.data).length);

  const userList = arr(users.data);
  const activeUsers = userList.filter((u) => u.is_active !== false).length;
  const recent = arr(logs.data).slice(0, 7);
  const docCount = n(docTypes);
  const termsCount = n(terms);

  const groups = [
    {
      title: "People & access",
      desc: "Who can sign in, and what they can see.",
      cards: [
        {
          to: "/console/users",
          icon: Users,
          title: "Users",
          desc: "Invite teammates and switch their access on or off.",
          count: n(users),
          unit: n(users) === 1 ? "member" : "members",
        },
        {
          to: "/console/roles-permissions",
          icon: ShieldCheck,
          tone: "lilac",
          title: "Roles & permissions",
          desc: "Decide which apps and actions each role gets.",
          count: n(roles),
          unit: n(roles) === 1 ? "role" : "roles",
        },
        {
          to: "/console/clients",
          icon: Building2,
          tone: "info",
          title: "Clients",
          desc: "The people and companies you build for.",
          count: n(clients),
          unit: n(clients) === 1 ? "client" : "clients",
        },
      ],
    },
    {
      title: "Project setup",
      desc: "The building blocks every new project starts from.",
      cards: [
        {
          to: "/console/project-phases",
          icon: Layers3,
          tone: "ok",
          title: "Project phases",
          desc: "Stages a project moves through, brief to handover.",
          count: n(phases),
          unit: n(phases) === 1 ? "phase" : "phases",
        },
        {
          to: "/console/document-types",
          icon: FileText,
          tone: "peach",
          title: "Document types",
          desc: "Documents and drawings each phase should produce.",
          count: docCount,
          unit: "types",
          status:
            docCount === 0 ? (
              <Pill tone="warn" size="sm">
                Needs setup
              </Pill>
            ) : null,
        },
        {
          to: "/console/project-structure",
          icon: Network,
          title: "Project structure",
          desc: "See phases and their documents as one tree.",
        },
      ],
    },
    {
      title: "Documents & compliance",
      desc: "What goes on paper, and the record of who changed what.",
      cards: [
        {
          to: "/console/company-profile",
          icon: Building2,
          tone: "brand",
          title: "Company profile",
          desc: "Letterhead, GSTIN, PAN and bank details on PDFs.",
        },
        {
          to: "/console/estimate-signature",
          icon: PenLine,
          tone: "warn",
          title: "Estimate signature",
          desc: "The signature printed on approved estimates.",
        },
        {
          to: "/console/terms-and-conditions",
          icon: ScrollText,
          tone: "info",
          title: "Terms & conditions",
          desc: "Reusable terms for BOQs, estimates and clients.",
          count: termsCount,
          unit: termsCount === 1 ? "template" : "templates",
          status:
            termsCount === 0 ? (
              <Pill tone="warn" size="sm">
                Needs setup
              </Pill>
            ) : null,
        },
        {
          to: "/console/super-admin",
          icon: Activity,
          tone: "lilac",
          title: "Super admin",
          desc: "Full activity log across the workspace.",
        },
      ],
    },
  ];

  return (
    <Page>
      <PageHeader
        eyebrow="Workspace settings"
        title="Admin Console"
        subtitle="Set up people, access and the building blocks every project uses."
        actions={
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => nav("/console/users?invite=1")}
            data-testid="overview-invite-btn"
          >
            Invite user
          </Button>
        }
      />

      <div className="inos-stats adm-stats-5">
        <StatTile
          label="Users"
          value={count(users)}
          meta={
            users.isLoading || users.isError ? null : `${activeUsers} active`
          }
          icon={<Users />}
          onClick={() => nav("/console/users")}
        />
        <StatTile
          label="Roles"
          value={count(roles)}
          icon={<ShieldCheck />}
          tone="lilac"
          onClick={() => nav("/console/roles-permissions")}
        />
        <StatTile
          label="Clients"
          value={count(clients)}
          icon={<Building2 />}
          tone="info"
          onClick={() => nav("/console/clients")}
        />
        <StatTile
          label="Project phases"
          value={count(phases)}
          icon={<Layers3 />}
          tone="ok"
          onClick={() => nav("/console/project-phases")}
        />
        <StatTile
          label="Document types"
          value={count(docTypes)}
          meta={docCount === 0 ? "None defined yet" : null}
          icon={<FileText />}
          tone="peach"
          onClick={() => nav("/console/document-types")}
        />
      </div>

      <div className="adm-overview">
        <div>
          {groups.map((g) => (
            <section key={g.title} className="adm-group">
              <div className="adm-group__head">
                <div>
                  <h2 className="inos-section-title">{g.title}</h2>
                  <p className="inos-section-sub">{g.desc}</p>
                </div>
              </div>
              <div className="adm-setup-grid">
                {g.cards.map((c) => (
                  <SetupCard key={c.to} {...c} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <Card
          title="Recent activity"
          subtitle={
            recent.length ? "Latest changes across the workspace" : undefined
          }
          actions={
            <Button
              variant="ghost"
              size="sm"
              iconRight={ArrowRight}
              onClick={() => nav("/console/super-admin")}
            >
              View all
            </Button>
          }
          flush
          className="adm-sticky"
        >
          {logs.isLoading ? (
            <div className="adm-feed">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="adm-feed__item">
                  <div
                    className="adm-skel"
                    style={{ width: 30, height: 30, borderRadius: 999 }}
                  />
                  <div style={{ flex: 1, display: "grid", gap: 6 }}>
                    <div className="adm-skel" style={{ width: "80%" }} />
                    <div className="adm-skel" style={{ width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={logs.isError ? "Activity unavailable" : "No activity yet"}
              text={
                logs.isError
                  ? "The activity log didn't respond."
                  : "Changes made by your team will show up here."
              }
            />
          ) : (
            <div className="adm-feed">
              {recent.map((log) => (
                <div key={log.id} className="adm-feed__item">
                  <Avatar name={log.user_email || "?"} size={30} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="adm-feed__text">
                      <b>{(log.user_email || "System").split("@")[0]}</b> ·{" "}
                      {humanize(log.action).toLowerCase()}
                      {log.entity_label && (
                        <>
                          {" "}
                          <b>{log.entity_label}</b>
                        </>
                      )}
                    </div>
                    <div
                      className="adm-feed__meta"
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Pill tone={actionTone(log.action)} size="sm">
                        {humanize(log.entity_type) || "Record"}
                      </Pill>
                      {timeAgo(log.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {recent.length > 0 && (
            <div className="adm-table-foot">
              {plural(arr(logs.data).length, "event")} recorded
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
