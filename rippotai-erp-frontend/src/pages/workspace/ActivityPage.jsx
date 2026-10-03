// Audit-log feed with filters. Used for every "<app>/activity" menu item and for /activity (all apps).
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { History, RotateCcw } from "lucide-react";
import {
  Page, PageHeader, Card, Button, Toolbar, ToolbarSpacer, SearchInput, Segmented, SelectInput,
  Pill, EmptyState, Avatar, prettyStatus,
} from "@/components/inos";
import { APP_META } from "@/config/appNav";
import { useGetWsActivityQuery } from "@/api/workspace/workspace.api";
import { fmtDate, fmtTime, relTime, Loading, Meta } from "./shared";

const APP_OPTIONS = [
  ["all", "All apps"], ["projects", "Projects"], ["design_studio", "Design Studio"], ["crm", "CRM"],
  ["ledger", "Ledger"], ["procurement", "Procurement"], ["inventory", "Inventory"],
  ["siteOperations", "Site Operations"], ["tasks", "Tasks"], ["calendar", "Calendar"], ["adminConsole", "Admin Console"],
];

const RANGE = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

const VERBS = [
  { value: "", label: "Any action" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "status_changed", label: "Status changed" },
  { value: "completed", label: "Completed" },
  { value: "deleted", label: "Deleted" },
  { value: "approved", label: "Approved" },
];

const toneForAction = (a = "") => {
  if (/deleted|rejected|declined|failed|denied|unauthorized/.test(a)) return "bad";
  if (/created|added|uploaded/.test(a)) return "ok";
  if (/approved|completed|paid|accepted/.test(a)) return "brand";
  if (/status|stage|submitted|sent/.test(a)) return "lilac";
  if (/login|logout|token/.test(a)) return "mute";
  return "info";
};

const entityLink = (row) => {
  const t = String(row.entity_type || "").toLowerCase();
  const id = row.entity_id;
  if (!id) return null;
  switch (t) {
    case "project": return `/projects/${id}`;
    case "client": return `/clients/${id}`;
    case "task": return `/tasks/${id}`;
    case "vendor": return `/procurement/vendors/${id}`;
    case "quotation": return `/procurement/estimates/${id}`;
    case "site_recce": return `/crm/recce/${id}`;
    case "brief": case "project_brief": return `/crm/brief/${id}`;
    default: return null;
  }
};

const sentence = (row) => {
  const verb = prettyStatus(String(row.action || "").split("_").slice(1).join("_") || row.action).toLowerCase();
  const noun = prettyStatus(String(row.action || "").split("_")[0]).toLowerCase();
  if (/^(login|logout|login_failed)$/.test(row.action)) return row.action === "login" ? "signed in" : prettyStatus(row.action).toLowerCase();
  return `${verb} ${noun}`;
};

function ChangeSummary({ changes }) {
  if (!changes || typeof changes !== "object") return null;
  const entries = Object.entries(changes)
    .filter(([k, v]) => v != null && typeof v !== "object" && !/(_id|Id|slug)$/.test(k) && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(v)))
    .slice(0, 4);
  if (!entries.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {entries.map(([k, v]) => (
        <span key={k} style={{ fontSize: 12, color: "var(--text-2)", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 6, padding: "2px 8px" }}>
          {prettyStatus(k)}: <b style={{ fontWeight: 600 }}>{String(v).slice(0, 40)}</b>
        </span>
      ))}
    </div>
  );
}

export default function ActivityPage({ appKey }) {
  const fixedApp = appKey && appKey !== "all" ? appKey : null;
  const [app, setApp] = useState(fixedApp || "all");
  const [q, setQ] = useState("");
  const [range, setRange] = useState("30");
  const [verb, setVerb] = useState("");
  const [entityType, setEntityType] = useState("");
  const [limit, setLimit] = useState(50);

  const from = useMemo(() => {
    if (range === "all") return undefined;
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    return d.toISOString();
  }, [range]);

  const { data, isLoading, isFetching, isError, refetch } = useGetWsActivityQuery({
    app: fixedApp || app, q: q.trim() || undefined, from, verb: verb || undefined, entity_type: entityType || undefined, limit,
  });
  const rows = data?.rows || [];
  const total = data?.total || 0;

  const groups = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      const k = fmtDate(r.created_at, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return [...m.entries()];
  }, [rows]);

  const meta = fixedApp ? APP_META[fixedApp] : null;
  const filtersOn = q || verb || entityType || range !== "30" || (!fixedApp && app !== "all");

  return (
    <Page>
      <PageHeader
        crumbs={meta ? [{ label: meta.name, to: meta.base }, { label: "Activity" }] : [{ label: "Workspace" }, { label: "Activity" }]}
        title="Activity"
        subtitle={meta ? `Every recorded action in ${meta.name} — who did what, and when.` : "Audit trail across every INOS app."}
        actions={<Button icon={RotateCcw} onClick={refetch} loading={isFetching && !isLoading}>Refresh</Button>}
      />

      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Search person, record or action" />
        {!fixedApp && (
          <SelectInput value={app} onChange={(e) => setApp(e.target.value)} style={{ width: 180 }} aria-label="App">
            {APP_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </SelectInput>
        )}
        <SelectInput value={verb} onChange={(e) => setVerb(e.target.value)} style={{ width: 170 }} aria-label="Action">
          {VERBS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
        </SelectInput>
        {(data?.entity_types?.length > 1 || entityType) && (
          <SelectInput value={entityType} onChange={(e) => setEntityType(e.target.value)} style={{ width: 170 }} aria-label="Record type">
            <option value="">All records</option>
            {(data?.entity_types || []).map((t) => <option key={t.entity_type} value={t.entity_type}>{prettyStatus(t.entity_type)} ({t.n})</option>)}
          </SelectInput>
        )}
        <ToolbarSpacer />
        <Segmented value={range} onChange={setRange} options={RANGE} />
      </Toolbar>

      <Card
        title={isLoading ? "Loading activity" : `${total} ${total === 1 ? "event" : "events"}`}
        subtitle={range === "all" ? "All time" : `Last ${range} days`}
        actions={filtersOn ? <Button size="sm" variant="ghost" onClick={() => { setQ(""); setVerb(""); setEntityType(""); setRange("30"); if (!fixedApp) setApp("all"); }}>Clear filters</Button> : null}
      >
        {isLoading ? (
          <Loading />
        ) : isError ? (
          <EmptyState icon={History} title="Couldn't load activity" text="The activity service didn't respond. Try again in a moment." action={<Button onClick={refetch}>Retry</Button>} />
        ) : !rows.length ? (
          <EmptyState
            icon={History}
            title={filtersOn ? "Nothing matches these filters" : "No activity yet"}
            text={filtersOn ? "Try a wider date range or clear the filters." : "As your team creates and updates records, every action is logged here."}
          />
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {groups.map(([day, items]) => (
              <div key={day}>
                <div className="inos-eyebrow" style={{ marginBottom: 8 }}>{day}</div>
                <div style={{ display: "grid" }}>
                  {items.map((r, i) => {
                    const href = entityLink(r);
                    const who = r.user_name || r.user_email || "System";
                    return (
                      <div key={r.id} data-testid="activity-row" style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                        <Avatar name={who} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "var(--fs-body)", color: "var(--text)", lineHeight: 1.5 }}>
                            <b style={{ fontWeight: 650 }}>{who}</b> {sentence(r)}{" "}
                            {r.entity_label && (href ? <Link to={href} style={{ color: "var(--brand)", fontWeight: 600 }}>{r.entity_label}</Link> : <b style={{ fontWeight: 600 }}>{r.entity_label}</b>)}
                          </div>
                          <ChangeSummary changes={r.changes} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                          <Pill tone={toneForAction(r.action)} size="sm">{prettyStatus(r.action)}</Pill>
                          <Meta title={new Date(r.created_at).toLocaleString()}>{fmtTime(r.created_at)} · {relTime(r.created_at)}</Meta>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {rows.length < total && (
              <div style={{ textAlign: "center" }}>
                <Button onClick={() => setLimit((l) => l + 50)} loading={isFetching}>Load more ({total - rows.length} older)</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </Page>
  );
}
