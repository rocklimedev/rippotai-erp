import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  FolderOpen,
  GitCommitHorizontal,
  IndianRupee,
  ListChecks,
  Package,
  Pencil,
  RefreshCw,
  Share2,
  Activity,
  Users,
  LayoutDashboard,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { fmtINR, relativeTime } from "@/lib/format";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Stats,
  StatTile,
  Tabs,
  Pill,
  StatusPill,
  EmptyState,
  Progress,
  Field,
  TextInput,
  ChoiceGroup,
  prettyStatus,
} from "@/components/inos";
import {
  PhaseTrack,
  PhaseLegend,
  Skeleton,
  Modal,
  formatDate,
  normalizeTreePhases,
  normalizeWorkspacePhases,
  normalizeCommandCenterPhases,
  commandCenterProgress,
  phaseProgress,
} from "@/components/projects/_projects-ui";
import { useGetProjectPhasesQuery as useGetCommandCenterPhasesQuery } from "@/api/projects/command-center.api";
import ProjectTemplatesPanel from "@/components/project-templates/ProjectTemplatesPanel";

import { useGetProjectByIdQuery } from "../../api/projects/project.api";
import { useGetBoqsQuery } from "../../api/boq/boq.api";
import { useGetQuotationsQuery } from "../../api/procuerment/quotation.api";
import {
  useGetDocumentsQuery,
  useUpdateDocumentMutation,
  useGetProjectDocumentPhaseTreeQuery,
} from "../../api/documents/document.api";
import ProjectDrawingsPanel from "../design-studio/ProjectDrawingsPanel";

const WORK_BUCKETS = [
  ["delayed", "Delayed", "bad"],
  ["due_today", "Due today", "warn"],
  ["due_this_week", "Due this week", "info"],
  ["awaiting_approval", "Awaiting approval", "warn"],
  ["awaiting_client", "Awaiting client", "lilac"],
  ["blocked", "Blocked", "bad"],
  ["upcoming", "Upcoming", "mute"],
];

const SHARE_PURPOSES = [
  { value: "project_view", label: "Project view" },
  { value: "boq_approval", label: "BOQ approval" },
  { value: "quotation_selection", label: "Quotation selection" },
  { value: "handover_acceptance", label: "Handover acceptance" },
];

const asArray = (v) => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : []);
const isMissingDoc = (doc) => doc.status === "MISSING" || doc.required_missing;

/* ============================================================
   SECTIONS
============================================================ */

function ActionRequired({ work, docs, onOpenDocuments }) {
  const items = [
    ...(work.delayed || []).map((item) => ({ ...item, type: "Delayed", tone: "bad" })),
    ...(work.blocked || []).map((item) => ({ ...item, type: "Blocked", tone: "bad" })),
    ...(work.awaiting_approval || []).map((item) => ({ ...item, type: "Approval", tone: "warn" })),
    ...(work.awaiting_client || []).map((item) => ({ ...item, type: "Client", tone: "lilac" })),
  ].slice(0, 7);
  const missingDocs = docs.filter(isMissingDoc);
  const count = items.length + missingDocs.length;

  return (
    <Card
      flush
      title="Action required"
      subtitle="Items that can hold up this project"
      actions={count ? <Pill tone="bad">{count} open</Pill> : <Pill tone="ok">All clear</Pill>}
    >
      {count === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing blocking" text="No blockers, pending approvals or missing documents right now." />
      ) : (
        <div className="pj-list">
          {items.map((item, index) => (
            <div className="pj-list-item" key={item.id || `${item.type}-${index}`}>
              <Pill tone={item.tone} size="sm">
                {item.type}
              </Pill>
              <div className="pj-list-item__main">
                <div className="pj-list-item__title">{item.title || item.name || item.description}</div>
                <div className="pj-list-item__sub">
                  {item.assignee ? `${item.assignee} · ` : ""}
                  {item.due_date ? `Due ${formatDate(item.due_date)}` : "Requires attention"}
                </div>
              </div>
            </div>
          ))}
          {missingDocs.slice(0, 3).map((doc) => (
            <button type="button" key={doc.id} onClick={onOpenDocuments} className="pj-list-item">
              <Pill tone="bad" size="sm">
                Missing
              </Pill>
              <div className="pj-list-item__main">
                <div className="pj-list-item__title">{doc.name}</div>
                <div className="pj-list-item__sub">Required document not uploaded</div>
              </div>
              <ArrowRight size={15} className="pj-muted" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function WorkloadSnapshot({ work }) {
  return (
    <Card flush title="Work & commitments" subtitle="Current workload by urgency">
      <div className="pj-figures pj-figures--end">
        {WORK_BUCKETS.map(([key, label, tone]) => {
          const count = work[key]?.length || 0;
          return (
            <div className="pj-figure" key={key}>
              <div className="pj-figure__value" style={count && tone !== "mute" ? { color: `var(--${tone}-fg)` } : undefined}>
                {count}
              </div>
              <div className="pj-figure__label">{label}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DocumentsPanel({ docs, loading, onToggleVisibility, onOpenAll, limit }) {
  const clientVisible = docs.filter((doc) => !!doc.client_visible).length;
  const missing = docs.filter(isMissingDoc).length;
  const list = limit ? docs.slice(0, limit) : docs;

  return (
    <Card
      flush
      title="Document control"
      subtitle="Project evidence and what the client can see"
      actions={
        <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={onOpenAll}>
          Checklist
        </Button>
      }
    >
      <div className="pj-figures">
        <div className="pj-figure">
          <div className="pj-figure__value">{docs.length}</div>
          <div className="pj-figure__label">Uploaded</div>
        </div>
        <div className="pj-figure">
          <div className="pj-figure__value" style={clientVisible ? { color: "var(--ok-fg)" } : undefined}>
            {clientVisible}
          </div>
          <div className="pj-figure__label">Client-visible</div>
        </div>
        <div className="pj-figure">
          <div className="pj-figure__value" style={missing ? { color: "var(--bad-fg)" } : undefined}>
            {missing}
          </div>
          <div className="pj-figure__label">Missing</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, display: "grid", gap: 8 }}>
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          text="Upload drawings, approvals and site records from the document checklist."
          action={
            <Button variant="soft" size="sm" onClick={onOpenAll}>
              Open checklist
            </Button>
          }
        />
      ) : (
        <div className="pj-list">
          {list.map((doc) => (
            <div key={doc.id} className="pj-list-item">
              <span className="inos-icon-tile inos-icon-tile--sm">
                <FileText aria-hidden />
              </span>
              <div className="pj-list-item__main">
                <div className="pj-list-item__title">{doc.name || doc.title}</div>
                <div className="pj-list-item__sub">
                  {doc.category || "Document"} · {doc.uploaded_by || "—"}
                </div>
              </div>
              <label className="pj-check" title="Visible to client">
                <input type="checkbox" checked={!!doc.client_visible} onChange={(e) => onToggleVisibility(doc.id, e.target.checked)} />
                Client
              </label>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CommercialFigures({ financial, boqs, quotes, vendors, onOpenBoq, onOpenQuotes }) {
  const variation = financial?.cost_variation_pct;
  return (
    <Card flush title="Commercial & procurement" subtitle="BOQ, quotations, commitments and engaged vendors">
      <div className="pj-figures">
        {[
          ["Approved BOQ", financial ? fmtINR(financial.approved_boq_estimate || 0) : "—"],
          ["Committed", financial ? fmtINR(financial.committed_cost || 0) : "—"],
          ["Projected final", financial ? fmtINR(financial.projected_final_cost || 0) : "—"],
          ["Variation", variation == null ? "—" : `${variation > 0 ? "+" : ""}${variation}%`],
        ].map(([label, value]) => (
          <div className="pj-figure" key={label}>
            <div className="pj-figure__value" style={{ fontSize: 17 }}>
              {value}
            </div>
            <div className="pj-figure__label">{label}</div>
          </div>
        ))}
      </div>
      <div className="pj-list">
        <button type="button" className="pj-list-item" onClick={onOpenBoq}>
          <span className="inos-icon-tile inos-icon-tile--sm">
            <ListChecks aria-hidden />
          </span>
          <div className="pj-list-item__main">
            <div className="pj-list-item__title">BOQ versions</div>
          </div>
          <span className="pj-list-item__end">{boqs.length}</span>
          <ArrowRight size={15} className="pj-muted" aria-hidden />
        </button>
        <button type="button" className="pj-list-item" onClick={onOpenQuotes}>
          <span className="inos-icon-tile inos-icon-tile--sm inos-icon-tile--info">
            <Receipt aria-hidden />
          </span>
          <div className="pj-list-item__main">
            <div className="pj-list-item__title">Quotations</div>
          </div>
          <span className="pj-list-item__end">{quotes.length}</span>
          <ArrowRight size={15} className="pj-muted" aria-hidden />
        </button>
        <div className="pj-list-item">
          <span className="inos-icon-tile inos-icon-tile--sm inos-icon-tile--lilac">
            <Users aria-hidden />
          </span>
          <div className="pj-list-item__main">
            <div className="pj-list-item__title">Engaged vendors</div>
          </div>
          <span className="pj-list-item__end">{vendors.engaged?.length || 0}</span>
        </div>
      </div>
    </Card>
  );
}

function BoqList({ boqs, loading, onViewAll }) {
  return (
    <Card
      flush
      title="BOQ versions"
      subtitle="Budget and costing history"
      actions={
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={onViewAll}>
          View all
        </Button>
      }
    >
      {loading ? (
        <div style={{ padding: 20 }}>
          <Skeleton height={40} />
        </div>
      ) : boqs.length === 0 ? (
        <EmptyState icon={ListChecks} title="No BOQs yet" text="Bills of quantities for this project will be listed here." />
      ) : (
        <div className="pj-list">
          {boqs.slice(0, 5).map((boq) => (
            <Link key={boq.id} to={`/ledger/boq/${boq.id}`} className="pj-list-item">
              <div className="pj-list-item__main">
                <div className="pj-list-item__title">BOQ v{boq.version}</div>
                <div className="pj-list-item__sub">{relativeTime(boq.updated_at || boq.created_at)}</div>
              </div>
              <StatusPill status={boq.status} size="sm" />
              <span className="pj-list-item__end">{fmtINR(boq.total_amount || 0)}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function QuoteList({ quotes, loading, onViewAll }) {
  return (
    <Card
      flush
      title="Quotations"
      subtitle="Vendor estimates and selection"
      actions={
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={onViewAll}>
          View all
        </Button>
      }
    >
      {loading ? (
        <div style={{ padding: 20 }}>
          <Skeleton height={40} />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState icon={Receipt} title="No quotations yet" text="Vendor quotations linked to this project will be listed here." />
      ) : (
        <div className="pj-list">
          {quotes.slice(0, 5).map((quote) => (
            <Link key={quote.id} to={`/procurement/estimates/${quote.id}`} className="pj-list-item">
              <div className="pj-list-item__main">
                <div className="pj-list-item__title">
                  {quote.quotationNumber || quote.quotation_number || "Quotation"} · {quote.vendor?.name || quote.vendor_name || "Vendor"}
                </div>
                <div className="pj-list-item__sub">{quote.vendor?.vendorCategory?.name || quote.work_category || "—"}</div>
              </div>
              {quote.status && <StatusPill status={quote.status} size="sm" />}
              <span className="pj-list-item__end">
                {fmtINR(quote.totalAmount || quote.subtotal || quote.subtotals?.total || 0)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentActivity({ rows, limit }) {
  const list = limit ? rows.slice(0, limit) : rows;
  return (
    <Card flush title="Recent activity" subtitle="Latest changes on this project">
      {rows.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" text="Uploads, approvals and edits on this project will show up here." />
      ) : (
        <div className="pj-list">
          {list.map((row, index) => (
            <div key={row.id || index} className="pj-list-item">
              <span className="inos-icon-tile inos-icon-tile--sm">
                <RefreshCw aria-hidden />
              </span>
              <div className="pj-list-item__main">
                <div className="pj-list-item__title" style={{ fontWeight: 550 }}>
                  {row.description || row.action}
                </div>
                <div className="pj-list-item__sub">
                  {row.actor || row.user || "—"} · {relativeTime(row.at || row.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PhasesCard({ phases, progress, detailed }) {
  return (
    <Card
      title="Phases"
      subtitle={
        progress.total
          ? `${progress.done} of ${progress.total} phases completed${progress.current ? ` · now in ${progress.current.name}` : ""}`
          : "Delivery phases for this project"
      }
      actions={progress.total ? <PhaseLegend /> : null}
    >
      {!phases.length ? (
        <EmptyState icon={GitCommitHorizontal} title="Phases not configured" text="Once phases are set up in the Admin Console, progress will show here." />
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <Progress value={progress.percent} />
            </div>
            <span className="tabular" style={{ fontWeight: 700, fontSize: 15 }}>
              {progress.percent}%
            </span>
          </div>
          <PhaseTrack phases={phases} />
          {detailed && (
            <div className="inos-table-wrap" style={{ margin: "0 -20px -20px", borderTop: "1px solid var(--line)" }}>
              <table className="inos-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Phase</th>
                    <th>Status</th>
                    <th className="num">Documents</th>
                    <th>Next up</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((p, i) => (
                    <tr key={p.id}>
                      <td className="muted tabular">{String(i + 1).padStart(2, "0")}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <Pill tone={p.status === "done" ? "ok" : p.status === "current" ? "brand" : "mute"} size="sm">
                          {p.status === "done" ? "Completed" : p.status === "current" ? "In progress" : "Upcoming"}
                        </Pill>
                      </td>
                      <td className="num">
                        {p.docCounts ? (
                          p.docCounts.total ? (
                            `${p.docCounts.uploaded}/${p.docCounts.total}`
                          ) : (
                            <span className="muted">None set</span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="muted">{p.pendingDocumentName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

const PURPOSE_LABEL = Object.fromEntries(SHARE_PURPOSES.map((p) => [p.value, p.label]));

/** Existing links for the project — copy again or revoke. */
function ClientLinksList({ projectId, refreshKey, onCopy }) {
  const [links, setLinks] = useState(null);
  const load = () =>
    api
      .get(`/v1/client-links`, { params: { project_id: projectId } })
      .then((r) => setLinks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLinks([]));
  useEffect(() => {
    if (projectId) load();
  }, [projectId, refreshKey]); // eslint-disable-line
  const revoke = async (id) => {
    try {
      await api.post(`/v1/client-links/${id}/revoke`);
      toast.success("Link revoked — it no longer opens");
      load();
    } catch {
      toast.error("Couldn't revoke the link");
    }
  };
  const active = (links || []).filter((l) => l.state === "active");
  if (!active.length) return null;
  return (
    <Field label={`Active links (${active.length})`}>
      <div style={{ display: "grid", gap: 8 }}>
        {active.slice(0, 5).map((l) => (
          <div key={l.id} className="inos-card inos-card--inset" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{PURPOSE_LABEL[l.purpose] || l.purpose}</div>
              <div className="pj-muted" style={{ fontSize: 12 }}>
                {l.client_name || l.client_email || "Client"} · expires {new Date(l.expires_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                {l.open_count ? ` · opened ${l.open_count}×` : " · not opened yet"}
              </div>
            </div>
            {l.url && (
              <Button variant="ghost" size="sm" icon={Copy} onClick={() => onCopy(l.url)}>
                Copy
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => revoke(l.id)}>
              Revoke
            </Button>
          </div>
        ))}
      </div>
    </Field>
  );
}

function ShareClientModal({ open, onClose, form, setForm, createdLink, onCreate, onCopy, onDone, projectId }) {
  const [creating, setCreating] = useState(false);
  const create = async () => {
    setCreating(true);
    try {
      await onCreate();
    } finally {
      setCreating(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share with client"
      description="Generate a controlled, read-only link for this project. Links expire after 30 days."
      width={520}
      footer={
        !createdLink ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" icon={Share2} onClick={create} loading={creating}>
              Create link
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" icon={Copy} onClick={() => onCopy(createdLink.url)}>
              Copy
            </Button>
            <a href={createdLink.url} target="_blank" rel="noreferrer" className="inos-btn inos-btn--secondary">
              <ExternalLink aria-hidden />
              <span>Open</span>
            </a>
            <Button variant="primary" onClick={onDone}>
              Done
            </Button>
          </>
        )
      }
    >
      {!createdLink ? (
        <>
          <Field label="Purpose">
            <div className="pj-choices-2">
            <ChoiceGroup
              name="Purpose"
              value={form.purpose}
              onChange={(purpose) => setForm((current) => ({ ...current, purpose }))}
              options={SHARE_PURPOSES}
            />
            </div>
          </Field>
          <div className="inos-form-grid">
            <Field label="Client name">
              <TextInput
                value={form.client_name}
                onChange={(e) => setForm((current) => ({ ...current, client_name: e.target.value }))}
                placeholder="e.g. Sagar Mehta"
              />
            </Field>
            <Field label="Client email">
              <TextInput
                type="email"
                value={form.client_email}
                onChange={(e) => setForm((current) => ({ ...current, client_email: e.target.value }))}
                placeholder="name@company.com"
              />
            </Field>
          </div>
          <ClientLinksList projectId={projectId} refreshKey={open} onCopy={onCopy} />
          <Field label="The client can see">
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["show_rates", "Rates on the BOQ"],
                ["show_vendor_names", "Vendor names"],
                ["show_ratings", "Vendor ratings"],
              ].map(([key, label]) => (
                <label key={key} className="pj-check">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>
        </>
      ) : (
        <>
          <Pill tone="ok">Link generated</Pill>
          <div className="inos-card inos-card--inset" style={{ padding: 12, fontSize: 13, color: "var(--text-2)", overflowWrap: "anywhere" }}>
            {createdLink.url}
          </div>
        </>
      )}
    </Modal>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ProjectWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");

  const { data: projectData, isLoading, error, refetch: refetchProject } = useGetProjectByIdQuery(id, { skip: !id });

  const { data: boqsRaw = [], isFetching: boqsLoading, refetch: refetchBoqs } = useGetBoqsQuery({ project_id: id }, { skip: !id });

  const { data: docsRaw = [], isFetching: docsLoading, refetch: refetchDocs } = useGetDocumentsQuery({ project_id: id }, { skip: !id });

  const [updateDocument] = useUpdateDocumentMutation();

  const {
    data: quotesRaw = [],
    isFetching: quotesLoading,
    refetch: refetchQuotes,
  } = useGetQuotationsQuery({ project_id: id }, { skip: !id });

  // Phase + progress come from the Command Center rollup (same numbers as the Command Center);
  // the document phase tree is only a fallback if that call fails.
  const { data: ccPhases, isError: ccError } = useGetCommandCenterPhasesQuery(id, { skip: !id });
  const { data: phaseTree } = useGetProjectDocumentPhaseTreeQuery(undefined, { skip: !id || !ccError });

  const boqs = asArray(boqsRaw);
  const docs = asArray(docsRaw);
  const quotesFromApi = asArray(quotesRaw);
  const quotes = quotesFromApi.length > 0 ? quotesFromApi : projectData?.quotations || [];

  const [phaseData, setPhaseData] = useState(null);
  const [work, setWork] = useState({});
  const [vendors, setVendors] = useState({ engaged: [], attached: [] });
  const [financial, setFinancial] = useState(null);
  const [activityRows, setActivityRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [shareModal, setShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    purpose: "project_view",
    client_email: "",
    client_name: "",
    show_rates: true,
    show_vendor_names: true,
    show_ratings: true,
  });
  const [createdLink, setCreatedLink] = useState(null);

  const loadSupplementary = async () => {
    if (!id) return;
    const safe = (p, fallback) => p.then((r) => r ?? { data: fallback }).catch(() => ({ data: fallback }));

    // v1 rollups (ProjectOverviewController). Phase progress comes from the
    // document phase tree below — there is no /projects/:id/phases route.
    const [phase, wk, vd, fn, activity] = await Promise.all([
      Promise.resolve({ data: null }),
      safe(api.get(`/v1/projects/${id}/pending-work`), {}),
      safe(api.get(`/v1/projects/${id}/vendors`), { engaged: [], attached: [] }),
      safe(api.get(`/v1/projects/${id}/financial`), null),
      safe(api.get(`/v1/projects/${id}/activity?limit=50`), projectData?.recent_activity || []),
    ]);

    setPhaseData(phase?.data || null);
    setWork(wk?.data && typeof wk.data === "object" ? wk.data : {});
    setVendors(vd?.data || { engaged: [], attached: [] });
    setFinancial(fn?.data || null);
    setActivityRows(Array.isArray(activity?.data) ? activity.data : projectData?.recent_activity || []);
  };

  useEffect(() => {
    if (!id || !projectData) return;
    loadSupplementary();
    setShareForm((current) => ({
      ...current,
      client_email: projectData.client?.email || "",
      client_name: projectData.client?.name || projectData.client?.contact_person || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, projectData]);

  const toggleDocVisibility = async (docId, client_visible) => {
    try {
      await updateDocument({ id: docId, data: { client_visible } }).unwrap();
    } catch {
      toast.error("Failed to update document visibility");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchProject(), refetchBoqs(), refetchDocs(), refetchQuotes(), loadSupplementary()]);
      toast.success("Project dashboard refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const createLink = async () => {
    const payload = {
      project_id: id,
      purpose: shareForm.purpose,
      client_email: shareForm.client_email,
      client_name: shareForm.client_name,
      expires_days: 30,
      options: {
        show_rates: shareForm.show_rates,
        show_vendor_names: shareForm.show_vendor_names,
        show_ratings: shareForm.show_ratings,
      },
    };
    try {
      const { data } = await api.post("/v1/client-links", payload);
      setCreatedLink(data);
      toast.success("Client link created");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create client link");
    }
  };

  const copyUrl = async (url) => {
    await navigator.clipboard.writeText(url);
    toast.success("Copied");
  };

  /* -------------------------------------------------- phases */

  const phases = useMemo(() => {
    if (ccPhases?.phases?.length) return normalizeCommandCenterPhases(ccPhases);
    if (phaseData?.phases?.length) return normalizeWorkspacePhases(phaseData);
    const entries = Array.isArray(phaseTree?.projects) ? phaseTree.projects : [];
    const entry = entries.find((e) => String(e?.id) === String(id));
    return normalizeTreePhases(entry?.phases || []);
  }, [ccPhases, phaseData, phaseTree, id]);

  const progress = useMemo(() => {
    if (ccPhases?.phases?.length) return commandCenterProgress(ccPhases, phases);
    const base = phaseProgress(phases);
    if (phaseData?.progress_pct != null) return { ...base, percent: Math.round(Number(phaseData.progress_pct) || 0) };
    return base;
  }, [phases, phaseData, ccPhases]);

  const stats = useMemo(() => {
    const delayed = work.delayed?.length || 0;
    const blocked = work.blocked?.length || 0;
    const approvals = work.awaiting_approval?.length || 0;
    const missingDocs = docs.filter(isMissingDoc).length;
    return {
      openActions: delayed + blocked + approvals + missingDocs,
      docs: docs.length,
      quotes: quotes.length,
      vendors: vendors.engaged?.length || 0,
    };
  }, [work, docs, quotes, vendors]);

  /* -------------------------------------------------- states */

  if (isLoading) {
    return (
      <Page className="pj-page">
        <PageHeader crumbs={[{ label: "Projects", to: "/projects" }, { label: "Loading…" }]} title="Loading project…" />
        <Stats>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={104} />
          ))}
        </Stats>
        <Skeleton height={220} />
      </Page>
    );
  }

  if (error || !projectData) {
    return (
      <Page className="pj-page">
        <PageHeader crumbs={[{ label: "Projects", to: "/projects" }, { label: "Not found" }]} title="Project unavailable" />
        <Card>
          <EmptyState
            icon={FolderOpen}
            title="This project could not be loaded"
            text="It may have been deleted or you may not have access. Try again, or go back to all projects."
            action={
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="secondary" icon={RefreshCw} onClick={() => refetchProject()}>
                  Retry
                </Button>
                <Button variant="primary" onClick={() => nav("/projects")}>
                  All projects
                </Button>
              </div>
            }
          />
        </Card>
      </Page>
    );
  }

  const p = projectData;
  const projectStatus = p.status?.toLowerCase() || "active";
  const clientName = p.client?.name || p.client?.contact_person;
  const typeName = p.project_type?.name || (typeof p.project_type === "string" ? p.project_type : "");
  const openDocs = () => nav(`/projects/documents/all?project_id=${id}`);
  const openBoq = () => nav(`/ledger/boq/all?project=${id}`);
  const openQuotes = () => nav(`/procurement/estimates/all?project=${id}`);
  const activity = activityRows.length ? activityRows : p.recent_activity || [];

  const phaseLabel = progress.current?.name || (progress.total && progress.done === progress.total ? "Complete" : "Not started");

  return (
    <Page className="pj-page">
      <PageHeader
        crumbs={[{ label: "Projects", to: "/projects" }, { label: p.name }]}
        title={p.name}
        subtitle={[p.site_location || "No site location", clientName, typeName].filter(Boolean).join(" · ")}
        actions={
          <>
            <Button variant="ghost" icon={RefreshCw} onClick={handleRefresh} disabled={refreshing} aria-label="Refresh" title="Refresh" />
            <Button variant="secondary" icon={Pencil} onClick={() => nav(`/projects/${id}/edit`)}>
              Edit
            </Button>
            <Button variant="secondary" icon={Package} onClick={() => nav(`/projects/${id}/handover`)}>
              Handover
            </Button>
            <Button variant="primary" icon={Share2} onClick={() => setShareModal(true)}>
              Share with client
            </Button>
          </>
        }
      />

      <div className="pj-chip-row" style={{ marginTop: -12 }}>
        <StatusPill status={projectStatus} />
        {p.priority && (
          <Pill tone={p.priority === "CRITICAL" ? "bad" : p.priority === "HIGH" ? "peach" : "mute"} dot={false}>
            {prettyStatus(String(p.priority).toLowerCase())} priority
          </Pill>
        )}
        {p.expected_completion_date && (
          <Pill tone="mute" dot={false}>
            ECD {formatDate(p.expected_completion_date)}
          </Pill>
        )}
        {p.slug && <span className="pj-code">{p.slug}</span>}
      </div>

      <Stats>
        <StatTile
          label="Progress"
          value={`${progress.percent}%`}
          meta={progress.total ? `${progress.done} of ${progress.total} phases` : "Phases not configured"}
          icon={<GitCommitHorizontal />}
        />
        <StatTile label="Current phase" value={<span style={{ fontSize: 20 }}>{phaseLabel}</span>} meta={progress.current?.pendingDocumentName || (progress.currentNumber ? `Phase ${progress.currentNumber}` : "Nothing uploaded yet")} icon={<LayoutDashboard />} tone="info" />
        <StatTile
          label="Open actions"
          value={stats.openActions}
          meta="Blockers, approvals, missing docs"
          icon={<AlertCircle />}
          tone={stats.openActions ? "bad" : "ok"}
          onClick={() => setTab("overview")}
        />
        <StatTile label="Documents" value={stats.docs} meta={docsLoading ? "Refreshing…" : "Uploaded to this project"} icon={<FileText />} tone="lilac" onClick={() => setTab("documents")} />
        <StatTile
          label="Approved BOQ"
          value={financial ? fmtINR(financial.approved_boq_estimate || 0) : "—"}
          meta={`${boqs.length} BOQ version${boqs.length === 1 ? "" : "s"} · ${stats.quotes} quote${stats.quotes === 1 ? "" : "s"}`}
          icon={<IndianRupee />}
          tone="peach"
          onClick={() => setTab("commercial")}
        />
      </Stats>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Overview", icon: LayoutDashboard },
          { value: "phases", label: "Phases", icon: GitCommitHorizontal, count: progress.total || undefined },
          { value: "documents", label: "Documents", icon: FileText, count: docs.length },
          { value: "templates", label: "Templates", icon: FileText },
          { value: "drawings", label: "Drawings", icon: FolderOpen },
          { value: "commercial", label: "Commercial", icon: IndianRupee },
          { value: "activity", label: "Activity", icon: Activity },
        ]}
      />

      {tab === "overview" && (
        <>
          <PhasesCard phases={phases} progress={progress} />
          <div className="pj-two-col">
            <ActionRequired work={work} docs={docs} onOpenDocuments={openDocs} />
            <WorkloadSnapshot work={work} />
          </div>
          <div className="pj-two-col pj-two-col--even">
            <DocumentsPanel docs={docs} loading={docsLoading} onToggleVisibility={toggleDocVisibility} onOpenAll={openDocs} limit={5} />
            <RecentActivity rows={activity} limit={6} />
          </div>
          {p.description && (
            <Card title="Brief">
              <p style={{ margin: 0, color: "var(--text-2)" }}>{p.description}</p>
            </Card>
          )}
        </>
      )}

      {tab === "phases" && <PhasesCard phases={phases} progress={progress} detailed />}

      {tab === "documents" && (
        <DocumentsPanel docs={docs} loading={docsLoading} onToggleVisibility={toggleDocVisibility} onOpenAll={openDocs} />
      )}

      {tab === "drawings" && <ProjectDrawingsPanel projectId={id} />}
      {tab === "templates" && <ProjectTemplatesPanel key={id} project={p} />}

      {tab === "commercial" && (
        <>
          <CommercialFigures financial={financial} boqs={boqs} quotes={quotes} vendors={vendors} onOpenBoq={openBoq} onOpenQuotes={openQuotes} />
          <div className="pj-two-col pj-two-col--even">
            <BoqList boqs={boqs} loading={boqsLoading} onViewAll={openBoq} />
            <QuoteList quotes={quotes} loading={quotesLoading} onViewAll={openQuotes} />
          </div>
        </>
      )}

      {tab === "activity" && <RecentActivity rows={activity} />}

      <ShareClientModal
        open={shareModal}
        onClose={() => setShareModal(false)}
        form={shareForm}
        setForm={setShareForm}
        createdLink={createdLink}
        onCreate={createLink}
        onCopy={copyUrl}
        projectId={id}
        onDone={() => {
          setCreatedLink(null);
          setShareModal(false);
        }}
      />
    </Page>
  );
}
