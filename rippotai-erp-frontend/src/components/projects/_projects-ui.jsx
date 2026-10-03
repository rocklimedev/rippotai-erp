// Shared bits for the Projects module (dashboard, workspace, planner, documents).
// Presentation + phase-status helpers only — no data fetching lives here.
import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/inos";
import "./projects-ui.css";

const cx = (...c) => c.filter(Boolean).join(" ");

/* ============================================================
   Formatting
============================================================ */

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const prettyLabel = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (m) => m.toUpperCase());

/* ============================================================
   Phase status

   The document phase tree reports `isComplete: true` for a phase
   with zero configured documents (nothing required → vacuously
   complete). That made a brand-new project read "11 of 11 phases
   completed / 100%". A phase is only complete when the data says so
   AND something was actually delivered in it.
============================================================ */

export const treePhaseIsComplete = (phase) => {
  const s = phase?.summary;
  if (s && typeof s.total === "number") {
    return Boolean(phase?.isComplete) && s.total > 0 && (s.uploaded ?? 0) > 0;
  }
  return phase?.isComplete === true;
};

const treePhaseHasActivity = (phase) => (phase?.summary?.uploaded ?? 0) > 0;

/** tree phases → [{id, name, status: done|current|upcoming, docCounts, pendingDocumentName}] */
export function normalizeTreePhases(treePhases = []) {
  const sorted = [...treePhases].sort(
    (a, b) => (a?.sortOrder ?? a?.phaseNumber ?? 0) - (b?.sortOrder ?? b?.phaseNumber ?? 0),
  );
  if (!sorted.length) return [];

  const started = sorted.some((p) => treePhaseIsComplete(p) || treePhaseHasActivity(p));
  const firstOpen = sorted.findIndex((p) => !treePhaseIsComplete(p));

  return sorted.map((phase, index) => {
    const done = treePhaseIsComplete(phase);
    const current = !done && started && index === firstOpen;
    const s = phase?.summary;
    return {
      id: phase?.id || phase?.phaseCode || `phase-${index}`,
      name: cleanPhaseName(phase?.title || phase?.phaseCode || phase?.name || "Untitled phase"),
      status: done ? "done" : current ? "current" : "upcoming",
      docCounts: s ? { uploaded: s.uploaded ?? 0, total: s.total ?? 0 } : null,
      pendingDocumentName: current ? nextPendingDocument(phase) : null,
    };
  });
}

/** Phases embedded on a project object (legacy shape) with explicit statuses. */
export function normalizeEmbeddedPhases(phases = []) {
  return phases.map((phase, index) => {
    const raw = String(phase?.status || phase?.phase_status || phase?.state || "").toLowerCase();
    let status = "upcoming";
    if (["completed", "complete", "cleared", "done", "finished"].includes(raw) || phase?.completed === true || phase?.isComplete === true) status = "done";
    else if (["current", "active", "in_progress", "in-progress", "working"].includes(raw) || phase?.current === true || phase?.isCurrent === true) status = "current";
    return {
      id: phase?.id || phase?.phaseId || phase?.phase_id || phase?.code || `phase-${index}`,
      name: cleanPhaseName(phase?.name || phase?.title || phase?.phase_name || phase?.phaseName || phase?.label || "Untitled phase"),
      status,
      docCounts: null,
      pendingDocumentName: null,
    };
  });
}

/** /projects/:id/phases response → same normalized shape */
export function normalizeWorkspacePhases(data) {
  const list = Array.isArray(data?.phases) ? data.phases : [];
  const firstOpen = list.findIndex((p) => !p.complete);
  const started = list.some((p) => p.complete || (p.completed_subphases || 0) > 0);
  return list.map((p, index) => ({
    id: p.key || `phase-${index}`,
    name: cleanPhaseName(p.name || "Phase"),
    status: p.complete ? "done" : started && index === firstOpen ? "current" : "upcoming",
    docCounts: p.subphase_count ? { uploaded: p.completed_subphases || 0, total: p.subphase_count, unit: "units" } : null,
    pendingDocumentName: null,
  }));
}

function nextPendingDocument(phase) {
  const docs = Array.isArray(phase?.documents) ? phase.documents : [];
  const pending = docs.filter((d) => !d?.isUploaded).sort((a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0));
  return (pending.find((d) => d?.requirementType === "REQUIRED") || pending[0])?.name || null;
}

/**
 * Command Center rollup (GET /command-center/projects/:id/phases or a /portfolio row) → the
 * normalized phase shape. This is THE source of truth for "where is a project": the gate engine's
 * current phase + evidence-based document/task completion. The project page, the projects list
 * and the Command Center all read it, so they always show the same phase and %.
 */
export function normalizeCommandCenterPhases(row) {
  const list = Array.isArray(row?.phases) ? [...row.phases] : [];
  list.sort((a, b) => (a.phaseNumber ?? 0) - (b.phaseNumber ?? 0));
  return list.map((p) => ({
    id: p.id || p.code,
    code: p.code,
    phaseNumber: p.phaseNumber,
    name: cleanPhaseName(p.name || p.code || "Phase"),
    status:
      p.phaseNumber === row.currentPhaseSeq && String(p.state).toUpperCase() !== "COMPLETE"
        ? "current"
        : String(p.state).toUpperCase() === "COMPLETE"
          ? "done"
          : p.phaseNumber === row.currentPhaseSeq
            ? "current"
            : "upcoming",
    state: p.state,
    docCounts: { uploaded: p.docsDone ?? 0, total: p.docsTotal ?? 0 },
    pendingDocumentName: null,
  }));
}

/** Progress for a Command Center row: same % and current phase as the Command Center shows. */
export function commandCenterProgress(row, phases = normalizeCommandCenterPhases(row)) {
  const base = phaseProgress(phases);
  const currentIndex = phases.findIndex((p) => p.phaseNumber === row?.currentPhaseSeq);
  return {
    ...base,
    current: currentIndex >= 0 ? phases[currentIndex] : base.current,
    currentNumber: currentIndex >= 0 ? currentIndex + 1 : base.currentNumber,
    percent: Math.round(Number(row?.pct) || 0),
    started: (Number(row?.pct) || 0) > 0 || base.started,
  };
}

/** "01 BRIEF" → "Brief", "A VENDOR TRADES" → "Vendor trades" */
export function cleanPhaseName(name) {
  const s = String(name || "").trim();
  const stripped = s.replace(/^(\d{1,2}|[A-Z])[\s._-]+(?=[A-Za-z])/, "");
  const base = stripped || s;
  if (base === base.toUpperCase()) return base.charAt(0) + base.slice(1).toLowerCase();
  return base;
}

export function phaseProgress(phases = []) {
  const total = phases.length;
  const done = phases.filter((p) => p.status === "done").length;
  const currentIndex = phases.findIndex((p) => p.status === "current");
  const current = currentIndex >= 0 ? phases[currentIndex] : null;
  return {
    total,
    done,
    current,
    currentNumber: currentIndex >= 0 ? currentIndex + 1 : null,
    percent: total ? Math.round((done / total) * 100) : 0,
    started: done > 0 || Boolean(current),
  };
}

/* ============================================================
   Components
============================================================ */

/** Slim dot stepper — dots only, current highlighted. */
export function PhaseStepper({ phases = [], label }) {
  if (!phases.length) return null;
  return (
    <div className="pj-stepper" role="list" aria-label={label || "Project phases"}>
      {phases.map((p, i) => (
        <div
          key={p.id}
          role="listitem"
          className={cx("pj-step", p.status === "done" && "is-done", p.status === "current" && "is-current")}
          title={`${p.name} — ${p.status === "done" ? "Completed" : p.status === "current" ? "In progress" : "Upcoming"}${
            p.docCounts ? ` · ${p.docCounts.uploaded}/${p.docCounts.total} docs` : ""
          }`}
        >
          <span className="pj-step__dot" />
          {i < phases.length - 1 && <span className="pj-step__line" />}
        </div>
      ))}
    </div>
  );
}

/** Stepper with a label under each dot (project workspace). */
export function PhaseTrack({ phases = [] }) {
  return (
    <div className="pj-phase-track">
      <div className="pj-phase-track__inner" role="list">
        {phases.map((p) => (
          <div key={p.id} role="listitem" className={cx("pj-phase-cell", `is-${p.status}`)}>
            <span className="pj-step__dot" />
            <span className="pj-phase-cell__name">{p.name}</span>
            <span className="pj-phase-cell__sub">
              {p.status === "done" ? "Completed" : p.status === "current" ? "In progress" : "Upcoming"}
              {p.docCounts && p.docCounts.total > 0 ? ` · ${p.docCounts.uploaded}/${p.docCounts.total}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhaseLegend() {
  return (
    <div className="pj-legend" aria-hidden>
      <span className="is-done"><i className="pj-step__dot" />Completed</span>
      <span className="is-current"><i className="pj-step__dot" />Current</span>
      <span><i className="pj-step__dot" />Upcoming</span>
    </div>
  );
}

export function Skeleton({ height = 72, style }) {
  return <div className="pj-skel" style={{ height, ...style }} aria-hidden />;
}

/** Lightweight modal in the design system (overlay + card, Esc/overlay to close). */
export function Modal({ open, onClose, title, description, children, footer, width = 480, testId }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="pj-modal-overlay" onClick={onClose}>
      <div
        className="pj-modal"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        data-testid={testId}
      >
        <div className="pj-modal__head">
          <div>
            <h2 className="pj-modal__title">{title}</h2>
            {description && <p className="pj-modal__desc">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" icon={X} aria-label="Close" onClick={onClose} />
        </div>
        <div className="pj-modal__body">{children}</div>
        {footer && <div className="pj-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
