import { useDispatch } from "react-redux";
import "./CommandCenter.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GateChecklist from "@/components/command-center/GateChecklist";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  CircleCheck,
  CloudOff,
  Clock3,
  Construction,
  FileCheck2,
  FileText,
  FolderSearch,
  History,
  IndianRupee,
  ListChecks,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";

import {
  Page,
  PageHeader,
  Card,
  Button,
  Stats,
  StatTile,
  SearchInput,
  Segmented,
  Tabs,
  Pill,
  EmptyState,
  Progress,
  Field,
  TextArea,
} from "@/components/inos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ------------------------------------------------------------
// LIVE API — every number on screen comes from CommandCenterService
// via command-center.api.js.
// ------------------------------------------------------------
import {
  commandCenterApi,
  useGetCommandCenterKpisQuery,
  useGetCommandCenterPortfolioQuery,
  useGetProjectPhaseDetailQuery,
  useGetCommandCenterActionsQuery,
  useGetCommandCenterDocumentsQuery,
  useUploadCommandCenterDocumentMutation,
  useCompleteCommandCenterTaskMutation,
  useGetCommandCenterCommercialQuery,
  useGetCommandCenterTeamWorkloadQuery,
  useGetCommandCenterActivityQuery,
  useGetCommandCenterTasksQuery,
} from "../api/projects/command-center.api";

// ------------------------------------------------------------
// ROUTES — deep links into the canonical modules (unchanged)
// ------------------------------------------------------------

const ROUTES = {
  projects: "/projects",
  project: (id) => `/projects/${id}`,
  boq: "/ledger/boq/all",
  tasks: "/tasks/all",
  taskProject: (id) => `/tasks/all?project=${encodeURIComponent(id)}`,
  documents: "/projects/documents/all",
  documentsProject: (id) =>
    `/projects/documents/all?project_id=${encodeURIComponent(id)}`,
  procurement: "/procurement",
  calendar: "/calendar",
};

const REFRESH_TAGS = [
  "CommandCenterKpis", "CommandCenterPortfolio", "CommandCenterProjectPhases",
  "CommandCenterActions", "CommandCenterDocuments", "CommandCenterTasks",
  "CommandCenterCommercial", "CommandCenterTeamWorkload", "CommandCenterActivity",
  "CommandCenterGates",
];

// The backend's team-workload rollup only returns { role, count }.
// Local role -> display name map purely for presentation.
const PEOPLE_BY_ROLE = {};

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatINR = (value) => {
  const n = Number(value || 0);
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} L`;
  return `₹ ${n.toLocaleString("en-IN")}`;
};

// Backend enum values may arrive as "AWAITING_GATE", "Awaiting Gate",
// "awaiting-gate"… normalise to one SCREAMING_SNAKE key.
const normalizeKey = (v) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const sentence = (v) => {
  const s = String(v ?? "").replace(/_/g, " ").trim().toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
};

function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function timeAgo(dateLike) {
  if (!dateLike) return "";
  const then = new Date(dateLike).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// Turns an ActivityLog row into the {type, title, detail, time} shape
// ActivityTimeline renders.
function mapActivityLog(row) {
  const action = normalizeKey(row.action);
  const ICON_TYPE = {
    FILE_UPLOADED: "DOC",
    GATE_CLEARED: "GATE_APPROVED",
    GATE_REOPENED: "GATE_APPROVED",
    DOCUMENT_UPLOADED: "DOC",
    DOCUMENT_APPROVED: "DOC",
    DOCUMENT_REJECTED: "DOC",
    TASK_COMPLETED: "TASK",
    TASK_FAILED: "TASK",
    GATE_APPROVED: "GATE_APPROVED",
    GATE_OVERRIDDEN: "GATE_APPROVED",
  };
  const TITLE = {
    FILE_UPLOADED:
      row.changes?.status === "rejected"
        ? "Document rejected"
        : "Document updated",
    GATE_CLEARED: "Gate cleared",
    GATE_REOPENED: "Gate reopened",
    DOCUMENT_UPLOADED: "Document uploaded",
    DOCUMENT_APPROVED: "Document approved",
    DOCUMENT_REJECTED: "Document rejected",
    TASK_COMPLETED: "Task completed",
    TASK_FAILED: "Task failed QC",
    GATE_APPROVED: "Gate approved",
    GATE_OVERRIDDEN: "Gate force-approved",
  };
  return {
    type: ICON_TYPE[action] || (action.endsWith("_CREATED") ? "PROJECT_CREATED" : "SCAN"),
    title: TITLE[action] || sentence(action),
    detail: row.entity_label || row.user_email || "",
    time: timeAgo(row.created_at),
  };
}

// Phase state -> pastel tone (drives stepper dots, pills and legend)
const STATE_TONE = {
  COMPLETE: "ok",
  AWAITING_GATE: "info",
  IN_PROGRESS: "brand",
  STALLED: "peach",
  QC_FAILED: "bad",
  NOT_STARTED: "mute",
};
const stateTone = (state) => STATE_TONE[normalizeKey(state)] || "mute";
const stateLabel = (state) => sentence(normalizeKey(state));

const LEGEND = [
  ["COMPLETE", "Gate cleared"],
  ["AWAITING_GATE", "Awaiting approval"],
  ["IN_PROGRESS", "In progress"],
  ["STALLED", "Stalled"],
  ["QC_FAILED", "QC failed"],
  ["NOT_STARTED", "Not started"],
];

const HEALTH_TONE = {
  DANGER: "bad",
  GATE: "info",
  PROGRESS: "ok",
  COMPLETE: "brand",
};
const healthTone = (key) => HEALTH_TONE[normalizeKey(key)] || "ok";

// "01 BRIEF" -> "Brief", "A VENDOR TRADES" -> "A Vendor Trades"
const phaseTitle = (name) => {
  const raw = String(name ?? "").replace(/^\d+\s+/, "").trim();
  if (!raw || raw !== raw.toUpperCase()) return raw || String(name ?? "");
  return raw.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
};
const gateTitle = (code) => sentence(code);

const isDone = (s) => s === "DONE" || s === "Done";
const isFailed = (s) => s === "FAILED" || s === "Failed";

// ------------------------------------------------------------
// SMALL UI PIECES (local to this module)
// ------------------------------------------------------------

function Toast({ message }) {
  if (!message) return null;
  return (
    <div role="status" className="cc-toast">
      {message}
    </div>
  );
}

function LoadingRow({ label = "Loading…" }) {
  return (
    <div className="cc-loading" role="status">
      <Loader2 className="cc-spin" aria-hidden />
      {label}
    </div>
  );
}

function ErrorRow({ error, onRetry }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="Couldn't load this data"
      text={`The server didn't respond as expected${error?.status ? ` (HTTP ${error.status})` : ""}. Try again in a moment.`}
      action={
        onRetry && (
          <Button size="sm" icon={RefreshCw} onClick={onRetry}>
            Retry
          </Button>
        )
      }
    />
  );
}

/** Clickable list row used across the tab panels. */
function ListRow({ icon: Icon, tone, title, tag, sub, meta, right, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={cn("cc-row", onClick && "cc-row--link")}
      onClick={onClick}
    >
      {Icon && (
        <span className={cn("inos-icon-tile inos-icon-tile--sm", tone && `inos-icon-tile--${tone}`)}>
          <Icon aria-hidden />
        </span>
      )}
      <span className="cc-row__text">
        <span className="cc-row__title">
          <span className="cc-truncate">{title}</span>
          {tag}
        </span>
        {sub && <span className="cc-row__sub">{sub}</span>}
        {meta && <span className="cc-row__meta">{meta}</span>}
      </span>
      {right}
      {onClick && !right && <ArrowRight className="cc-row__chev" aria-hidden />}
    </Tag>
  );
}

/** Small figure block used inside cards (no nested cards). */
function Figures({ items }) {
  return (
    <div className="cc-figures" style={{ "--cols": items.length }}>
      {items.map(({ label, value, tone }) => (
        <div key={label} className="cc-figure">
          <span className={cn("cc-figure__value tabular", tone && `cc-tone-${tone}`)}>{value}</span>
          <span className="cc-figure__label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// PROJECT BOARD — expandable rows with a per-project phase stepper
// ------------------------------------------------------------

function PhaseStepper({ phases, activeSeq }) {
  return (
    <div className="cc-stepper" aria-label="Project phase status">
      {phases.map((phase, index) => (
        <span key={phase.id} className="cc-step">
          <span
            className={cn(
              "cc-step__dot",
              `cc-dot--${stateTone(phase.state)}`,
              phase.phaseNumber === activeSeq && "is-current",
            )}
            title={`${phase.phaseNumber}. ${phaseTitle(phase.name)} — ${stateLabel(phase.state)}${phase.gate?.code ? ` · Gate ${gateTitle(phase.gate.code)}` : ""}`}
          />
          {index < phases.length - 1 && (
            <span className={cn("cc-step__line", normalizeKey(phase.state) === "COMPLETE" && "is-done")} />
          )}
        </span>
      ))}
    </div>
  );
}

function PhaseLegend() {
  return (
    <div className="cc-legend" aria-label="Phase status legend">
      <span className="cc-legend__label">Phase status</span>
      {LEGEND.map(([state, label]) => (
        <Pill key={state} tone={STATE_TONE[state]} size="sm">
          {label}
        </Pill>
      ))}
    </div>
  );
}

function PhaseDetailCard({ project, phase, canUpdateTasks, onOpen, onFlash }) {
  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProjectPhaseDetailQuery(
    { projectId: project.code, phaseId: phase.id },
    { skip: !project?.code || !phase?.id },
  );

  const [completeTask, { isLoading: completingTask }] =
    useCompleteCommandCenterTaskMutation();

  const handleTaskStatus = async (taskDefinitionId, status) => {
    try {
      await completeTask({
        projectId: project.code,
        taskDefinitionId,
        body: { status },
      }).unwrap();
      onFlash?.(`Task marked ${status.toLowerCase()}.`);
    } catch (e) {
      onFlash?.(e?.data?.message || "Couldn't update the task.");
    }
  };

  return (
    <div className="cc-phase-detail">
      {isLoading && <LoadingRow label="Loading documents and checks…" />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {detail && (
        <div className="cc-detail-grid">
          <div>
            <p className="cc-detail-head">
              <FileText aria-hidden /> Documents
            </p>
            <ul className="cc-checklist">
              {detail.docs.map((d) => {
                const ok = d.status === "UPLOADED" || d.status === "approved";
                return (
                  <li key={d.id}>
                    <span className={cn("cc-bullet", ok ? "cc-dot--ok" : "cc-dot--mute")} />
                    <span className="cc-checklist__name">
                      <span className="cc-truncate">{d.name}</span>
                      {!d.mandatory && <span className="cc-muted">optional</span>}
                    </span>
                    {d.evidence?.source === "DATABASE" ? (
                      <span className="cc-checklist__side">
                        <span className="cc-muted">
                          {d.evidence.sourceLabel} · {d.evidence.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpen?.navigate(d.evidence.actionUrl)}
                        >
                          Open record
                        </Button>
                      </span>
                    ) : d.status === "MISSING" ? (
                      <Button
                        variant="soft"
                        size="sm"
                        icon={UploadCloud}
                        disabled={d.targetType === "DRAWING"}
                        title={
                          d.targetType === "DRAWING"
                            ? "Submit and review this item through the drawings workflow"
                            : undefined
                        }
                        onClick={() =>
                          onOpen?.uploadDoc?.({
                            documentTypeId: d.id,
                            name: d.name,
                            role: d.role,
                            projectId: project.id,
                            projectCode: project.code,
                            projectName: project.name,
                            phaseName: phaseTitle(phase.name),
                          })
                        }
                      >
                        {d.targetType === "DRAWING" ? "Drawing required" : "Upload"}
                      </Button>
                    ) : (
                      <Pill tone="ok" size="sm">{sentence(d.status)}</Pill>
                    )}
                  </li>
                );
              })}
              {detail.docs.length === 0 && (
                <li className="cc-muted">No documents configured for this phase.</li>
              )}
            </ul>
          </div>
          <div>
            <p className="cc-detail-head">
              <ListChecks aria-hidden /> Execution and QC checks
            </p>
            <ul className="cc-checklist">
              {detail.tasks.map((t) => (
                <li key={t.id}>
                  <span
                    className={cn(
                      "cc-bullet",
                      isDone(t.status) ? "cc-dot--ok" : isFailed(t.status) ? "cc-dot--bad" : "cc-dot--mute",
                    )}
                  />
                  <span className="cc-checklist__name">
                    <span className="cc-truncate">{t.name}</span>
                    {t.type === "QC" && <Pill tone="lilac" size="sm" dot={false}>QC</Pill>}
                  </span>
                  <span className="cc-checklist__side">
                    <Pill
                      size="sm"
                      tone={isDone(t.status) ? "ok" : isFailed(t.status) ? "bad" : "warn"}
                    >
                      {sentence(t.status)}
                    </Pill>
                    {canUpdateTasks && !isDone(t.status) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={completingTask}
                          onClick={() => handleTaskStatus(t.id, "DONE")}
                        >
                          Mark done
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cc-btn-bad"
                          disabled={completingTask}
                          onClick={() => handleTaskStatus(t.id, "FAILED")}
                        >
                          Fail
                        </Button>
                      </>
                    )}
                  </span>
                </li>
              ))}
              {detail.tasks.length === 0 && (
                <li className="cc-muted">No checks configured for this phase.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {detail &&
        !isError &&
        (detail.gates?.length ? (
          detail.gates.map((gate) => (
            <GateChecklist
              key={`${project.id}:${gate.gateCode}`}
              projectId={project.id}
              gate={gate}
              onFlash={onFlash}
            />
          ))
        ) : (
          <p className="cc-muted cc-gate-none">
            No sign-off gate is configured for this phase.
          </p>
        ))}
      <div className="cc-phase-detail__foot">
        <Button
          variant="ghost"
          size="sm"
          iconRight={ArrowRight}
          onClick={() => onOpen?.navigate(ROUTES.documentsProject(project.id))}
        >
          Open in Documents
        </Button>
      </div>
    </div>
  );
}

function ProjectExecutionBoard({
  rows,
  expanded,
  onToggle,
  onOpenProject,
  canUpdateTasks,
  onOpen,
  onFlash,
  onClearFilters,
}) {
  const [selectedPhases, setSelectedPhases] = useState({});
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FolderSearch}
        title="No projects match this view"
        text="Try another health filter or clear the search to see the whole portfolio."
        action={
          onClearFilters && (
            <Button size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          )
        }
      />
    );
  }
  return (
    <div className="cc-board">
      {rows.map((row) => {
        const isOpen = expanded === row.code;
        const activePhase = row.phases.find((phase) => phase.phaseNumber === row.currentPhaseSeq);
        const selected = selectedPhases[row.code] === undefined ? activePhase?.id : selectedPhases[row.code];
        const completed = row.phases.filter((phase) => normalizeKey(phase.state) === "COMPLETE").length;
        return (
          <article className={cn("cc-project", isOpen && "is-open")} key={row.code}>
            <div className="cc-project__head">
              <button
                type="button"
                className="cc-project__toggle"
                aria-expanded={isOpen}
                aria-controls={`cc-project-${row.id}`}
                onClick={() => onToggle(row.code)}
              >
                <span className="cc-project__info">
                  <ChevronDown className="cc-project__chev" aria-hidden />
                  <span style={{ minWidth: 0 }}>
                    <span className="cc-project__name">{row.name}</span>
                    <span className="cc-project__meta">
                      {row.location || "Location not set"}
                      {row.lastActivity ? ` · ${timeAgo(row.lastActivity)}` : ""}
                      {row.daysIdle > 0 ? ` · ${row.daysIdle}d idle` : ""}
                    </span>
                  </span>
                </span>
                <span className="cc-project__phase">
                  <PhaseStepper phases={row.phases} activeSeq={row.currentPhaseSeq} />
                  <span className="cc-project__phase-label">
                    {activePhase ? `Phase ${activePhase.phaseNumber} of ${row.phases.length} · ${phaseTitle(activePhase.name)}` : "Not started"}
                  </span>
                </span>
                <span className="cc-project__pct">
                  <span className="cc-project__pct-top">
                    <strong className="tabular">{row.pct}%</strong>
                    <span className="cc-muted tabular">
                      {completed}/{row.phases.length} phases
                    </span>
                  </span>
                  <Progress value={row.pct} />
                </span>
              </button>
              <div className="cc-project__links">
                <Pill tone={healthTone(row.health?.key)}>{sentence(row.health?.label)}</Pill>
                <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => onOpenProject(row.id)}>
                  Open
                </Button>
              </div>
            </div>
            {isOpen && (
              <div className="cc-project__detail" id={`cc-project-${row.id}`}>
                {row.phases.map((phase) => (
                  <div className="cc-phase" key={phase.id}>
                    <div className="cc-phase__row">
                      <span className={cn("cc-phase__num tabular", `cc-num--${stateTone(phase.state)}`)}>
                        {String(phase.phaseNumber).padStart(2, "0")}
                      </span>
                      <div className="cc-phase__text">
                        <p className="cc-phase__name">{phaseTitle(phase.name)}</p>
                        <p className="cc-phase__meta">
                          Docs {phase.docsDone}/{phase.docsTotal} · Checks {phase.tasksDone}/{phase.tasksTotal}
                          {phase.gate?.code ? ` · Gate: ${gateTitle(phase.gate.code)}` : ""}
                        </p>
                      </div>
                      <div className="cc-phase__progress">
                        <Progress value={phase.pct} tone={["mute", "brand"].includes(stateTone(phase.state)) ? undefined : stateTone(phase.state)} />
                        <span className="tabular">{phase.pct}%</span>
                      </div>
                      <Pill tone={stateTone(phase.state)} size="sm">{stateLabel(phase.state)}</Pill>
                      <Button
                        variant={selected === phase.id ? "soft" : "secondary"}
                        size="sm"
                        className="cc-phase__btn"
                        aria-expanded={selected === phase.id}
                        aria-controls={`cc-phase-${row.id}-${phase.id}`}
                        onClick={() =>
                          setSelectedPhases((previous) => ({
                            ...previous,
                            [row.code]: selected === phase.id ? null : phase.id,
                          }))
                        }
                      >
                        {selected === phase.id ? "Hide details" : "View details"}
                      </Button>
                    </div>
                    {selected === phase.id && (
                      <div id={`cc-phase-${row.id}-${phase.id}`}>
                        <PhaseDetailCard
                          project={row}
                          phase={phase}
                          canUpdateTasks={canUpdateTasks}
                          onOpen={onOpen}
                          onFlash={onFlash}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// ACTION REQUIRED — GET /command-center/actions
// ------------------------------------------------------------

function ActionRequired({ onOpen }) {
  const { data, isLoading, isError, error, refetch } =
    useGetCommandCenterActionsQuery();
  const actions = data || [];

  // The service doesn't tag each item with a "kind" yet, so route
  // generically to the project page.
  const routeFor = (item) => ROUTES.project(item.projectId || item.projectCode);

  return (
    <Card
      flush
      title="Action required"
      subtitle="Open mandatory items that are blocking a gate"
      actions={!isLoading && !isError && actions.length > 0 && <Pill tone="bad">{actions.length} open</Pill>}
    >
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}
      {!isLoading && !isError && actions.length > 0 && (
        <div className="cc-list">
          {actions.map((item, i) => (
            <ListRow
              key={i}
              icon={item.severe ? ShieldAlert : AlertCircle}
              tone={item.severe ? "bad" : "warn"}
              title={item.title}
              sub={item.project}
              meta={item.meta}
              onClick={() => onOpen(routeFor(item))}
            />
          ))}
        </div>
      )}
      {!isLoading && !isError && actions.length === 0 && (
        <EmptyState
          icon={CircleCheck}
          title="No blockers right now"
          text="Every mandatory item on the open gates is in place."
        />
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// DOCUMENT CONTROL — GET /command-center/documents,
// POST /command-center/projects/:id/documents/upload
// ------------------------------------------------------------

function DocumentControl({ onOpen, onUploadDoc }) {
  const { data, isLoading, isError, error, refetch } =
    useGetCommandCenterDocumentsQuery();
  const docStats = data?.stats || { required: 0, uploaded: 0, missing: 0 };
  const missingDocs = data?.missingDocs || [];

  return (
    <Card
      flush
      title="Document control"
      subtitle="Mandatory evidence in open phases"
      actions={
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => onOpen(ROUTES.documents)}>
          Open documents
        </Button>
      }
    >
      <Figures
        items={[
          { label: "Required now", value: docStats.required },
          { label: "Evidence satisfied", value: docStats.uploaded, tone: "ok" },
          { label: "Missing", value: docStats.missing, tone: docStats.missing ? "bad" : undefined },
        ]}
      />

      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}
      {!isLoading && !isError && missingDocs.length > 0 && (
        <div className="cc-list">
          {missingDocs.map((doc, i) => (
            <div key={i} className="cc-row">
              <span className="inos-icon-tile inos-icon-tile--sm inos-icon-tile--bad">
                <FileText aria-hidden />
              </span>
              <button
                type="button"
                className="cc-row__text cc-row__text--link"
                onClick={() => onOpen(ROUTES.documentsProject(doc.projectId))}
              >
                <span className="cc-row__title">
                  <span className="cc-truncate">{doc.name}</span>
                </span>
                <span className="cc-row__meta">
                  {doc.project} · {doc.phase} · Owner {doc.role}
                </span>
              </button>
              <Pill tone="bad" size="sm">Missing</Pill>
              <Button
                variant="soft"
                size="sm"
                icon={doc.evidence?.source === "DATABASE" ? ArrowRight : UploadCloud}
                disabled={doc.evidence?.source !== "DATABASE" && doc.targetType === "DRAWING"}
                title={
                  doc.targetType === "DRAWING"
                    ? "Submit and review this item through the drawings workflow"
                    : undefined
                }
                onClick={() =>
                  doc.evidence?.source === "DATABASE"
                    ? onOpen(doc.evidence.actionUrl)
                    : onUploadDoc({
                        projectId: doc.projectId,
                        documentTypeId: doc.id,
                        name: doc.name,
                        role: doc.role,
                        projectCode: doc.code,
                        projectName: doc.project,
                        phaseName: doc.phase,
                      })
                }
              >
                {doc.evidence?.source === "DATABASE"
                  ? "Open source"
                  : doc.targetType === "DRAWING"
                    ? "Drawing required"
                    : "Upload"}
              </Button>
            </div>
          ))}
        </div>
      )}
      {!isLoading && !isError && missingDocs.length === 0 && (
        <EmptyState
          icon={FileCheck2}
          title="Nothing missing right now"
          text="All mandatory documents for the open phases are on file."
        />
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// EXECUTION & QC CHECKS — GET /command-center/tasks
// ------------------------------------------------------------

function TaskQCPanel({ onOpen }) {
  const { data, isLoading, isError, error, refetch } =
    useGetCommandCenterTasksQuery();
  const openTasks = data || [];

  return (
    <Card
      flush
      title="Execution and QC checks"
      subtitle="Pending or failed checklist items across projects"
      actions={!isLoading && !isError && openTasks.length > 0 && <Pill tone="warn">{openTasks.length} open</Pill>}
    >
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}
      {!isLoading && !isError && openTasks.length > 0 && (
        <div className="cc-list">
          {openTasks.map((t, i) => (
            <ListRow
              key={i}
              icon={isFailed(t.status) ? ShieldAlert : ListChecks}
              tone={isFailed(t.status) ? "bad" : undefined}
              title={t.name}
              tag={t.type === "QC" && <Pill tone="lilac" size="sm" dot={false}>QC</Pill>}
              meta={`${t.project} · ${t.phase} · Owner ${t.role}`}
              right={
                <Pill tone={isFailed(t.status) ? "bad" : "warn"} size="sm">
                  {sentence(t.status)}
                </Pill>
              }
              onClick={() => onOpen(t.href || ROUTES.taskProject(t.projectId || t.code))}
            />
          ))}
        </div>
      )}
      {!isLoading && !isError && openTasks.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="All checks clear"
          text="No pending or failed execution and QC items right now."
        />
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// COMMERCIAL — GET /command-center/commercial
// ------------------------------------------------------------

function CommercialPanel({ onOpen }) {
  const { data, isLoading, isError, error, refetch } =
    useGetCommandCenterCommercialQuery();

  return (
    <Card
      flush
      title="Commercial"
      subtitle="BOQ and costing — Phase 5, gate G5"
      actions={
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => onOpen(ROUTES.boq)}>
          Open BOQ
        </Button>
      }
    >
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {data && (
        <>
          <Figures
            items={[
              { label: "Total portfolio value", value: data.totalValue ? formatINR(data.totalValue) : "—" },
              { label: "Commercially approved (G5)", value: formatINR(data.approvedValue), tone: "ok" },
            ]}
          />
          <div className="cc-section">
            <p className="cc-detail-head">G5 status across the portfolio</p>
            <div className="cc-g5">
              {[
                ["Not reached", data.notReached, "mute"],
                ["Costing in progress", data.inProgress, "info"],
                ["Awaiting approval", data.awaiting, "warn"],
                ["Approved", data.approved, "ok"],
              ].map(([label, value, tone]) => (
                <div key={label} className="cc-g5__item">
                  <span className={cn("cc-bullet", `cc-dot--${tone}`)} />
                  <span className="cc-g5__label">{label}</span>
                  <strong className="tabular">{value ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// SITE EXECUTION — derived client-side from the already-loaded
// portfolio rows: projects whose current phase is 08 Execution or
// 09 Handover. QC failures = open site QC sign-off failures
// (row.siteQcFailures, from Site Operations) or a failed QC task.
// ------------------------------------------------------------

const SITE_PHASE_NUMBERS = [8, 9];

function SiteExecution({ rows, isLoading, isError, error, refetch, onOpen }) {
  const inSitePhase = rows.filter((r) =>
    SITE_PHASE_NUMBERS.includes(r.currentPhaseSeq),
  );
  const stalled = inSitePhase.filter((r) =>
    r.phases.some(
      (ph) =>
        SITE_PHASE_NUMBERS.includes(ph.phaseNumber) &&
        normalizeKey(ph.state) === "STALLED",
    ),
  );
  const qcFailed = rows.filter(
    (r) =>
      (r.siteQcFailures || 0) > 0 ||
      r.phases.some(
        (ph) =>
          SITE_PHASE_NUMBERS.includes(ph.phaseNumber) &&
          normalizeKey(ph.state) === "QC_FAILED",
      ),
  );

  return (
    <Card
      flush
      title="Site execution"
      subtitle="Projects in execution or handover"
      actions={
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => onOpen(ROUTES.tasks)}>
          Open execution
        </Button>
      }
    >
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          <Figures
            items={[
              { label: "Projects on site", value: inSitePhase.length },
              { label: "Projects with QC failures", value: qcFailed.length, tone: qcFailed.length ? "bad" : undefined },
              { label: "Stalled on site", value: stalled.length, tone: stalled.length ? "peach" : undefined },
            ]}
          />
          {inSitePhase.length > 0 ? (
            <div className="cc-list">
              {inSitePhase.map((row) => {
                const ph = row.phases.find((x) => x.phaseNumber === row.currentPhaseSeq);
                if (!ph) return null;
                return (
                  <ListRow
                    key={row.code}
                    icon={Construction}
                    title={row.name}
                    meta={`${ph.name} · ${ph.docsDone}/${ph.docsTotal} docs${row.siteQcFailures ? ` · ${row.siteQcFailures} open QC failure${row.siteQcFailures > 1 ? "s" : ""}` : ""}`}
                    right={
                      row.siteQcFailures ? (
                        <Pill tone="bad" size="sm">QC failed</Pill>
                      ) : (
                        <Pill tone={stateTone(ph.state)} size="sm">{stateLabel(ph.state)}</Pill>
                      )
                    }
                    onClick={() => onOpen(ROUTES.taskProject(row.id))}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Construction}
              title="No project on site yet"
              text="Projects appear here once they reach civil, MEP or finishes."
            />
          )}
        </>
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// TEAM WORKLOAD — GET /command-center/team-workload
// ------------------------------------------------------------

function TeamWorkload({ onOpen }) {
  const { data, isLoading, isError, error, refetch } =
    useGetCommandCenterTeamWorkloadQuery();
  const roleLoad = data || [];
  const maxCount = Math.max(1, ...roleLoad.map((r) => r.count));
  const loadTone = (count) => (count >= 3 ? "bad" : count > 0 ? "warn" : "ok");

  return (
    <Card flush title="Team workload" subtitle="Open items by role this week">
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}
      {!isLoading && !isError && roleLoad.length > 0 && (
        <div className="cc-list">
          {roleLoad.map((r) => (
            <button type="button" key={r.role} className="cc-row cc-row--link cc-load" onClick={() => onOpen(ROUTES.tasks)}>
              <span className="inos-icon-tile inos-icon-tile--sm">
                <Users aria-hidden />
              </span>
              <span className="cc-row__text">
                <span className="cc-row__title">{r.role}</span>
                <span className="cc-row__meta">{PEOPLE_BY_ROLE[r.role] || "Unassigned"}</span>
              </span>
              <span className="cc-load__bar">
                <Progress value={(r.count / maxCount) * 100} tone={loadTone(r.count) === "ok" ? undefined : loadTone(r.count)} />
              </span>
              <Pill tone={loadTone(r.count)} size="sm">
                {r.count} open
              </Pill>
            </button>
          ))}
        </div>
      )}
      {!isLoading && !isError && roleLoad.length === 0 && (
        <EmptyState
          icon={Users}
          title="No open work right now"
          text="Open documents and checks will be grouped here by role."
        />
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// ACTIVITY — GET /command-center/activity
// ------------------------------------------------------------

function ActivityTimeline() {
  const { data, isLoading, isError, error, refetch } =
    useGetCommandCenterActivityQuery({ limit: 20 });
  const activities = (data || []).map(mapActivityLog);

  const iconFor = (type) => {
    if (type === "SCAN") return RefreshCw;
    if (type === "GATE_APPROVED") return ShieldCheck;
    if (type === "PROJECT_CREATED") return Plus;
    if (type === "MESSAGE") return MessageCircle;
    if (type === "DOC") return FileText;
    return ListChecks;
  };
  const toneFor = (type) =>
    type === "GATE_APPROVED" ? "ok" : type === "DOC" ? "info" : type === "TASK" ? "lilac" : undefined;

  return (
    <Card
      flush
      title="Live activity"
      subtitle="Latest 20 events from the activity log"
      actions={<Pill tone="ok">Live</Pill>}
    >
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}
      {!isLoading && !isError && activities.length > 0 && (
        <ol className="cc-timeline">
          {activities.map((a, index) => {
            const Icon = iconFor(a.type);
            const tone = toneFor(a.type);
            return (
              <li key={index} className="cc-timeline__item">
                <span className={cn("inos-icon-tile inos-icon-tile--sm", tone && `inos-icon-tile--${tone}`)}>
                  <Icon aria-hidden />
                </span>
                <div className="cc-timeline__body">
                  <div className="cc-timeline__top">
                    <span className="cc-row__title">{a.title}</span>
                    <span className="cc-muted cc-nowrap">{a.time}</span>
                  </div>
                  {a.detail && <span className="cc-row__meta">{a.detail}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {!isLoading && !isError && activities.length === 0 && (
        <EmptyState
          icon={History}
          title="No activity yet"
          text="Uploads, gate sign-offs and check updates will stream in here."
        />
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// UPLOAD DOCUMENT MODAL — POST /command-center/projects/:id/documents/upload
// ------------------------------------------------------------

function UploadDocumentModal({ target, onClose, onUploaded, onFlash }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [notes, setNotes] = useState("");
  const [uploadDocument, { isLoading: submitting }] =
    useUploadCommandCenterDocumentMutation();

  if (!target) return null;

  const handleFiles = (fileList) => {
    if (fileList && fileList[0]) setFile(fileList[0]);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    const body = new FormData();
    body.append("file", file);
    body.append("documentTypeId", target.documentTypeId);
    if (notes) body.append("remarks", notes);

    try {
      await uploadDocument({
        projectId: target.projectId ?? target.projectCode,
        body,
      }).unwrap();
      onUploaded(target, file.name);
      setFile(null);
      setNotes("");
    } catch (e) {
      onFlash?.(e?.data?.message || "Upload failed. Please try again.");
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="cc-upload-modal sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="cc-upload-modal__head">
          <DialogTitle className="inos-section-title">Upload document</DialogTitle>
        </DialogHeader>
        <div className="cc-upload-modal__body inos-modal-body">
          <div className="cc-upload-target">
            <span className="inos-icon-tile">
              <FileText aria-hidden />
            </span>
            <div style={{ minWidth: 0 }}>
              <p className="cc-row__title">{target.name}</p>
              <p className="cc-row__meta">
                {target.projectName} · {target.phaseName} · Owner {target.role}
              </p>
            </div>
          </div>

          <Field label="File" required hint="PDF, image or Office document">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={cn("cc-drop", dragOver && "is-over", file && "has-file")}
            >
              <span className="inos-icon-tile">
                <UploadCloud aria-hidden />
              </span>
              {file ? (
                <span className="cc-row__title">{file.name}</span>
              ) : (
                <span className="cc-drop__text">
                  Drag a file here, or <u>browse</u>
                </span>
              )}
              <input
                type="file"
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </Field>

          <Field label="Notes" optional>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything the reviewer should know about this file"
            />
          </Field>
        </div>
        <div className="cc-upload-modal__foot">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={submitting ? undefined : UploadCloud}
            disabled={!file || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Uploading…" : "Upload document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// TAB NAVIGATION
// ------------------------------------------------------------

const TABS = [
  { id: "portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { id: "actions", label: "Action required", icon: AlertCircle },
  { id: "documents", label: "Document control", icon: FileText },
  { id: "execution", label: "Site execution", icon: Construction },
  { id: "qc", label: "Execution & QC checks", icon: ListChecks },
  { id: "commercial", label: "Commercial", icon: IndianRupee },
  { id: "team", label: "Team workload", icon: Users },
  { id: "activity", label: "Live activity", icon: History },
];

function TabNav({ active, onChange, counts }) {
  return (
    <div className="cc-tabs">
      <Tabs
        value={active}
        onChange={onChange}
        options={TABS.map((tab) => {
          const count = counts?.[tab.id];
          return {
            value: tab.id,
            label: tab.label,
            icon: tab.icon,
            count: typeof count === "number" && count > 0 ? count : undefined,
          };
        })}
      />
    </div>
  );
}

const HEALTH_FILTERS = [
  { value: "all", label: "All" },
  { value: "progress", label: "On track" },
  { value: "gate", label: "Gate pending" },
  { value: "danger", label: "Attention" },
];

// ------------------------------------------------------------
// MAIN PAGE
// ------------------------------------------------------------

export default function CommandCenter() {
  const dispatch = useDispatch();
  const [live, setLive] = useState(true);
  const [healthFilter, setHealthFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [expanded, setExpanded] = useState(null);
  const { user } = useAuth();
  const canUpdateTasks = !!user;
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [uploadTarget, setUploadTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("portfolio");

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  };

  // ---- KPI strip ----
  const {
    data: kpi = {
      live: 0,
      awaiting: 0,
      stalled: 0,
      failed: 0,
      docsMissing: 0,
      value: 0,
    },
    isFetching: kpiLoading,
    refetch: refetchKpis,
    fulfilledTimeStamp: updatedAt,
  } = useGetCommandCenterKpisQuery();

  // ---- Portfolio, filtered (drives the Portfolio tab board) ----
  const {
    data: filteredRows = [],
    isLoading: portfolioLoading,
    isError: portfolioError,
    error: portfolioErrorObj,
    refetch: refetchPortfolio,
  } = useGetCommandCenterPortfolioQuery({
    health: healthFilter === "all" ? undefined : healthFilter,
    search: debouncedSearch || undefined,
  });

  // ---- Portfolio, unfiltered (Site Execution + tab badges) ----
  const { data: allRows = [], refetch: refetchAllRows } =
    useGetCommandCenterPortfolioQuery({});

  // ---- Other tabs, each backed by its own endpoint ----
  const { data: actionsData } = useGetCommandCenterActionsQuery();
  const { data: documentsData } = useGetCommandCenterDocumentsQuery();
  const { data: tasksData } = useGetCommandCenterTasksQuery();

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      if (!document.hidden) dispatch(commandCenterApi.util.invalidateTags(REFRESH_TAGS));
    }, 30000);
    return () => clearInterval(timer);
  }, [live, dispatch]);

  const handleRescan = () => {
    // No dedicated rescan endpoint yet — refresh every live query on the page.
    refetchKpis();
    refetchPortfolio();
    refetchAllRows();
    dispatch(commandCenterApi.util.invalidateTags(REFRESH_TAGS.filter(tag => !["CommandCenterKpis", "CommandCenterPortfolio"].includes(tag))));
    flashToast("Refreshing records…");
  };

  const handleUploaded = (target) => {
    setUploadTarget(null);
    flashToast(`${target.name} uploaded to ${target.projectName}.`);
  };

  const tabCounts = useMemo(
    () => ({
      portfolio: allRows.length,
      actions: actionsData?.length ?? 0,
      documents: documentsData?.stats?.missing ?? 0,
      qc: tasksData?.length ?? 0,
    }),
    [allRows, actionsData, documentsData, tasksData],
  );

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  const kpiValue = (v) => (kpiLoading && v == null ? "—" : v);

  return (
    <Page className="command-center">
      <PageHeader
        crumbs={[{ label: "Command Center" }]}
        title="Command Center"
        subtitle="Live health of every project — gates, evidence, site checks and money in one calm view."
        actions={
          <>
            <button
              type="button"
              className={cn("cc-live", live && "is-live")}
              aria-pressed={live}
              title={live ? "Auto-refreshing every 30 seconds. Click to pause." : "Auto-refresh paused. Click to resume."}
              onClick={() => setLive((value) => !value)}
            >
              <span className="cc-live__dot" aria-hidden />
              {live ? "Live" : "Paused"}
              <span className="cc-live__time">
                {updatedLabel ? `Updated ${updatedLabel}` : "Loading…"}
              </span>
            </button>
            <Button icon={RefreshCw} onClick={handleRescan} disabled={kpiLoading} className={kpiLoading ? "cc-refreshing" : undefined}>
              {kpiLoading ? "Refreshing" : "Rescan"}
            </Button>
            {user?.permissions?.includes("projects:create") && (
              <Button variant="primary" icon={Plus} onClick={() => navigate("/projects/new")}>
                New project
              </Button>
            )}
          </>
        }
      />

      {/* KPI STRIP */}
      <Stats>
        <StatTile
          label="Live projects"
          value={kpiValue(kpi.live)}
          meta="Active projects"
          icon={<BriefcaseBusiness />}
          active={activeTab === "portfolio" && healthFilter === "all"}
          onClick={() => {
            setActiveTab("portfolio");
            setHealthFilter("all");
          }}
        />
        <StatTile
          label="Awaiting sign-off"
          value={kpiValue(kpi.awaiting)}
          meta="Complete, not yet signed"
          icon={<ShieldCheck />}
          tone="warn"
          active={activeTab === "portfolio" && healthFilter === "gate"}
          onClick={() => {
            setActiveTab("portfolio");
            setHealthFilter("gate");
          }}
        />
        <StatTile
          label="Stalled phases"
          value={kpiValue(kpi.stalled)}
          meta="7+ days without activity"
          icon={<Clock3 />}
          tone="peach"
          active={activeTab === "actions"}
          onClick={() => setActiveTab("actions")}
        />
        <StatTile
          label="QC failures"
          value={kpiValue(kpi.failed)}
          meta={kpi.siteQcFailed ? `${kpi.siteQcFailed} open on site` : "Failed checklist items"}
          icon={<ShieldAlert />}
          tone="bad"
          active={activeTab === "qc"}
          onClick={() => setActiveTab("qc")}
        />
        <StatTile
          label="Documents pending"
          value={kpiValue(kpi.docsMissing)}
          meta="Mandatory, in open phases"
          icon={<FileText />}
          tone="info"
          active={activeTab === "documents"}
          onClick={() => setActiveTab("documents")}
        />
        <StatTile
          label="Portfolio value"
          value={kpiLoading && kpi.value == null ? "—" : formatINR(kpi.value)}
          meta="Across active projects"
          icon={<IndianRupee />}
          active={activeTab === "commercial"}
          onClick={() => setActiveTab("commercial")}
        />
      </Stats>

      <div className="cc-main">
        {/* TABS */}
        <TabNav active={activeTab} onChange={setActiveTab} counts={tabCounts} />

        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <Card
            flush
            title="Project execution"
            subtitle="Open a project to see its phases, evidence and gate sign-offs."
            actions={
              <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate(ROUTES.projects)}>
                All projects
              </Button>
            }
            footer={<PhaseLegend />}
          >
            <div className="cc-board-toolbar">
              <SearchInput value={search} onChange={setSearch} placeholder="Search projects" />
              <Segmented value={healthFilter} onChange={setHealthFilter} options={HEALTH_FILTERS} />
            </div>

            {portfolioLoading && <LoadingRow label="Loading portfolio…" />}
            {portfolioError && (
              <ErrorRow error={portfolioErrorObj} onRetry={refetchPortfolio} />
            )}
            {!portfolioLoading && !portfolioError && (
              <ProjectExecutionBoard
                rows={filteredRows}
                expanded={expanded}
                onToggle={(code) =>
                  setExpanded(expanded === code ? null : code)
                }
                onOpenProject={(code) => navigate(ROUTES.project(code))}
                canUpdateTasks={canUpdateTasks}
                onOpen={{ navigate, uploadDoc: setUploadTarget }}
                onFlash={flashToast}
                onClearFilters={
                  healthFilter !== "all" || search
                    ? () => {
                        setHealthFilter("all");
                        setSearch("");
                      }
                    : undefined
                }
              />
            )}
          </Card>
        )}

        {/* ACTION REQUIRED TAB */}
        {activeTab === "actions" && <ActionRequired onOpen={navigate} />}

        {/* DOCUMENT CONTROL TAB */}
        {activeTab === "documents" && (
          <DocumentControl onOpen={navigate} onUploadDoc={setUploadTarget} />
        )}

        {/* SITE EXECUTION TAB */}
        {activeTab === "execution" && (
          <SiteExecution rows={allRows} onOpen={navigate} />
        )}

        {/* EXECUTION & QC CHECKS TAB */}
        {activeTab === "qc" && <TaskQCPanel onOpen={navigate} />}

        {/* COMMERCIAL TAB */}
        {activeTab === "commercial" && <CommercialPanel onOpen={navigate} />}

        {/* TEAM WORKLOAD TAB */}
        {activeTab === "team" && <TeamWorkload onOpen={navigate} />}

        {/* LIVE ACTIVITY TAB */}
        {activeTab === "activity" && <ActivityTimeline />}
      </div>

      {uploadTarget && (
        <UploadDocumentModal
          target={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={handleUploaded}
          onFlash={flashToast}
        />
      )}

      <Toast message={toast} />
    </Page>
  );
}
