// RFIs — site queries routed to a team, answered and closed. All projects by default; ?project=<uuid> filters.
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageSquareWarning, Plus, Clock3, CheckCircle2, AlertTriangle, Eye, Send, ArrowRightLeft, XCircle } from "lucide-react";
import {
  Page, PageHeader, Card, Button, Stats, StatTile, Tabs, SearchInput, Field, SelectInput, TextInput, TextArea,
  Pill, EmptyState, Toolbar, ToolbarSpacer,
} from "@/components/inos";
import { Modal } from "@/components/projects/_projects-ui";
import { useAuth } from "@/context/AuthContext";
import {
  useListRfisQuery, useRaiseRfiMutation, useRerouteRfiMutation, useRespondToRfiMutation, useCloseRfiMutation,
} from "@/api/procuerment/site-ops.api";
import { useSiteProjects, useProjectParam, ProjectPicker, rowProjectName, useTradeTeams } from "./siteProjects";

const PRIORITY_TONE = { URGENT: "bad", HIGH: "peach", NORMAL: "info", LOW: "mute" };
const STATUS_LABEL = { OPEN: "Open", ANSWERED: "Answered", CLOSED: "Closed" };
const STATUS_TONE = { OPEN: "warn", ANSWERED: "info", CLOSED: "mute" };
const cap = (s) => (s ? s[0] + s.slice(1).toLowerCase() : "—");
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const rfiNo = (r) => `RFI-${String(r.rfiNumber || r.id).padStart(3, "0")}`;
const errMsg = (e) => {
  const m = e?.data?.message;
  return Array.isArray(m) ? m.join(", ") : m || "Something went wrong";
};


const EMPTY = { projectId: "", subject: "", query: "", priority: "NORMAL", routedToTeamId: "", raisedBy: "" };

export default function RfisPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useProjectParam();
  const { projects, nameOf } = useSiteProjects();
  const teams = useTradeTeams();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [view, setView] = useState(null);
  const [respond, setRespond] = useState(null);
  const [response, setResponse] = useState("");
  const [reroute, setReroute] = useState(null);
  const [teamId, setTeamId] = useState("");
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [tried, setTried] = useState(false);

  const { data, isLoading, isError } = useListRfisQuery({ projectId });
  const [raiseRfi, raiseState] = useRaiseRfiMutation();
  const [respondToRfi, respondState] = useRespondToRfiMutation();
  const [rerouteRfi, rerouteState] = useRerouteRfiMutation();
  const [closeRfi] = useCloseRfiMutation();

  const rfis = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const teamName = (r) => r.routedToTeamName || r.team?.name || teams.find((t) => String(t.id) === String(r.routedToTeamId))?.name || "—";

  const counts = useMemo(() => ({
    all: rfis.length,
    open: rfis.filter((r) => r.status === "OPEN").length,
    answered: rfis.filter((r) => r.status === "ANSWERED").length,
    closed: rfis.filter((r) => r.status === "CLOSED").length,
    urgent: rfis.filter((r) => ["URGENT", "HIGH"].includes(r.priority) && r.status !== "CLOSED").length,
  }), [rfis]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rfis.filter((r) => {
      if (tab !== "all" && r.status !== tab.toUpperCase()) return false;
      if (priority && r.priority !== priority) return false;
      if (!term) return true;
      return [rfiNo(r), r.subject, r.query, r.raisedBy, r.routedToTeamName, rowProjectName(r, nameOf)].join(" ").toLowerCase().includes(term);
    });
  }, [rfis, tab, priority, q, nameOf]);

  const openRaise = () => {
    setForm({ ...EMPTY, projectId: projectId || "", raisedBy: user?.name || "", routedToTeamId: "9" });
    setTried(false);
    setRaiseOpen(true);
  };
  const invalid = { projectId: !form.projectId, subject: !form.subject.trim(), query: !form.query.trim(), routedToTeamId: !form.routedToTeamId, raisedBy: !form.raisedBy.trim() };
  const submitRaise = async () => {
    setTried(true);
    if (Object.values(invalid).some(Boolean)) return;
    try {
      await raiseRfi({ ...form, subject: form.subject.trim(), query: form.query.trim(), raisedBy: form.raisedBy.trim(), routedToTeamId: Number(form.routedToTeamId) }).unwrap();
      toast.success("RFI raised");
      setRaiseOpen(false);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const submitRespond = async () => {
    if (!response.trim()) return;
    try {
      await respondToRfi({ id: respond.id, response: response.trim(), respondedBy: user?.name || "Architect" }).unwrap();
      toast.success("Response recorded");
      setRespond(null);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const submitReroute = async () => {
    if (!teamId) return;
    try {
      await rerouteRfi({ id: reroute.id, routedToTeamId: Number(teamId) }).unwrap();
      toast.success("RFI re-routed");
      setReroute(null);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const doClose = async (r) => {
    try {
      await closeRfi(r.id).unwrap();
      toast.success(`${rfiNo(r)} closed`);
      setView(null);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Site Operations", to: "/site-operations" }, { label: "RFIs" }]}
        title="Requests for information"
        subtitle="Site queries routed to the right team, answered and closed out."
        actions={<Button variant="primary" icon={Plus} onClick={openRaise}>Raise RFI</Button>}
      />

      <Stats>
        <StatTile label="Open" value={counts.open} meta="Awaiting a response" icon={<Clock3 />} tone="warn" active={tab === "open"} onClick={() => setTab("open")} />
        <StatTile label="Answered" value={counts.answered} meta="Response given, not closed" icon={<Send />} tone="info" active={tab === "answered"} onClick={() => setTab("answered")} />
        <StatTile label="Urgent / high" value={counts.urgent} meta="Not yet closed" icon={<AlertTriangle />} tone={counts.urgent ? "bad" : undefined} />
        <StatTile label="Closed" value={counts.closed} meta={`${counts.all} RFIs in total`} icon={<CheckCircle2 />} tone="ok" active={tab === "closed"} onClick={() => setTab("closed")} />
      </Stats>

      <Card flush>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <Toolbar>
            <div style={{ width: 240 }}><ProjectPicker value={projectId} onChange={setProjectId} projects={projects} /></div>
            <Tabs value={tab} onChange={setTab} options={[
              { value: "all", label: "All", count: counts.all },
              { value: "open", label: "Open", count: counts.open },
              { value: "answered", label: "Answered", count: counts.answered },
              { value: "closed", label: "Closed", count: counts.closed },
            ]} />
            <ToolbarSpacer />
            <SelectInput value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority" style={{ width: 150 }}>
              <option value="">All priorities</option>
              {["URGENT", "HIGH", "NORMAL", "LOW"].map((p) => <option key={p} value={p}>{cap(p)}</option>)}
            </SelectInput>
            <div style={{ width: 240 }}><SearchInput value={q} onChange={setQ} placeholder="Search RFIs…" /></div>
          </Toolbar>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, color: "var(--text-3)" }}>Loading RFIs…</div>
        ) : isError ? (
          <EmptyState icon={XCircle} title="Couldn't load RFIs" text="Please refresh the page." />
        ) : !rows.length ? (
          <EmptyState icon={MessageSquareWarning} title="No RFIs" text={rfis.length ? "Nothing matches these filters." : projectId ? `No RFIs raised for ${nameOf(projectId)} yet.` : "No RFIs raised yet."}
            action={<Button variant="primary" icon={Plus} onClick={openRaise}>Raise RFI</Button>} />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr><th>RFI</th><th>Subject</th><th>Project</th><th>Priority</th><th>Status</th><th>Routed to</th><th>Raised</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setView(r)}>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{rfiNo(r)}</td>
                    <td style={{ maxWidth: 320 }}><div style={{ fontWeight: 550, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subject}</div></td>
                    <td style={{ whiteSpace: "nowrap" }}>{rowProjectName(r, nameOf)}</td>
                    <td><Pill tone={PRIORITY_TONE[r.priority] || "mute"} size="sm">{cap(r.priority)}</Pill></td>
                    <td><Pill tone={STATUS_TONE[r.status] || "mute"} size="sm">{STATUS_LABEL[r.status] || r.status}</Pill></td>
                    <td style={{ whiteSpace: "nowrap" }}>{teamName(r)}</td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-3)" }}>{fmt(r.raisedAt)}<div style={{ fontSize: 12 }}>{r.raisedBy}</div></td>
                    <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      <Button variant="ghost" size="sm" icon={Eye} aria-label="View" title="View" onClick={() => setView(r)} />
                      {r.status === "OPEN" && <Button variant="ghost" size="sm" icon={Send} aria-label="Respond" title="Respond" onClick={() => { setRespond(r); setResponse(r.response || ""); }} />}
                      {r.status !== "CLOSED" && <Button variant="ghost" size="sm" icon={ArrowRightLeft} aria-label="Re-route" title="Re-route" onClick={() => { setReroute(r); setTeamId(String(r.routedToTeamId || "")); }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!view} onClose={() => setView(null)} width={620} title={view ? `${rfiNo(view)} · ${view.subject}` : ""}
        description={view ? `${rowProjectName(view, nameOf)} · raised by ${view.raisedBy} on ${fmt(view.raisedAt)}` : ""}
        footer={view && (
          <>
            {view.status !== "CLOSED" && <Button variant="secondary" onClick={() => doClose(view)}>Close RFI</Button>}
            {view.status === "OPEN" && <Button variant="primary" icon={Send} onClick={() => { setRespond(view); setResponse(""); setView(null); }}>Respond</Button>}
          </>
        )}>
        {view && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill tone={STATUS_TONE[view.status]}>{STATUS_LABEL[view.status] || view.status}</Pill>
              <Pill tone={PRIORITY_TONE[view.priority]}>{cap(view.priority)} priority</Pill>
              <Pill tone="brand" dot={false}>Routed to {teamName(view)}</Pill>
            </div>
            <Field label="Query"><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{view.query}</p></Field>
            <Field label="Response">
              {view.response ? (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{view.response}<br /><span style={{ color: "var(--text-3)", fontSize: 12 }}>{view.respondedBy} · {fmt(view.respondedAt)}</span></p>
              ) : <span style={{ color: "var(--text-3)" }}>No response yet</span>}
            </Field>
          </div>
        )}
      </Modal>

      <Modal open={!!respond} onClose={() => setRespond(null)} title={respond ? `Respond to ${rfiNo(respond)}` : ""} description={respond?.subject} width={560}
        footer={<><Button onClick={() => setRespond(null)}>Cancel</Button><Button variant="primary" loading={respondState.isLoading} disabled={!response.trim()} onClick={submitRespond}>Save response</Button></>}>
        {respond && (
          <div style={{ display: "grid", gap: 12 }}>
            <p style={{ margin: 0, color: "var(--text-2)" }}>{respond.query}</p>
            <Field label="Response" required><TextArea rows={5} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Instruction or clarification for site" /></Field>
          </div>
        )}
      </Modal>

      <Modal open={!!reroute} onClose={() => setReroute(null)} title={reroute ? `Re-route ${rfiNo(reroute)}` : ""} description={reroute?.subject}
        footer={<><Button onClick={() => setReroute(null)}>Cancel</Button><Button variant="primary" loading={rerouteState.isLoading} disabled={!teamId} onClick={submitReroute}>Re-route</Button></>}>
        <Field label="Route to team" required>
          <SelectInput value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="Select a team">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </SelectInput>
        </Field>
      </Modal>

      <Modal open={raiseOpen} onClose={() => setRaiseOpen(false)} title="Raise an RFI" description="Ask the design team (or a trade) for a clarification needed on site." width={640} testId="rfi-raise"
        footer={<><Button onClick={() => setRaiseOpen(false)}>Cancel</Button><Button variant="primary" loading={raiseState.isLoading} onClick={submitRaise}>Raise RFI</Button></>}>
        <div className="inos-form-grid">
          <Field label="Project" required full error={tried && invalid.projectId ? "Pick the project" : null}>
            <ProjectPicker value={form.projectId} onChange={(v) => setForm((f) => ({ ...f, projectId: v }))} placeholder="Select a project" projects={projects} invalid={tried && invalid.projectId} />
          </Field>
          <Field label="Subject" required full error={tried && invalid.subject ? "Add a short subject" : null}>
            <TextInput value={form.subject} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. Skirting detail at marble-to-wood transition" invalid={tried && invalid.subject} />
          </Field>
          <Field label="Query" required full error={tried && invalid.query ? "Describe the question" : null}>
            <TextArea rows={4} value={form.query} onChange={(e) => setForm((f) => ({ ...f, query: e.target.value }))} placeholder="What is unclear, where, and which drawing it refers to" invalid={tried && invalid.query} />
          </Field>
          <Field label="Route to" required error={tried && invalid.routedToTeamId ? "Pick a team" : null}>
            <SelectInput value={form.routedToTeamId} onChange={(e) => setForm((f) => ({ ...f, routedToTeamId: e.target.value }))} placeholder="Select a team">
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Priority">
            <SelectInput value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => <option key={p} value={p}>{cap(p)}</option>)}
            </SelectInput>
          </Field>
          <Field label="Raised by" required full error={tried && invalid.raisedBy ? "Who is asking?" : null}>
            <TextInput value={form.raisedBy} onChange={(e) => setForm((f) => ({ ...f, raisedBy: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </Page>
  );
}
