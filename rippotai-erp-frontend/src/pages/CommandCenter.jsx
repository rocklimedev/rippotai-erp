import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GateChecklist from "@/components/command-center/GateChecklist";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Construction,
  DollarSign,
  FileText,
  ListChecks,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ------------------------------------------------------------
// LIVE API — everything below used to be read out of local mock
// arrays (PHASE_MASTER / DOC_MASTER / TASK_MASTER / PROJECTS) and
// rolled up client-side. That is gone: every number on screen now
// comes from CommandCenterService via commandCenterApi.js.
//
// ADJUST THIS IMPORT PATH to wherever commandCenterApi.js actually
// lives in your app (it injects endpoints into the same `baseApi`
// used by projectsApi.js).
// ------------------------------------------------------------
import {
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
  boq: "/boq",
  tasks: "/tasks",
  taskProject: (id) => `/tasks?project=${id}`,
  documents: "/documents",
  documentsProject: (id) =>
    `/documents/all?project_id=${encodeURIComponent(id)}`,
  procurement: "/procurement",
  calendar: "/calendar",
  reports: "/reports",
};

// ------------------------------------------------------------
// PEOPLE — the backend's team-workload rollup only returns
// { role, count } (TaskDefinition/DocumentType have no "who is
// this person" column yet). We keep a local role -> display name
// map purely for presentation. Swap/remove once the API returns
// a real assignee.
// ------------------------------------------------------------

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

// Backend enum string values might come back as "AWAITING_GATE",
// "Awaiting Gate", "awaiting-gate", etc depending on how the enum is
// serialized. Normalize to a single SCREAMING_SNAKE key so the UI
// doesn't silently fall through to the "unknown state" style.
const normalizeKey = (v) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

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

// Turns an ActivityLog row (user_id, user_email, action, entity_type,
// entity_label, changes, created_at, ...) into the {type, title,
// detail, time} shape ActivityTimeline already knows how to render.
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
    type: ICON_TYPE[action] || "SCAN",
    title: TITLE[action] || action.replace(/_/g, " ").toLowerCase(),
    detail: row.entity_label || row.user_email || "",
    time: timeAgo(row.created_at),
  };
}

const STATE_META = {
  COMPLETE: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    indicator: "bg-emerald-500",
  },
  AWAITING_GATE: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    indicator: "bg-blue-500",
  },
  IN_PROGRESS: {
    badge: "bg-[#eef4f0] text-[#2f6655] border-[#c9d7cf]",
    dot: "bg-[#2f6655]",
    indicator: "bg-[#2f6655]",
  },
  STALLED: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    indicator: "bg-amber-500",
  },
  QC_FAILED: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    indicator: "bg-red-500",
  },
  NOT_STARTED: {
    badge: "bg-slate-50 text-slate-400 border-slate-200",
    dot: "bg-slate-300",
    indicator: "bg-slate-300",
  },
};
const stateMeta = (state) =>
  STATE_META[normalizeKey(state)] || STATE_META.NOT_STARTED;
const stateLabel = (state) => normalizeKey(state).replace(/_/g, " ");

const HEALTH_META = {
  DANGER: "bg-red-50 text-red-700 border-red-200",
  GATE: "bg-blue-50 text-blue-700 border-blue-200",
  PROGRESS: "bg-[#eef4f0] text-[#2f6655] border-[#c9d7cf]",
  COMPLETE: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const healthMeta = (key) =>
  HEALTH_META[normalizeKey(key)] || HEALTH_META.PROGRESS;

// ------------------------------------------------------------
// SMALL UI COMPONENTS
// ------------------------------------------------------------

function SectionHeader({ eyebrow, title, action, onAction }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400 mb-1">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[#19352d]">
          {title}
        </h2>
      </div>
      {action && (
        <Button
          type="button"
          variant="ghost"
          onClick={onAction}
          className="h-auto p-0 text-[11px] font-medium text-slate-500 hover:text-[#19352d] hover:bg-transparent flex items-center gap-1"
        >
          {action}
          <ArrowRight size={13} />
        </Button>
      )}
    </div>
  );
}

function ProgressBar({ value, tone = "brand" }) {
  const toneClass =
    tone === "danger"
      ? "bg-red-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "gate"
          ? "bg-blue-500"
          : "bg-[#2f6655]";
  return (
    <Progress
      value={Math.min(Math.max(value || 0, 0), 100)}
      className={cn(
        "h-1.5 bg-slate-100 [&>div]:transition-all",
        "[&>div]:" + toneClass,
      )}
    />
  );
}

function KPI({ label, value, meta, icon: Icon, tone, onClick, loading }) {
  return (
    <Card
      onClick={onClick}
      role="button"
      className="text-left w-full group bg-white border border-[#e4e8e5] rounded-xl p-4 hover:border-[#b9c9c1] hover:shadow-sm transition cursor-pointer shadow-none"
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          tone === "danger"
            ? "bg-red-50 text-red-600"
            : tone === "gate"
              ? "bg-blue-50 text-blue-600"
              : "bg-[#f0f5f2] text-[#2f6655]",
        )}
      >
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div className="mt-4">
        <div className="text-[24px] font-semibold tracking-[-0.04em] text-[#19352d]">
          {loading ? "—" : value}
        </div>
        <div className="text-[11px] font-medium text-slate-500 mt-0.5">
          {label}
        </div>
        {meta && <div className="text-[10px] text-slate-400 mt-2">{meta}</div>}
      </div>
    </Card>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#19352d] text-white text-[12px] px-5 py-3 rounded-lg shadow-lg z-[200]">
      {message}
    </div>
  );
}

function LoadingRow({ label = "Loading…" }) {
  return (
    <div className="px-4 py-8 text-center text-[11px] text-slate-400">
      {label}
    </div>
  );
}

function ErrorRow({ error, onRetry }) {
  return (
    <div className="px-4 py-8 text-center">
      <div className="text-[11px] text-red-500 mb-2">
        Couldn't load this data{error?.status ? ` (HTTP ${error.status})` : ""}.
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="h-auto px-3 py-1.5 text-[10px] font-semibold"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// PROJECT BOARD — expandable rows with a per-project gate ladder
// ------------------------------------------------------------

function PhaseLadder({ phases, activeSeq }) {
  return (
    <div className="flex items-center gap-[3px]">
      {phases.map((ph) => {
        const meta = stateMeta(ph.state);
        return (
          <div
            key={ph.id}
            title={`${ph.gate?.code ?? ""} · ${ph.name} — ${stateLabel(ph.state)}`}
            className={cn(
              "w-3 h-3 rotate-45 flex-shrink-0 border",
              meta.dot,
              ph.phaseNumber === activeSeq
                ? "ring-2 ring-offset-1 ring-[#19352d]"
                : "",
            )}
            style={{ borderColor: "transparent" }}
          />
        );
      })}
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

  const meta = stateMeta(phase.state);
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
    <Card className="bg-[#fafbfa] border border-[#edf0ee] rounded-lg p-4 mt-3 shadow-none">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold">
            Phase {phase.phaseNumber} · {phase.gate?.code ?? "—"}
          </div>
          <div className="text-[13px] font-semibold text-[#19352d] mt-0.5">
            {phase.name}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {phase.gate?.name ?? ""}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "px-2 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap",
            meta.badge,
          )}
        >
          {stateLabel(phase.state)}
        </Badge>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-slate-600">
            {phase.pct}% complete
          </span>
          <span className="text-[9px] text-slate-400">
            {phase.docsDone}/{phase.docsTotal} docs · {phase.tasksDone}/
            {phase.tasksTotal} checks
          </span>
        </div>
        <ProgressBar
          value={phase.pct}
          tone={
            normalizeKey(phase.state) === "QC_FAILED"
              ? "danger"
              : normalizeKey(phase.state) === "STALLED"
                ? "warn"
                : normalizeKey(phase.state) === "AWAITING_GATE"
                  ? "gate"
                  : "brand"
          }
        />
      </div>

      {isLoading && <LoadingRow label="Loading documents & checks…" />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {detail && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold mb-1.5">
              Documents
            </div>
            <div className="space-y-1">
              {detail.docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-2 text-[10.5px]"
                >
                  <span
                    className={cn(
                      "flex items-center gap-1.5 min-w-0",
                      d.status === "MISSING"
                        ? "text-slate-500"
                        : "text-slate-700",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        d.status === "UPLOADED" || d.status === "approved"
                          ? "bg-emerald-500"
                          : "bg-slate-300",
                      )}
                    />
                    <span className="truncate">{d.name}</span>
                    {!d.mandatory && (
                      <span className="text-slate-400 flex-shrink-0">
                        (optional)
                      </span>
                    )}
                  </span>
                  {d.evidence?.source === "DATABASE" ? (
                    <span className="text-right text-[10px]">
                      <span className="block text-slate-500">
                        {d.evidence.sourceLabel} · {d.evidence.status}
                      </span>
                      <button
                        type="button"
                        className="text-emerald-700 underline"
                        onClick={() => onOpen?.navigate(d.evidence.actionUrl)}
                      >
                        Open source record
                      </button>
                    </span>
                  ) : d.status === "MISSING" ? (
                    <Button
                      type="button"
                      size="sm"
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
                          phaseName: phase.name,
                        })
                      }
                      className="flex-shrink-0 h-auto inline-flex items-center gap-1 px-1.5 py-1 rounded bg-[#19352d] text-white text-[8.5px] font-semibold hover:bg-[#0f231d]"
                    >
                      <UploadCloud size={10} />
                      {d.targetType === "DRAWING"
                        ? "Drawing required"
                        : "Upload"}
                    </Button>
                  ) : (
                    <span className="text-emerald-600 flex-shrink-0">
                      {d.status}
                    </span>
                  )}
                </div>
              ))}
              {detail.docs.length === 0 && (
                <div className="text-[10px] text-slate-400">
                  No documents configured for this phase.
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.1em] text-slate-400 font-semibold mb-1.5">
              Execution &amp; QC checks
            </div>
            <div className="space-y-1">
              {detail.tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-[10.5px]"
                >
                  <span className="flex items-center gap-1.5 text-slate-700 min-w-0">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        t.status === "DONE" || t.status === "Done"
                          ? "bg-emerald-500"
                          : t.status === "FAILED" || t.status === "Failed"
                            ? "bg-red-500"
                            : "bg-slate-300",
                      )}
                    />
                    <span className="truncate">{t.name}</span>
                    {t.type === "QC" && (
                      <span className="text-[8px] font-semibold text-slate-400 flex-shrink-0">
                        QC
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={cn(
                        "font-medium",
                        t.status === "DONE" || t.status === "Done"
                          ? "text-emerald-600"
                          : t.status === "FAILED" || t.status === "Failed"
                            ? "text-red-500"
                            : "text-slate-500",
                      )}
                    >
                      {t.status}
                    </span>
                    {canUpdateTasks &&
                      t.status !== "DONE" &&
                      t.status !== "Done" && (
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={completingTask}
                            onClick={() => handleTaskStatus(t.id, "DONE")}
                            className="text-[8px] font-semibold text-emerald-600 hover:underline disabled:opacity-40"
                          >
                            Mark done
                          </button>
                          <button
                            type="button"
                            disabled={completingTask}
                            onClick={() => handleTaskStatus(t.id, "FAILED")}
                            className="text-[8px] font-semibold text-red-500 hover:underline disabled:opacity-40"
                          >
                            Fail
                          </button>
                        </span>
                      )}
                  </span>
                </div>
              ))}
              {detail.tasks.length === 0 && (
                <div className="text-[10px] text-slate-400">
                  No checks configured for this phase.
                </div>
              )}
            </div>
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
          <p className="mt-4 text-xs text-slate-500">
            No sign-off gate is configured for this phase.
          </p>
        ))}
      <Separator className="mt-4 mb-3 bg-[#edf0ee]" />
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen?.navigate(ROUTES.documentsProject(project.id))}
          className="h-auto p-0 text-[10px] font-semibold text-[#2f6655] hover:bg-transparent hover:text-[#19352d]"
        >
          Open in Documents →
        </Button>
      </div>
    </Card>
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
}) {
  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      {rows.map((row) => {
        const isOpen = expanded === row.code;
        const activePhase = row.phases.find(
          (p) => p.phaseNumber === row.currentPhaseSeq,
        );
        return (
          <div
            key={row.code}
            className="border-b last:border-b-0 border-[#edf0ee]"
          >
            <div
              className="px-4 py-3.5 hover:bg-[#fbfcfb] cursor-pointer transition"
              onClick={() => onToggle(row.code)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_170px_120px_90px] gap-4 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#f1f5f2] flex items-center justify-center text-[#2f6655] flex-shrink-0">
                    <BriefcaseBusiness size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-[#19352d] truncate">
                      {row.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {row.code} · {row.location}
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-700 truncate">
                      {activePhase?.name}{" "}
                      <span className="text-slate-400">
                        ({activePhase?.gate?.code ?? "—"})
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600">
                      {row.pct}%
                    </span>
                  </div>
                  <PhaseLadder
                    phases={row.phases}
                    activeSeq={row.currentPhaseSeq}
                  />
                </div>

                <div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-semibold",
                      healthMeta(row.health?.key),
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {row.health?.label}
                  </Badge>
                </div>

                <div className="text-[10px] text-slate-600">
                  {timeAgo(row.lastActivity) || "—"}
                  {row.daysIdle != null && row.daysIdle > 0 && (
                    <div className="text-[9px] text-amber-600 mt-0.5">
                      {row.daysIdle}d idle
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject(row.code);
                    }}
                    className="h-auto p-0 text-[9px] font-semibold text-slate-400 hover:text-[#19352d] hover:bg-transparent"
                  >
                    Open
                  </Button>
                  <ArrowRight
                    size={14}
                    className={cn(
                      "text-slate-300 transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="px-4 pb-4">
                {activePhase && (
                  <PhaseDetailCard
                    project={row}
                    phase={activePhase}
                    canUpdateTasks={canUpdateTasks}
                    onOpen={onOpen}
                    onFlash={onFlash}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
      {rows.length === 0 && <LoadingRow label="No projects match this view." />}
    </Card>
  );
}

// ------------------------------------------------------------
// ACTION REQUIRED — GET /command-center/actions
// ------------------------------------------------------------

function ActionRequired({ onOpen }) {
  const { data, isLoading, isError, error, refetch } =
    useGetCommandCenterActionsQuery();
  const actions = data || [];

  // The service doesn't currently tag each item with a "kind", so we
  // route generically to the project page. If you add a `route` (or
  // `kind`) field to CommandCenterService#getActionRequired, wire it
  // in here instead of this fallback.
  const routeFor = (item) => ROUTES.project(item.projectCode);

  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <AlertCircle size={14} />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#19352d]">
              Action Required
            </div>
            <div className="text-[9px] text-slate-400">
              Open mandatory items blocking a gate
            </div>
          </div>
        </div>
        <Badge className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-50">
          {actions.length}
        </Badge>
      </div>
      <div>
        {isLoading && <LoadingRow />}
        {isError && <ErrorRow error={error} onRetry={refetch} />}
        {!isLoading &&
          !isError &&
          actions.map((item, i) => (
            <Button
              key={i}
              type="button"
              variant="ghost"
              onClick={() => onOpen(routeFor(item))}
              className="w-full h-auto justify-start text-left px-4 py-3 border-b last:border-b-0 border-[#edf0ee] hover:bg-[#fbfcfb] rounded-none"
            >
              <div className="flex items-start gap-3 w-full">
                <span
                  className={cn(
                    "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                    item.severe ? "bg-red-500" : "bg-amber-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-slate-700 truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-[#2f6655] mt-1">
                    {item.project}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {item.meta}
                  </div>
                </div>
                <ArrowRight
                  size={13}
                  className="mt-1 flex-shrink-0 text-slate-300"
                />
              </div>
            </Button>
          ))}
        {!isLoading && !isError && actions.length === 0 && (
          <LoadingRow label="No blockers right now." />
        )}
      </div>
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
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Document Control
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Mandatory evidence in open phases
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(ROUTES.documents)}
          className="h-auto p-0 text-[10px] text-[#2f6655] font-semibold hover:bg-transparent"
        >
          View all
        </Button>
      </div>

      <div className="grid grid-cols-3 border-b border-[#edf0ee]">
        <div className="px-4 py-3 border-r border-[#edf0ee]">
          <div className="text-[17px] font-semibold text-[#19352d]">
            {docStats.required}
          </div>
          <div className="text-[9px] text-slate-400">Required now</div>
        </div>
        <div className="px-4 py-3 border-r border-[#edf0ee]">
          <div className="text-[17px] font-semibold text-emerald-600">
            {docStats.uploaded}
          </div>
          <div className="text-[9px] text-slate-400">Evidence satisfied</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[17px] font-semibold text-red-500">
            {docStats.missing}
          </div>
          <div className="text-[9px] text-slate-400">Missing</div>
        </div>
      </div>

      <div>
        {isLoading && <LoadingRow />}
        {isError && <ErrorRow error={error} onRetry={refetch} />}
        {!isLoading &&
          !isError &&
          missingDocs.map((doc, i) => (
            <div
              key={i}
              className="w-full px-4 py-3 flex items-center gap-3 border-b last:border-b-0 border-[#edf0ee] hover:bg-[#fbfcfb] transition"
            >
              <div className="w-7 h-7 rounded-lg bg-[#f3f6f4] text-[#2f6655] flex items-center justify-center flex-shrink-0">
                <FileText size={13} />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpen(ROUTES.documentsProject(doc.projectId))}
                className="h-auto p-0 min-w-0 flex-1 justify-start text-left hover:bg-transparent"
              >
                <div>
                  <div className="text-[10px] font-medium text-slate-700 truncate">
                    {doc.name}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {doc.project} · {doc.phase} · owner {doc.role}
                  </div>
                </div>
              </Button>
              <div className="text-[8px] font-semibold text-red-500 flex-shrink-0">
                MISSING
              </div>
              <Button
                type="button"
                disabled={
                  doc.evidence?.source !== "DATABASE" &&
                  doc.targetType === "DRAWING"
                }
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
                className="flex-shrink-0 h-auto inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-[#19352d] text-white text-[9px] font-semibold hover:bg-[#0f231d]"
              >
                <UploadCloud size={11} />
                {doc.evidence?.source === "DATABASE"
                  ? "Open source"
                  : doc.targetType === "DRAWING"
                    ? "Drawing required"
                    : "Upload"}
              </Button>
            </div>
          ))}
        {!isLoading && !isError && missingDocs.length === 0 && (
          <LoadingRow label="Nothing missing right now." />
        )}
      </div>
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
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Execution &amp; QC Checks
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Pending or failed checklist items
          </div>
        </div>
        <Badge className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#f0f5f2] text-[#2f6655] hover:bg-[#f0f5f2]">
          {openTasks.length}
        </Badge>
      </div>
      <div>
        {isLoading && <LoadingRow />}
        {isError && <ErrorRow error={error} onRetry={refetch} />}
        {!isLoading &&
          !isError &&
          openTasks.map((t, i) => (
            <Button
              key={i}
              type="button"
              variant="ghost"
              onClick={() => onOpen(ROUTES.taskProject(t.code))}
              className="w-full h-auto justify-start px-4 py-3 text-left border-b last:border-b-0 border-[#edf0ee] hover:bg-[#fbfcfb] rounded-none"
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                    t.status === "FAILED" || t.status === "Failed"
                      ? "bg-red-50 text-red-500"
                      : "bg-[#f3f6f4] text-[#2f6655]",
                  )}
                >
                  {t.status === "FAILED" || t.status === "Failed" ? (
                    <ShieldAlert size={13} />
                  ) : (
                    <ListChecks size={13} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-medium text-slate-700 truncate">
                    {t.name}{" "}
                    {t.type === "QC" && (
                      <span className="text-[8px] font-semibold text-slate-400">
                        QC
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {t.project} · {t.phase} · owner {t.role}
                  </div>
                </div>
                <div
                  className={cn(
                    "text-[8px] font-semibold flex-shrink-0",
                    t.status === "FAILED" || t.status === "Failed"
                      ? "text-red-500"
                      : "text-amber-600",
                  )}
                >
                  {String(t.status).toUpperCase()}
                </div>
              </div>
            </Button>
          ))}
        {!isLoading && !isError && openTasks.length === 0 && (
          <LoadingRow label="All checks clear." />
        )}
      </div>
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
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Commercial
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            BOQ & Costing (Phase 5 · G5)
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(ROUTES.boq)}
          className="h-auto p-0 text-[10px] text-[#2f6655] font-semibold hover:bg-transparent"
        >
          Open BOQ
        </Button>
      </div>

      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {data && (
        <>
          <div className="grid grid-cols-2">
            <div className="p-4 border-r border-b border-[#edf0ee]">
              <div className="text-[17px] font-semibold text-[#19352d]">
                {data.totalValue ? formatINR(data.totalValue) : "—"}
              </div>
              <div className="text-[9px] text-slate-400">
                Total portfolio value
              </div>
            </div>
            <div className="p-4 border-b border-[#edf0ee]">
              <div className="text-[17px] font-semibold text-emerald-600">
                {formatINR(data.approvedValue)}
              </div>
              <div className="text-[9px] text-slate-400">
                Commercially approved (G5)
              </div>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-[0.12em] font-semibold text-slate-400">
                G5 status across portfolio
              </span>
            </div>
            <div className="flex gap-2">
              {[
                ["Not reached", data.notReached],
                ["Costing in progress", data.inProgress],
                ["Awaiting approval", data.awaiting],
                ["Approved", data.approved],
              ].map(([label, value]) => (
                <div key={label} className="flex-1 bg-[#fafbfa] rounded-lg p-2">
                  <div className="text-[13px] font-semibold text-[#19352d]">
                    {value}
                  </div>
                  <div className="text-[8px] text-slate-400">{label}</div>
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
// portfolio rows (Civil / MEP / Finishes = phase numbers 9–11).
// No dedicated endpoint needed since getPortfolio() already
// returns each project's full phase rollup.
// ------------------------------------------------------------

const SITE_PHASE_NUMBERS = [9, 10, 11];

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
  const qcFailed = inSitePhase.filter((r) =>
    r.phases.some(
      (ph) =>
        SITE_PHASE_NUMBERS.includes(ph.phaseNumber) &&
        normalizeKey(ph.state) === "QC_FAILED",
    ),
  );

  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Site Execution
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Civil · MEP · Finishes (Phases 9–11)
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpen(ROUTES.tasks)}
          className="h-auto p-0 text-[10px] text-[#2f6655] font-semibold hover:bg-transparent"
        >
          Open execution
        </Button>
      </div>

      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-3 border-b border-[#edf0ee]">
            <div className="p-4 border-r border-[#edf0ee]">
              <Construction size={14} className="text-[#2f6655]" />
              <div className="text-[20px] font-semibold text-[#19352d] mt-3">
                {inSitePhase.length}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                Projects on site
              </div>
            </div>
            <div className="p-4 border-r border-[#edf0ee]">
              <ShieldAlert size={14} className="text-red-500" />
              <div className="text-[20px] font-semibold text-red-500 mt-3">
                {qcFailed.length}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                QC failures on site
              </div>
            </div>
            <div className="p-4">
              <Clock3 size={14} className="text-amber-500" />
              <div className="text-[20px] font-semibold text-amber-600 mt-3">
                {stalled.length}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                Stalled on site
              </div>
            </div>
          </div>

          <div>
            {inSitePhase.map((row) => {
              const ph = row.phases.find(
                (x) => x.phaseNumber === row.currentPhaseSeq,
              );
              if (!ph) return null;
              return (
                <Button
                  type="button"
                  variant="ghost"
                  key={row.code}
                  onClick={() => onOpen(ROUTES.taskProject(row.code))}
                  className="w-full h-auto justify-start px-4 py-3 border-b last:border-b-0 border-[#edf0ee] text-left hover:bg-[#fbfcfb] rounded-none"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-7 h-7 rounded-lg bg-[#f3f6f4] flex items-center justify-center text-[#2f6655]">
                      <Construction size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-slate-700">
                        {row.name}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                        {ph.name} · {ph.tasksDone}/{ph.tasksTotal} checks ·{" "}
                        {ph.docsDone}/{ph.docsTotal} docs
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] font-semibold px-1.5 py-0.5 rounded",
                        stateMeta(ph.state).badge,
                      )}
                    >
                      {stateLabel(ph.state)}
                    </Badge>
                  </div>
                </Button>
              );
            })}
            {inSitePhase.length === 0 && (
              <LoadingRow label="No project on site right now." />
            )}
          </div>
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

  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Team Workload
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Open items by role, this week
          </div>
        </div>
        <Users size={14} className="text-slate-400" />
      </div>
      <div>
        {isLoading && <LoadingRow />}
        {isError && <ErrorRow error={error} onRetry={refetch} />}
        {!isLoading &&
          !isError &&
          roleLoad.map((r) => (
            <Button
              type="button"
              variant="ghost"
              key={r.role}
              onClick={() => onOpen(ROUTES.tasks)}
              className="w-full h-auto flex-col items-stretch justify-start px-4 py-3 border-b last:border-b-0 border-[#edf0ee] text-left hover:bg-[#fbfcfb] rounded-none"
            >
              <div className="flex items-center justify-between mb-1.5 w-full">
                <span className="text-[10px] font-medium text-slate-700">
                  {r.role}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-semibold",
                    r.count >= 3
                      ? "text-red-500"
                      : r.count > 0
                        ? "text-amber-600"
                        : "text-emerald-600",
                  )}
                >
                  {r.count} open
                </span>
              </div>
              <ProgressBar
                value={(r.count / maxCount) * 100}
                tone={r.count >= 3 ? "danger" : r.count > 0 ? "warn" : "brand"}
              />
              <div className="text-[8px] text-slate-400 mt-1">
                {PEOPLE_BY_ROLE[r.role] || "Unassigned"}
              </div>
            </Button>
          ))}
        {!isLoading && !isError && roleLoad.length === 0 && (
          <LoadingRow label="No open work right now." />
        )}
      </div>
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

  return (
    <Card className="bg-white border border-[#e4e8e5] rounded-xl overflow-hidden shadow-none p-0">
      <div className="px-4 py-3 border-b border-[#edf0ee] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#19352d]">
            Live Activity
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            From the activity log
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-600">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>
      <div>
        {isLoading && <LoadingRow />}
        {isError && <ErrorRow error={error} onRetry={refetch} />}
        {!isLoading &&
          !isError &&
          activities.map((a, index) => {
            const Icon = iconFor(a.type);
            return (
              <div key={index} className="px-4 py-3 flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-lg bg-[#f3f6f4] text-[#2f6655] flex items-center justify-center">
                    <Icon size={12} />
                  </div>
                  {index !== activities.length - 1 && (
                    <div className="w-px flex-1 bg-[#edf0ee] mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-medium text-slate-700 truncate">
                      {a.title}
                    </div>
                    <span className="text-[8px] text-slate-400 whitespace-nowrap">
                      {a.time}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#2f6655] mt-1">
                    {a.detail}
                  </div>
                </div>
              </div>
            );
          })}
        {!isLoading && !isError && activities.length === 0 && (
          <LoadingRow label="No activity yet." />
        )}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------
// UPLOAD DOCUMENT MODAL — POST /command-center/projects/:id/documents/upload
// ------------------------------------------------------------

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <Label className="block text-[9px] uppercase tracking-[0.1em] font-semibold text-slate-400 mb-1.5">
        {label}
      </Label>
      {children}
    </div>
  );
}

const inputClass =
  "text-[13px] border-[#dfe5e1] focus-visible:border-[#2f6655] focus-visible:ring-[#2f6655]";

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
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-[#dfe5e1]">
        <DialogHeader className="px-5 py-4 border-b border-[#edf0ee]">
          <DialogTitle className="text-[15px] font-semibold text-[#19352d]">
            Upload document
          </DialogTitle>
        </DialogHeader>
        <div className="p-5">
          <div className="mb-4 bg-[#fafbfa] border border-[#edf0ee] rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-[0.1em] font-semibold text-slate-400 mb-1">
              {target.projectName} · {target.phaseName}
            </div>
            <div className="text-[13px] font-semibold text-[#19352d]">
              {target.name}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Owner: {target.role}
            </div>
          </div>

          <Field label="File">
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
              className={cn(
                "flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg py-8 px-4 cursor-pointer transition text-center",
                dragOver
                  ? "border-[#2f6655] bg-[#f0f5f2]"
                  : "border-[#dfe5e1] hover:border-[#b9c9c1]",
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-[#f0f5f2] text-[#2f6655] flex items-center justify-center">
                <UploadCloud size={16} />
              </div>
              {file ? (
                <div className="text-[11px] font-medium text-slate-700">
                  {file.name}
                </div>
              ) : (
                <>
                  <div className="text-[11px] font-medium text-slate-600">
                    Drag a file here, or click to browse
                  </div>
                  <div className="text-[9px] text-slate-400">
                    PDF, image, or Office document
                  </div>
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </Field>

          <Field label="Notes (optional)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything the reviewer should know about this file..."
              className={cn(inputClass, "resize-none")}
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="px-3.5 py-2 h-auto rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!file || submitting}
              onClick={handleSubmit}
              className={cn(
                "px-4 py-2 h-auto rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5",
                file && !submitting
                  ? "bg-[#19352d] text-white hover:bg-[#0f231d]"
                  : "bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed",
              )}
            >
              {submitting ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud size={12} />
                  Upload document
                </>
              )}
            </Button>
          </div>
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
  { id: "actions", label: "Action Required", icon: AlertCircle },
  { id: "documents", label: "Document Control", icon: FileText },
  { id: "execution", label: "Site Execution", icon: Construction },
  { id: "qc", label: "Execution & QC Checks", icon: ListChecks },
  { id: "commercial", label: "Commercial", icon: DollarSign },
  { id: "team", label: "Team Workload", icon: Users },
  { id: "activity", label: "Live Activity", icon: RefreshCw },
];

function TabNav({ active, onChange, counts }) {
  return (
    <Tabs value={active} onValueChange={onChange} className="mb-6">
      <TabsList className="w-full justify-start h-auto bg-transparent p-0 border-b border-[#e4e8e5] rounded-none overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = counts?.[tab.id];
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-semibold whitespace-nowrap rounded-none bg-transparent shadow-none",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#19352d]",
                "text-slate-400 hover:text-slate-600",
                "after:absolute after:left-0 after:right-0 after:-bottom-px after:h-[2px] after:rounded-full",
                "data-[state=active]:after:bg-[#19352d]",
              )}
            >
              <Icon size={13} />
              {tab.label}
              {typeof count === "number" && count > 0 && (
                <Badge
                  className={cn(
                    "ml-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none",
                    active === tab.id
                      ? "bg-[#19352d] text-white hover:bg-[#19352d]"
                      : "bg-[#f0f5f2] text-[#2f6655] hover:bg-[#f0f5f2]",
                  )}
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// ------------------------------------------------------------
// MAIN PAGE
// ------------------------------------------------------------

export default function CommandCenter() {
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
  } = useGetCommandCenterKpisQuery();

  // ---- Portfolio, filtered (drives the Portfolio tab board) ----
  const {
    data: filteredRows = [],
    isLoading: portfolioLoading,
    isError: portfolioError,
    error: portfolioErrorObj,
    refetch: refetchPortfolio,
  } = useGetCommandCenterPortfolioQuery({
    health: healthFilter === "all" ? undefined : healthFilter.toUpperCase(),
    search: debouncedSearch || undefined,
  });

  // ---- Portfolio, unfiltered (drives Site Execution + tab badges
  // that need the whole book of work regardless of the board's
  // filter/search state) ----
  const { data: allRows = [], refetch: refetchAllRows } =
    useGetCommandCenterPortfolioQuery({});

  // ---- Other tabs, each backed by its own endpoint ----
  const { data: actionsData } = useGetCommandCenterActionsQuery();
  const { data: documentsData } = useGetCommandCenterDocumentsQuery();
  const { data: tasksData } = useGetCommandCenterTasksQuery();

  const handleRescan = () => {
    // No dedicated rescan endpoint is exposed yet — this refreshes
    // every live query on the page. Wire a real POST /command-center/rescan
    // (or similar) here once the backend has one.
    refetchKpis();
    refetchPortfolio();
    refetchAllRows();
    flashToast("Refreshed.");
  };

  const handleUploaded = (target) => {
    setUploadTarget(null);
    flashToast(`${target.name} uploaded to ${target.projectName}.`);
  };

  const tabCounts = useMemo(
    () => ({
      actions: actionsData?.length ?? 0,
      documents: documentsData?.stats?.missing ?? 0,
      qc: tasksData?.length ?? 0,
    }),
    [actionsData, documentsData, tasksData],
  );

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#19352d]">
      <main className="px-5 lg:px-7 py-6 max-w-[1700px] mx-auto">
        {/* INTRO */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div>
            <h1 className="text-[28px] lg:text-[32px] font-semibold tracking-[-0.04em] text-[#19352d]">
              Command Centre
            </h1>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
              One operational view across projects, phases, gates, documents,
              checks and site execution — sourced live from your project
              records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRescan}
              className="h-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border-[#dfe5e1] text-[10px] font-semibold text-slate-600 hover:border-[#aebfb5] hover:bg-white"
            >
              <RefreshCw
                size={13}
                className={kpiLoading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <KPI
            label="Live Projects"
            value={kpi.live}
            loading={kpiLoading}
            meta="Active projects"
            icon={BriefcaseBusiness}
            onClick={() => setActiveTab("portfolio")}
          />
          <KPI
            label="Gates Awaiting Approval"
            value={kpi.awaiting}
            loading={kpiLoading}
            meta="100% complete, unsigned"
            icon={ShieldCheck}
            tone="gate"
            onClick={() => {
              setActiveTab("portfolio");
              setHealthFilter("gate");
            }}
          />
          <KPI
            label="Stalled Phases"
            value={kpi.stalled}
            loading={kpiLoading}
            meta="7+ days no activity"
            icon={Clock3}
            tone={kpi.stalled ? "danger" : undefined}
            onClick={() => setActiveTab("actions")}
          />
          <KPI
            label="QC Failures"
            value={kpi.failed}
            loading={kpiLoading}
            meta="Failed checklist items"
            icon={ShieldAlert}
            tone={kpi.failed ? "danger" : undefined}
            onClick={() => setActiveTab("qc")}
          />
          <KPI
            label="Documents Pending"
            value={kpi.docsMissing}
            loading={kpiLoading}
            meta="Mandatory, in open phases"
            icon={FileText}
            tone={kpi.docsMissing ? "danger" : undefined}
            onClick={() => setActiveTab("documents")}
          />
          <KPI
            label="Portfolio Value"
            value={formatINR(kpi.value)}
            loading={kpiLoading}
            meta="Across active projects"
            icon={DollarSign}
            onClick={() => setActiveTab("commercial")}
          />
        </div>

        {/* TABS */}
        <TabNav active={activeTab} onChange={setActiveTab} counts={tabCounts} />

        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <section className="mb-6">
            <SectionHeader
              eyebrow="Portfolio"
              title="Project Execution"
              action="View all projects"
              onAction={() => navigate(ROUTES.projects)}
            />

            <Card className="bg-white border border-[#e4e8e5] rounded-xl px-3 py-2.5 mb-4 flex flex-col md:flex-row gap-2 shadow-none">
              <div className="relative flex-1 max-w-[360px]">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter command centre..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#fafbfa] border-[#edf0ee] text-[10px] text-slate-700 placeholder:text-slate-400 focus-visible:border-[#b9c9c1] focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  ["all", "All Projects"],
                  ["progress", "On Track"],
                  ["gate", "Gate Pending"],
                  ["danger", "Attention"],
                ].map(([value, label]) => (
                  <Button
                    type="button"
                    key={value}
                    onClick={() => setHealthFilter(value)}
                    className={cn(
                      "whitespace-nowrap px-3 h-8 rounded-lg text-[9px] font-semibold transition",
                      healthFilter === value
                        ? "bg-[#19352d] text-white hover:bg-[#0f231d]"
                        : "bg-[#f7f9f7] text-slate-500 hover:bg-[#eef3ef]",
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </Card>

            {portfolioLoading && (
              <Card className="bg-white border border-[#e4e8e5] rounded-xl shadow-none p-0">
                <LoadingRow label="Loading portfolio…" />
              </Card>
            )}
            {portfolioError && (
              <Card className="bg-white border border-[#e4e8e5] rounded-xl shadow-none p-0">
                <ErrorRow
                  error={portfolioErrorObj}
                  onRetry={refetchPortfolio}
                />
              </Card>
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
              />
            )}
          </section>
        )}

        {/* ACTION REQUIRED TAB */}
        {activeTab === "actions" && (
          <section className="mb-6">
            <SectionHeader eyebrow="Blockers" title="Action Required" />
            <ActionRequired onOpen={navigate} />
          </section>
        )}

        {/* DOCUMENT CONTROL TAB */}
        {activeTab === "documents" && (
          <section className="mb-6">
            <SectionHeader
              eyebrow="Evidence"
              title="Document Control"
              action="Open documents module"
              onAction={() => navigate(ROUTES.documents)}
            />
            <DocumentControl onOpen={navigate} onUploadDoc={setUploadTarget} />
          </section>
        )}

        {/* SITE EXECUTION TAB */}
        {activeTab === "execution" && (
          <section className="mb-6">
            <SectionHeader eyebrow="On site" title="Site Execution" />
            <SiteExecution rows={allRows} onOpen={navigate} />
          </section>
        )}

        {/* EXECUTION & QC CHECKS TAB */}
        {activeTab === "qc" && (
          <section className="mb-6">
            <SectionHeader eyebrow="Checklist" title="Execution & QC Checks" />
            <TaskQCPanel onOpen={navigate} />
          </section>
        )}

        {/* COMMERCIAL TAB */}
        {activeTab === "commercial" && (
          <section className="mb-6">
            <SectionHeader eyebrow="BOQ & Costing" title="Commercial" />
            <CommercialPanel onOpen={navigate} />
          </section>
        )}

        {/* TEAM WORKLOAD TAB */}
        {activeTab === "team" && (
          <section className="mb-6">
            <SectionHeader eyebrow="Roles" title="Team Workload" />
            <TeamWorkload onOpen={navigate} />
          </section>
        )}

        {/* LIVE ACTIVITY TAB */}
        {activeTab === "activity" && (
          <section className="mb-6">
            <SectionHeader eyebrow="Activity log" title="Live Activity" />
            <ActivityTimeline />
          </section>
        )}
      </main>

      {uploadTarget && (
        <UploadDocumentModal
          target={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={handleUploaded}
          onFlash={flashToast}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
