import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { sectionNameFor } from "@/config/appNav";
import { Search, Filter, Save, ChevronRight } from "lucide-react";

/* Small helper components */
const PageShell = ({ title, subtitle, action, children }) => (
  <div
    className="space-y-5"
    data-testid={`section-page-${title.replace(/\s+/g, "-").toLowerCase()}`}
  >
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5 font-semibold">
          Section
        </div>
        <h1
          className="text-[24px] sm:text-[36px] font-bold tracking-tight text-[#333333]"
          style={{ fontFamily: "Poppins" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-[#6B7B7C] mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
    <div>{children}</div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bc-card p-5 ${className}`}>{children}</div>
);

const EmptyState = ({ msg = "No records yet", hint }) => (
  <Card className="text-center py-10">
    <div className="text-[15px] text-[#6B7B7C] mb-1">{msg}</div>
    {hint && <div className="text-[13px] text-[#B5C4B6]">{hint}</div>}
  </Card>
);

const Loading = () => (
  <div className="text-center text-[13px] text-[#B5C4B6] py-10">Loading…</div>
);

const useData = (url) => {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    api
      .get(url)
      .then((r) => alive && setD(r.data))
      .catch((e) => alive && setErr(e));
    return () => {
      alive = false;
    };
  }, [url]);
  return { data: d, error: err, loading: d === null && !err };
};

/* ---------------------- Section renderers ---------------------- */

const ActivityFeed = ({ app }) => {
  const { data, loading } = useData(`/activity-feed?app=${app}&limit=60`);
  if (loading) return <Loading />;
  const rows = data || [];
  if (!rows.length)
    return (
      <EmptyState
        msg={`No ${app} activity yet`}
        hint="Actions in this app will show up here in real time."
      />
    );
  return (
    <Card>
      <div className="divide-y divide-[rgba(31,69,59,0.08)]">
        {rows.map((r) => (
          <div
            key={r.id || r.created_at}
            className="py-3 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-[#EAEEF0] text-[#333333] text-[13px] font-bold flex items-center justify-center flex-shrink-0">
              {(r.actor_initials || r.actor_email || "??")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-[#333333]">
                <span className="font-semibold">
                  {r.actor_email || "System"}
                </span>{" "}
                {r.action || "updated"}{" "}
                <span className="text-[#6B7B7C]">{r.entity || ""}</span>
              </div>
              {r.details && (
                <div className="text-[12.5px] text-[#6B7B7C] truncate">
                  {r.details}
                </div>
              )}
            </div>
            <div className="text-[12px] text-[#B5C4B6] whitespace-nowrap">
              {r.created_at?.slice(0, 16).replace("T", " ")}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const RolesPage = () => {
  const { data, loading } = useData("/roles-permissions");
  if (loading) return <Loading />;
  const roles = data?.roles || [];
  const matrix = data?.matrix || [];
  return (
    <Card>
      <div className="overflow-x-auto table-container">
        <table className="w-full text-[14px]">
          <thead className="bg-[#F4F6F7]">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                Permission
              </th>
              {roles.map((r) => (
                <th
                  key={r}
                  className="px-3 py-3 font-semibold text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]"
                >
                  {r.replace("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i} className="border-t border-[rgba(31,69,59,0.08)]">
                <td className="px-4 py-3 text-[#333333] font-semibold">
                  {row.action}
                </td>
                {roles.map((r) => (
                  <td key={r} className="px-3 py-3 text-center">
                    {row[r] ? (
                      <span className="inline-block w-5 h-5 rounded-full bg-[#1F453B] text-white text-[10px] leading-5">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-block w-5 h-5 rounded-full bg-[#EAEEF0] text-[#B5C4B6] text-[10px] leading-5">
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const SettingsPage = ({ app }) => {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get(`/settings/${app}`).then((r) => setData(r.data));
  }, [app]);
  if (!data) return <Loading />;
  const values = data.values || {};
  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/settings/${app}`, { values });
      toast.success("Settings saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };
  const update = (k, v) =>
    setData((d) => ({ ...d, values: { ...d.values, [k]: v } }));

  const renderField = (k, v) => {
    if (typeof v === "boolean") {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={v}
            onChange={(e) => update(k, e.target.checked)}
          />
          <span className="text-[14px] text-[#333333]">
            {v ? "Enabled" : "Disabled"}
          </span>
        </label>
      );
    }
    if (typeof v === "number") {
      return (
        <input
          type="number"
          value={v}
          onChange={(e) => update(k, Number(e.target.value))}
          className="bc-input h-10 w-40"
        />
      );
    }
    if (Array.isArray(v)) {
      return (
        <textarea
          rows={3}
          className="bc-input w-full text-[13px]"
          value={v.join(", ")}
          onChange={(e) =>
            update(
              k,
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      );
    }
    return (
      <input
        type="text"
        className="bc-input h-10 w-full max-w-md"
        value={v || ""}
        onChange={(e) => update(k, e.target.value)}
      />
    );
  };

  return (
    <Card>
      <div className="grid gap-4">
        {Object.entries(values).map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start py-3 border-b border-[rgba(31,69,59,0.08)] last:border-0"
          >
            <label className="text-[14px] font-semibold text-[#333333]">
              {k.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())}
            </label>
            <div className="md:col-span-2">{renderField(k, v)}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold flex items-center gap-1.5"
          data-testid="settings-save-btn"
        >
          <Save size={14} /> {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </Card>
  );
};

const SimpleTable = ({ columns, rows, empty = "No records" }) => {
  if (!rows || !rows.length) return <EmptyState msg={empty} />;
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead className="bg-[#F4F6F7]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-3 py-3 font-semibold text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id || i}
                className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7]"
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2.5 text-[#333333]">
                    {c.render ? c.render(r) : (r[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const ProjectStatusPage = () => {
  const { data, loading } = useData("/projects/status-summary");
  if (loading) return <Loading />;
  return (
    <SimpleTable
      columns={[
        { key: "name", label: "Project" },
        { key: "client", label: "Client" },
        { key: "phase", label: "Phase" },
        {
          key: "progress",
          label: "Progress",
          render: (r) => `${r.progress ?? 0}%`,
        },
        {
          key: "timeline_status",
          label: "Status",
          render: (r) => (
            <span
              className="px-2 py-0.5 rounded-full text-[11.5px] font-semibold"
              style={{
                background:
                  r.timeline_status === "delayed" ? "#B5C4B6" : "#D8E0DA",
                color: "#1F453B",
              }}
            >
              {(r.timeline_status || "on_track").replace("_", " ")}
            </span>
          ),
        },
        {
          key: "expected_completion",
          label: "ECD",
          render: (r) => (r.expected_completion || "").slice(0, 10),
        },
      ]}
      rows={data}
    />
  );
};

const ProjectTimelinePage = () => {
  const { data, loading } = useData("/projects/timeline-all");
  if (loading) return <Loading />;
  const rows = data || [];
  if (!rows.length) return <EmptyState msg="No projects yet" />;
  return (
    <div className="space-y-4">
      {rows.map((p) => (
        <Card key={p.id}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[16px] font-semibold text-[#333333]">
                {p.name}
              </div>
              <div className="text-[12.5px] text-[#6B7B7C]">
                {p.client} · {p.phase}
              </div>
            </div>
            <div className="text-[12.5px] text-[#6B7B7C]">
              {(p.start_date || "").slice(0, 10)} →{" "}
              {(p.expected_completion || "").slice(0, 10)}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(p.milestones || []).map((m) => (
              <span
                key={m.id}
                className="text-[12px] px-2.5 py-1 rounded-full bg-[#F4F6F7] text-[#333333]"
                title={m.due_at}
              >
                {m.title}
              </span>
            ))}
            {!p.milestones?.length && (
              <span className="text-[12px] text-[#B5C4B6]">No milestones</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const MilestonesPage = () => {
  const { data, loading } = useData("/projects/milestones-all?limit=200");
  if (loading) return <Loading />;
  return (
    <SimpleTable
      columns={[
        { key: "title", label: "Milestone" },
        { key: "project_name", label: "Project" },
        { key: "assignee", label: "Assignee" },
        { key: "status", label: "Status" },
        {
          key: "due_at",
          label: "Due",
          render: (r) => (r.due_at || r.due_date || "").slice(0, 10),
        },
      ]}
      rows={data}
    />
  );
};

const HandoverPage = () => {
  const { data, loading } = useData("/projects/handover-overview");
  if (loading) return <Loading />;
  return (
    <SimpleTable
      columns={[
        { key: "name", label: "Project" },
        { key: "phase", label: "Phase" },
        {
          key: "progress",
          label: "Progress",
          render: (r) => `${r.progress ?? 0}%`,
        },
        {
          key: "docs",
          label: "Documents",
          render: (r) => `${r.documents_available}/${r.documents_required}`,
        },
        {
          key: "ready_pct",
          label: "Handover Readiness",
          render: (r) => (
            <div className="flex items-center gap-2 min-w-[160px]">
              <div className="flex-1 h-2 bg-[#EAEEF0] rounded-full overflow-hidden">
                <div
                  style={{ width: `${r.ready_pct}%`, background: "#1F453B" }}
                  className="h-full"
                />
              </div>
              <span className="text-[12px] font-semibold text-[#333333]">
                {r.ready_pct}%
              </span>
            </div>
          ),
        },
      ]}
      rows={data}
    />
  );
};

const BoqCostPage = () => {
  const { data, loading } = useData("/boq/cost-summary");
  if (loading) return <Loading />;
  const d = data || {
    total_boqs: 0,
    total_value: 0,
    by_status: {},
    by_project: [],
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-[12px] uppercase tracking-widest text-[#6B7B7C]">
            Total BOQs
          </div>
          <div
            className="text-[32px] font-semibold text-[#333333]"
            style={{ fontFamily: "Poppins" }}
          >
            {d.total_boqs}
          </div>
        </Card>
        <Card>
          <div className="text-[12px] uppercase tracking-widest text-[#6B7B7C]">
            Portfolio Value
          </div>
          <div
            className="text-[32px] font-semibold text-[#333333]"
            style={{ fontFamily: "Poppins" }}
          >
            ₹{(d.total_value / 100000).toFixed(2)} L
          </div>
        </Card>
        <Card>
          <div className="text-[12px] uppercase tracking-widest text-[#6B7B7C]">
            Approved
          </div>
          <div
            className="text-[32px] font-semibold text-[#333333]"
            style={{ fontFamily: "Poppins" }}
          >
            {d.by_status.approved || 0}
          </div>
        </Card>
        <Card>
          <div className="text-[12px] uppercase tracking-widest text-[#6B7B7C]">
            Draft
          </div>
          <div
            className="text-[32px] font-semibold text-[#333333]"
            style={{ fontFamily: "Poppins" }}
          >
            {d.by_status.draft || 0}
          </div>
        </Card>
      </div>
      <SimpleTable
        columns={[
          { key: "project_name", label: "Project" },
          { key: "boqs", label: "BOQs" },
          {
            key: "total",
            label: "Total",
            render: (r) => `₹${(r.total / 100000).toFixed(2)} L`,
          },
        ]}
        rows={d.by_project}
      />
    </div>
  );
};

const BoqVersionsPage = () => {
  const { data, loading } = useData("/boq/versions-log?limit=100");
  if (loading) return <Loading />;
  return (
    <SimpleTable
      columns={[
        {
          key: "boq_number",
          label: "BOQ Number",
          render: (r) => (
            <Link
              to={`/boq/${r.id}`}
              className="text-[#333333] font-mono font-semibold"
            >
              {r.boq_number || `V${r.version}`}
            </Link>
          ),
        },
        { key: "project_name", label: "Project" },
        { key: "status", label: "Status" },
        {
          key: "final_total",
          label: "Total",
          render: (r) => `₹${((r.final_total || 0) / 100000).toFixed(2)} L`,
        },
        {
          key: "updated_at",
          label: "Updated",
          render: (r) => (r.updated_at || "").slice(0, 16).replace("T", " "),
        },
      ]}
      rows={data}
    />
  );
};

const BoqExportsPage = () => {
  const { data, loading } = useData("/boq/exports-log");
  if (loading) return <Loading />;
  if (!data?.length)
    return (
      <EmptyState
        msg="No exports logged yet"
        hint="Every Excel or PDF export will be recorded here with the exporter, variant and timestamp."
      />
    );
  return (
    <SimpleTable
      columns={[
        { key: "boq_number", label: "BOQ" },
        { key: "variant", label: "Variant" },
        { key: "actor", label: "Exported by" },
        {
          key: "created_at",
          label: "When",
          render: (r) => (r.created_at || "").slice(0, 16).replace("T", " "),
        },
      ]}
      rows={data}
    />
  );
};

const BoqRateLibraryPage = () => {
  const { data, loading } = useData("/boq/rate-library?limit=300");
  if (loading) return <Loading />;
  return (
    <SimpleTable
      columns={[
        { key: "description", label: "Item" },
        { key: "unit", label: "Unit" },
        { key: "category", label: "Category" },
        {
          key: "avg_rate",
          label: "Avg Rate",
          render: (r) =>
            r.avg_rate != null ? `₹${r.avg_rate.toFixed(2)}` : "—",
        },
        { key: "usage_count", label: "Used" },
      ]}
      rows={data}
      empty="No rate library entries yet — items derived from BOQ lines will appear here."
    />
  );
};

const BoqCategoriesPage = () => {
  const { data, loading } = useData("/boq/categories-catalog");
  if (loading) return <Loading />;
  return (
    <SimpleTable
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Category" },
        { key: "usage_count", label: "Used in BOQs" },
        { key: "item_count", label: "Line items" },
        {
          key: "avg_subtotal",
          label: "Avg Subtotal",
          render: (r) => `₹${((r.avg_subtotal || 0) / 100000).toFixed(2)} L`,
        },
      ]}
      rows={data}
    />
  );
};

const BoqTemplatesPage = () => {
  const { data, loading } = useData("/boq-templates");
  if (loading) return <Loading />;
  const rows = data || [];
  if (!rows.length)
    return (
      <EmptyState
        msg="No BOQ templates yet"
        hint="Save any BOQ as a template to reuse its category structure."
      />
    );
  return (
    <SimpleTable
      columns={[
        { key: "name", label: "Template" },
        { key: "categories_count", label: "Categories" },
        { key: "items_count", label: "Items" },
        {
          key: "created_at",
          label: "Created",
          render: (r) => (r.created_at || "").slice(0, 10),
        },
      ]}
      rows={rows}
    />
  );
};

const ProjectTemplatesPage = () => {
  const { data, loading } = useData("/project-templates");
  if (loading)
    return (
      <EmptyState
        msg="No project templates yet"
        hint="Templates you save from finished projects will show up here."
      />
    );
  return (
    <SimpleTable
      columns={[
        { key: "name", label: "Template" },
        {
          key: "phases",
          label: "Phases",
          render: (r) => (r.phases || []).length,
        },
        {
          key: "created_at",
          label: "Created",
          render: (r) => (r.created_at || "").slice(0, 10),
        },
      ]}
      rows={data || []}
    />
  );
};

/* ---------------- Router ---------------- */

const SLUG_MAP = {
  // BOQ
  "boq/rate-and-item-library": {
    title: "Rate and Item Library",
    subtitle: "Reusable item, unit and rate catalogue",
    el: <BoqRateLibraryPage />,
  },
  "boq/templates": {
    title: "BOQ Templates",
    subtitle: "Reusable category structures",
    el: <BoqTemplatesPage />,
  },
  "boq/categories": {
    title: "Categories",
    subtitle: "BOQ category catalogue with usage stats",
    el: <BoqCategoriesPage />,
  },
  "boq/cost": {
    title: "Cost",
    subtitle: "Portfolio cost summary across all BOQs",
    el: <BoqCostPage />,
  },
  "boq/versions": {
    title: "Versions",
    subtitle: "All BOQ versions, latest first",
    el: <BoqVersionsPage />,
  },
  "boq/exports": {
    title: "Exports",
    subtitle: "Every PDF and Excel export logged",
    el: <BoqExportsPage />,
  },
  "boq/roles": {
    title: "Roles and Permissions",
    subtitle: "Who can view or manage BOQs",
    el: <RolesPage />,
  },
  "boq/settings": {
    title: "BOQ Settings",
    subtitle: "Numbering, tax, misc %, approval rules",
    el: <SettingsPage app="boq" />,
  },
  "boq/activity": {
    title: "Activity",
    subtitle: "Every BOQ action recorded",
    el: <ActivityFeed app="boq" />,
  },
  // Projects
  "projects/templates": {
    title: "Project Templates",
    subtitle: "Reusable phase + milestone structures",
    el: <ProjectTemplatesPage />,
  },
  "projects/status": {
    title: "Project Status",
    subtitle: "Portfolio status across all projects",
    el: <ProjectStatusPage />,
  },
  "projects/timeline": {
    title: "Timeline",
    subtitle: "Cross-project timeline with milestones",
    el: <ProjectTimelinePage />,
  },
  "projects/milestones": {
    title: "Milestones",
    subtitle: "Every milestone across all projects",
    el: <MilestonesPage />,
  },
  "projects/handover": {
    title: "Handover",
    subtitle: "Handover readiness across the portfolio",
    el: <HandoverPage />,
  },
  "projects/roles": { title: "Roles and Permissions", el: <RolesPage /> },
  "projects/settings": {
    title: "Project Settings",
    el: <SettingsPage app="projects" />,
  },
  "projects/activity": {
    title: "Activity",
    el: <ActivityFeed app="projects" />,
  },
  // Quotations
  "quotations/roles": { title: "Roles and Permissions", el: <RolesPage /> },
  "quotations/settings": {
    title: "Quotation Settings",
    el: <SettingsPage app="quotations" />,
  },
  "quotations/activity": {
    title: "Activity",
    el: <ActivityFeed app="quotations" />,
  },
  // Vendors
  "vendors/roles": { title: "Roles and Permissions", el: <RolesPage /> },
  "vendors/settings": {
    title: "Vendor Settings",
    el: <SettingsPage app="vendors" />,
  },
  "vendors/activity": { title: "Activity", el: <ActivityFeed app="vendors" /> },
  // Documents
  "documents/roles": { title: "Roles and Permissions", el: <RolesPage /> },
  "documents/settings": {
    title: "Document Settings",
    el: <SettingsPage app="documents" />,
  },
  "documents/activity": {
    title: "Activity",
    el: <ActivityFeed app="documents" />,
  },
};

export default function SectionPage({ appKey, slugOverride }) {
  const params = useParams();
  const location = useLocation();
  // Derive slug from URL: /:app/:slug or nested like /documents/forms/project-brief
  const path = location.pathname.replace(/^\/+|\/+$/g, "");
  const parts = path.split("/");
  const app = appKey || parts[0];
  const slug = slugOverride || parts.slice(1).join("/");
  const key = `${app}/${slug}`;
  const entry = SLUG_MAP[key];

  if (entry) {
    return (
      <PageShell title={entry.title} subtitle={entry.subtitle}>
        {entry.el}
      </PageShell>
    );
  }

  // Fallback — for any menu item we haven't specialised yet, still show a real page skeleton
  const title = sectionNameFor(app, slug);
  return (
    <PageShell
      title={title}
      subtitle="Section under construction — content will populate as data becomes available."
    >
      <EmptyState
        msg={`${title} is available`}
        hint="Endpoint is being wired to real data. Check back in the next release."
      />
    </PageShell>
  );
}
