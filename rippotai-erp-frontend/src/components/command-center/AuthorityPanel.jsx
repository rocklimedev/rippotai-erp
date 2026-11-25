// Super-authority dashboard (Command Center → Authority).
// Only ADMIN / SUPERADMIN can load it — the API enforces this with the
// command-center:authority permission; the tab is also hidden for everyone else.
import { useMemo, useState } from "react";
import {
  ShieldCheck, Lock, RefreshCw, ArrowUpRight, ClipboardCheck, AlertTriangle,
  IndianRupee, Users, History, CheckCircle2, Link2, KeyRound,
} from "lucide-react";
import { Card, Button, Pill, StatTile, Stats, EmptyState, Tabs, Avatar, Progress } from "@/components/inos";
import { useGetCommandCenterAuthorityQuery } from "@/api/projects/command-center.api";
import "./authority-panel.css";


/* ---------- formatting ---------- */
const inr = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x) || x === 0) return "₹0";
  const a = Math.abs(x), s = x < 0 ? "−" : "";
  if (a >= 1e7) return `${s}₹${(a / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 1 })} L`;
  return `${s}₹${Math.round(a).toLocaleString("en-IN")}`;
};
// past=true: the date is an event that already happened (login, opened, submitted) — never shown as future.
const ago = (iso, past = false) => {
  if (!iso) return "—";
  let d = (Date.now() - new Date(iso).getTime()) / 864e5;
  if (d < 0 && past) d = 0;
  if (d < 0) { const f = Math.ceil(-d); return f <= 1 ? "tomorrow" : `in ${f}d`; }
  if (d < 1 / 24) return "just now";
  if (d < 1) return `${Math.round(d * 24)}h ago`;
  if (d < 30) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fullDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const humanAction = (a = "") => a.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/* ---------- only the super authority sees this ---------- */
function MoneyView({ money, onOpen }) {
  const t = money.totals;
  const collectedPct = t.contract ? Math.round((t.collected / t.contract) * 100) : 0;
  return (
    <>
      <Stats>
        <StatTile label="Contract value" value={inr(t.contract)} meta={`${money.projects.length} live projects`} icon={<IndianRupee />} />
        <StatTile label="Collected" value={inr(t.collected)} meta={`${collectedPct}% of contract value`} icon={<CheckCircle2 />} tone="ok" />
        <StatTile label="Billed, not collected" value={inr(t.outstanding)} meta="Milestones due but unpaid" icon={<AlertTriangle />} tone={t.outstanding ? "bad" : undefined} />
        <StatTile label="Committed spend" value={inr(t.committed)} meta="Approved POs + work orders" icon={<ClipboardCheck />} tone="warn" />
        <StatTile label="Contract − committed" value={inr(t.margin)} meta="Headroom before more spend" icon={<ShieldCheck />} />
        <StatTile label="Open pipeline" value={inr(t.pipelineOpen)} meta={`${t.pipelineOpenCount} deals · won ${inr(t.pipelineWon)}`} icon={<ArrowUpRight />} tone="info" />
      </Stats>
      <div className="ap-table-wrap">
        <table className="ap-table">
          <thead>
            <tr>
              <th>Project</th><th className="num">Contract</th><th className="num">Committed</th>
              <th className="num">Collected</th><th className="num">Billed, unpaid</th><th>Headroom</th>
            </tr>
          </thead>
          <tbody>
            {money.projects.map((p) => {
              const spent = p.contract ? Math.round((p.committed / p.contract) * 100) : 0;
              return (
                <tr key={p.id} onClick={() => onOpen(`/projects/${p.id}`)}>
                  <td><span className="ap-strong">{p.name}</span><span className="ap-muted ap-status">{String(p.status).replace(/_/g, " ")}</span></td>
                  <td className="num tabular">{inr(p.contract)}</td>
                  <td className="num tabular">{p.committed ? inr(p.committed) : <span className="ap-muted">None yet</span>}</td>
                  <td className="num tabular">{inr(p.collected)}</td>
                  <td className="num tabular">{p.outstanding ? <span className="ap-bad">{inr(p.outstanding)}</span> : "—"}</td>
                  <td className="ap-headroom">
                    {p.contract ? (
                      <>
                        <Progress value={spent} tone={spent > 85 ? "bad" : spent > 65 ? "warn" : "ok"} />
                        <span className="tabular">{p.committed ? `${p.marginPct}% left` : "Nothing committed"}</span>
                      </>
                    ) : <span className="ap-muted">No contract value</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const PURPOSE = { project_view: "Project view", boq_approval: "BOQ approval", handover_acceptance: "Handover" };

function AccessView({ access, onOpen }) {
  const s = access.summary;
  return (
    <>
      <Stats>
        <StatTile label="People with access" value={s.active} meta={`${s.users} accounts in total`} icon={<Users />} />
        <StatTile label="Admins" value={s.admins} meta="Full control of INOS" icon={<KeyRound />} tone={s.admins > 2 ? "warn" : undefined} />
        <StatTile label="Logins this week" value={s.loginsWeek} meta={`${s.peopleWeek} people · ${s.loginsToday} today`} icon={<History />} tone="info" />
        <StatTile label="Dormant / never logged in" value={s.dormant + s.neverLoggedIn} meta="Active accounts unused 30+ days" icon={<AlertTriangle />} tone={s.dormant + s.neverLoggedIn ? "warn" : undefined} />
        <StatTile label="Live client links" value={s.clientLinks} meta="Shared outside the firm" icon={<Link2 />} tone={s.clientLinks ? "lilac" : undefined} />
      </Stats>
      <div className="ap-split">
        <div className="ap-table-wrap">
          <p className="ap-sub">Everyone who can sign in</p>
          <table className="ap-table">
            <thead><tr><th>Person</th><th>Role</th><th>Last login</th><th>Status</th></tr></thead>
            <tbody>
              {access.users.map((u) => (
                <tr key={u.id} onClick={() => onOpen("/console/users")}>
                  <td><div className="ap-person"><Avatar name={u.name} size={28} /><span><span className="ap-strong">{u.name}</span><span className="ap-muted">{u.job_title || u.email}</span></span></div></td>
                  <td><Pill tone={/ADMIN/i.test(u.role || "") ? "warn" : "mute"} size="sm">{u.role || "—"}</Pill></td>
                  <td className="tabular">{u.last_login_at ? ago(u.last_login_at, true) : <span className="ap-muted">Never</span>}</td>
                  <td><Pill tone={Number(u.is_active) === 1 ? "ok" : "mute"} size="sm">{Number(u.is_active) === 1 ? "Active" : "Disabled"}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ap-table-wrap">
          <p className="ap-sub">Links shared with clients (still working)</p>
          {access.clientLinks.length === 0 ? (
            <EmptyState icon={Link2} title="No live client links" text="Nothing from INOS is currently open to people outside the firm." />
          ) : (
            <ul className="ap-links">
              {access.clientLinks.map((l) => (
                <li key={l.id}>
                  <button type="button" className="ap-item" onClick={() => onOpen(`/projects/${l.project_id}`)}>
                    <span className="ap-item__dot ap-dot--lilac" />
                    <span className="ap-item__main">
                      <span className="ap-item__title">{l.project} — {PURPOSE[l.purpose] || l.purpose}</span>
                      <span className="ap-item__sub">{[l.client_name || l.client_email, `opened ${l.open_count}×`, l.created_by && `shared by ${l.created_by}`].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="ap-item__meta"><span className="ap-item__date">expires {ago(l.expires_at)}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

const actionTone = (a = "") =>
  /declined|rejected|deleted|revoked|override/.test(a) ? "bad" : /approved/.test(a) ? "ok" : /role|permission|password|unlock/.test(a) ? "warn" : "info";

function AuditView({ access }) {
  return (
    <div className="ap-split">
      <div className="ap-table-wrap">
        <p className="ap-sub">Sensitive actions — approvals, rejections, status and access changes</p>
        {access.sensitive.length === 0 ? (
          <EmptyState icon={History} title="No sensitive actions yet" />
        ) : (
          <table className="ap-table">
            <thead><tr><th>What happened</th><th>By</th><th>When</th></tr></thead>
            <tbody>
              {access.sensitive.map((a) => (
                <tr key={a.id} className="ap-row-static">
                  <td><Pill tone={actionTone(a.action)} size="sm">{humanAction(a.action)}</Pill> <span className="ap-strong">{a.entity_label || a.entity_type}</span></td>
                  <td><span>{a.user_email || "System"}</span>{a.ip_address && <span className="ap-muted">{a.ip_address}</span>}</td>
                  <td className="tabular">{fullDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="ap-table-wrap">
        <p className="ap-sub">Phase gates cleared by override</p>
        {access.overrides.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No overrides" text="Every phase gate so far was cleared with its full evidence." />
        ) : (
          <table className="ap-table">
            <thead><tr><th>Project · gate</th><th>Cleared by</th><th>When</th></tr></thead>
            <tbody>
              {access.overrides.map((o) => (
                <tr key={o.id} className="ap-row-static">
                  <td><span className="ap-strong">{o.project}</span><span className="ap-muted">{o.gate}{o.remarks ? ` · ${o.remarks}` : ""}</span></td>
                  <td>{o.cleared_by || "—"}</td>
                  <td className="tabular">{fullDate(o.cleared_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const PRIVATE_TABS = [
  { value: "money", label: "Money & margins", icon: IndianRupee },
  { value: "access", label: "Access & sharing", icon: KeyRound },
  { value: "audit", label: "Audit trail", icon: History },
];

export default function AuthorityPanel({ onOpen }) {
  const { data, isLoading, isFetching, isError, error, refetch } = useGetCommandCenterAuthorityQuery(undefined, {
    pollingInterval: 120000,
    refetchOnFocus: true,
  });
  const [privateTab, setPrivateTab] = useState("money");

  const summary = useMemo(() => {
    if (!data) return null;
    const get = (k) => data.review.find((q) => q.key === k);
    const approvals = data.review.filter((q) => q.group === "approvals");
    return {
      decisions: data.review.reduce((a, q) => a + q.count, 0),
      approvalCount: approvals.reduce((a, q) => a + q.count, 0),
      approvalValue: approvals.reduce((a, q) => a + (q.value || 0), 0),
      overdue: get("payments_overdue"),
    };
  }, [data]);

  if (isError) {
    const forbidden = error?.status === 403;
    return (
      <Card>
        <EmptyState
          icon={forbidden ? Lock : AlertTriangle}
          title={forbidden ? "Super authority only" : "Couldn't load the authority dashboard"}
          text={forbidden ? "This view is limited to the ADMIN and SUPERADMIN roles." : "Check that the server is running, then retry."}
          action={!forbidden && <Button onClick={refetch} icon={RefreshCw}>Retry</Button>}
        />
      </Card>
    );
  }
  if (isLoading || !data) {
    return <Card><div className="ap-loading"><RefreshCw className="ap-spin" /> Gathering approvals, money and access…</div></Card>;
  }

  return (
    <div className="ap">
      <section className="ap-hero">
        <div className="ap-hero__id">
          <span className="ap-hero__badge"><ShieldCheck aria-hidden /></span>
          <div>
            <p className="ap-hero__eyebrow">Super authority</p>
            <h3>{summary.approvalCount ? `${summary.approvalCount} approvals need you` : "You're all caught up"}</h3>
            <p className="ap-hero__sub">
              Visible only to ADMIN and SUPERADMIN · updated {ago(data.generatedAt, true)}
            </p>
            <Button variant="ghost" size="sm" icon={RefreshCw} loading={isFetching} onClick={refetch} className="ap-hero__refresh">
              Refresh
            </Button>
          </div>
        </div>
        <div className="ap-hero__figures">
          <div><strong className="tabular">{summary.approvalCount}</strong><span>approvals · {inr(summary.approvalValue)}</span></div>
          <div className={summary.overdue?.count ? "is-bad" : ""}>
            <strong className="tabular">{inr(summary.overdue?.value || 0)}</strong><span>client payments overdue</span>
          </div>
        </div>
      </section>

      <Card
        title={<span className="ap-private-title"><Lock aria-hidden /> Only you can see this</span>}
        subtitle="Margins, who has access and what was approved or changed — hidden from every other role."
        actions={<Tabs value={privateTab} onChange={setPrivateTab} options={PRIVATE_TABS} />}
      >
        {privateTab === "money" && <MoneyView money={data.money} onOpen={onOpen} />}
        {privateTab === "access" && <AccessView access={data.access} onOpen={onOpen} />}
        {privateTab === "audit" && <AuditView access={data.access} />}
      </Card>
    </div>
  );
}
