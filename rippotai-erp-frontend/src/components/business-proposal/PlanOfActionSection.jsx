import React from "react";
import { CalendarClock, Trash2, Plus } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

/* ============================================================
   PLAN OF ACTION SECTION

   IMPORTANT:
   - Uses ONLY backend POA data.
   - No default phases.
   - No hardcoded proposal content.
   - Backend IDs are preserved.
   - Supports camelCase + snake_case.
============================================================ */

/* ============================================================
   HELPERS
============================================================ */

function valueOrEmpty(value) {
  return value == null ? "" : String(value);
}

function getPhaseLink(phase) {
  return phase?.PlanOfActionPhase || phase?.planOfActionPhase || {};
}

function getPhaseCode(phase, index) {
  return (
    phase?.phase_code ??
    phase?.phaseCode ??
    (phase?.phase_number != null
      ? `PH-${String(phase.phase_number).padStart(2, "0")}`
      : `PH-${String(index + 1).padStart(2, "0")}`)
  );
}

function getPhaseDuration(phase) {
  const link = getPhaseLink(phase);

  const min =
    link.duration_min_days ??
    link.durationMinDays ??
    phase.duration_min_days ??
    phase.durationMinDays ??
    null;

  const max =
    link.duration_max_days ??
    link.durationMaxDays ??
    phase.duration_max_days ??
    phase.durationMaxDays ??
    null;

  if (min != null && max != null) {
    return `${min}–${max} days`;
  }

  if (min != null) {
    return `${min} days`;
  }

  if (max != null) {
    return `${max} days`;
  }

  return "";
}

/* ============================================================
   NORMALIZE EXISTING PHASES

   This does NOT create default phases.

   It only normalizes whatever the backend already returned.
============================================================ */

function normalizePhases(phases) {
  if (!Array.isArray(phases)) {
    return [];
  }

  return phases
    .map((phase, index) => {
      if (!phase) return null;

      const link = getPhaseLink(phase);

      return {
        /* -----------------------------------------
           Backend identity
        ----------------------------------------- */

        id: phase.id || null,

        _phaseId:
          phase._phaseId ||
          phase.id ||
          phase.project_phase_id ||
          phase.projectPhaseId ||
          null,

        _linkId:
          phase._linkId ||
          link.id ||
          phase.plan_of_action_phase_id ||
          phase.planOfActionPhaseId ||
          null,

        /* -----------------------------------------
           Phase information
        ----------------------------------------- */

        phaseNumber: phase.phase_number ?? phase.phaseNumber ?? index + 1,

        code: getPhaseCode(phase, index),

        name: valueOrEmpty(phase.title ?? phase.name),

        detail: valueOrEmpty(phase.description ?? phase.detail),

        /* -----------------------------------------
           Real POA phase configuration
        ----------------------------------------- */

        parallel: valueOrEmpty(
          link.parallel_work_note ??
            link.parallelWorkNote ??
            phase.parallel_work_note ??
            phase.parallelWorkNote ??
            phase.parallel,
        ),

        inclusionNote: valueOrEmpty(
          link.inclusion_note ??
            link.inclusionNote ??
            phase.inclusion_note ??
            phase.inclusionNote,
        ),

        duration: getPhaseDuration(phase),

        durationMinDays:
          link.duration_min_days ??
          link.durationMinDays ??
          phase.duration_min_days ??
          phase.durationMinDays ??
          null,

        durationMaxDays:
          link.duration_max_days ??
          link.durationMaxDays ??
          phase.duration_max_days ??
          phase.durationMaxDays ??
          null,

        ganttStartOffsetDays:
          link.gantt_start_offset_days ?? link.ganttStartOffsetDays ?? 0,

        ganttDurationDays:
          link.gantt_duration_days ?? link.ganttDurationDays ?? 0,

        sortOrder:
          link.sort_order ??
          link.sortOrder ??
          phase.sort_order ??
          phase.sortOrder ??
          index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PlanOfActionSection({ data, onChange }) {
  if (!data) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold">Plan of Action</h3>

            <p className="text-sm text-muted-foreground">
              No Plan of Action has been created for this project.
            </p>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const phases = normalizePhases(data.phases);

  /* ============================================================
     UPDATE
  ============================================================ */

  const updateData = (patch) => {
    onChange({
      ...data,
      ...patch,
    });
  };

  /* ============================================================
     PHASE ACTIONS
  ============================================================ */

  const updatePhase = (index, key, value) => {
    const next = [...phases];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    updateData({
      phases: next,
    });
  };

  const removePhase = (index) => {
    const next = phases.filter((_, phaseIndex) => phaseIndex !== index);

    updateData({
      phases: next,
    });
  };

  const addPhase = () => {
    const nextNumber = phases.length + 1;

    const newPhase = {
      id: null,

      _phaseId: null,

      _linkId: null,

      phaseNumber: nextNumber,

      code: `PH-${String(nextNumber).padStart(2, "0")}`,

      name: "",

      detail: "",

      parallel: "",

      inclusionNote: "",

      duration: "",

      durationMinDays: null,

      durationMaxDays: null,

      ganttStartOffsetDays: 0,

      ganttDurationDays: 0,

      sortOrder: phases.length,
    };

    updateData({
      phases: [...phases, newPhase],
    });
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Card>
      {/* ========================================================
          HEADER
      ======================================================== */}

      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold leading-none tracking-tight">
            {data.title || "Plan of Action"}
          </h3>

          <p className="text-sm text-muted-foreground">
            {data.totalPhases ?? phases.length} execution phase
            {Number(data.totalPhases ?? phases.length) === 1 ? "" : "s"}
            {" · "}
            {data.overallProgramme || "Duration not specified"}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {/* ======================================================
            EXECUTION DESCRIPTION
        ====================================================== */}

        <FormField label="Execution description">
          <Textarea
            rows={4}
            value={data.note ?? ""}
            onChange={(event) =>
              updateData({
                note: event.target.value,
              })
            }
            placeholder="Execution description..."
            className="resize-y"
          />
        </FormField>

        {/* ======================================================
            TOTAL PROGRAMME
        ====================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Overall programme">
            <Input
              value={data.overallProgramme ?? ""}
              onChange={(event) =>
                updateData({
                  overallProgramme: event.target.value,
                })
              }
              placeholder="Backend duration label"
            />
          </FormField>

          <FormField label="Minimum duration">
            <Input
              type="number"
              value={data.totalDurationMinDays ?? ""}
              onChange={(event) =>
                updateData({
                  totalDurationMinDays:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
              placeholder="Days"
            />
          </FormField>

          <FormField label="Maximum duration">
            <Input
              type="number"
              value={data.totalDurationMaxDays ?? ""}
              onChange={(event) =>
                updateData({
                  totalDurationMaxDays:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
              placeholder="Days"
            />
          </FormField>
        </div>

        {/* ======================================================
            PHASES
        ====================================================== */}

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Execution phases
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Phases below are loaded directly from the project Plan of
                Action.
              </p>
            </div>

            <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
              {phases.length} phase{phases.length === 1 ? "" : "s"}
            </span>
          </div>

          {phases.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <CalendarClock className="mx-auto h-6 w-6 text-muted-foreground" />

              <p className="mt-2 text-sm font-medium">No phases found</p>

              <p className="mt-1 text-xs text-muted-foreground">
                The backend Plan of Action does not currently contain any
                phases.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {phases.map((phase, index) => (
                <div
                  key={
                    phase.id ||
                    phase._phaseId ||
                    phase._linkId ||
                    `${phase.code}-${index}`
                  }
                  className="rounded-lg border bg-card p-4"
                >
                  {/* ==================================================
                      PHASE HEADER
                  ================================================== */}

                  <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[100px_minmax(0,1fr)_160px_auto]">
                    {/* CODE */}

                    <Input
                      value={phase.code ?? ""}
                      onChange={(event) =>
                        updatePhase(index, "code", event.target.value)
                      }
                      placeholder="PH-01"
                      aria-label={`Phase ${index + 1} code`}
                    />

                    {/* NAME */}

                    <Input
                      value={phase.name ?? ""}
                      onChange={(event) =>
                        updatePhase(index, "name", event.target.value)
                      }
                      placeholder="Phase name"
                      aria-label={`Phase ${index + 1} name`}
                    />

                    {/* DURATION */}

                    <Input
                      value={phase.duration ?? ""}
                      onChange={(event) =>
                        updatePhase(index, "duration", event.target.value)
                      }
                      placeholder="e.g. 23–45 days"
                      aria-label={`Phase ${index + 1} duration`}
                    />

                    {/* DELETE */}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhase(index)}
                      title="Remove phase"
                      aria-label={`Remove phase ${index + 1}`}
                      className="shrink-0 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* ==================================================
                      DETAIL
                  ================================================== */}

                  <Textarea
                    rows={3}
                    value={phase.detail ?? ""}
                    onChange={(event) =>
                      updatePhase(index, "detail", event.target.value)
                    }
                    placeholder="Phase description"
                    className="mb-2 resize-y"
                  />

                  {/* ==================================================
                      PARALLEL WORK
                  ================================================== */}

                  <Input
                    value={phase.parallel ?? ""}
                    onChange={(event) =>
                      updatePhase(index, "parallel", event.target.value)
                    }
                    placeholder="Parallel work note"
                  />

                  {/* ==================================================
                      INCLUSION NOTE
                  ================================================== */}

                  {phase.inclusionNote && (
                    <div className="mt-2 rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {phase.inclusionNote}
                      </p>
                    </div>
                  )}

                  {/* ==================================================
                      BACKEND META
                  ================================================== */}

                  {(phase._phaseId || phase._linkId) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                      {phase._phaseId && (
                        <span className="rounded border px-2 py-1">
                          Phase ID: {phase._phaseId}
                        </span>
                      )}

                      {phase._linkId && (
                        <span className="rounded border px-2 py-1">
                          POA Phase ID: {phase._linkId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ======================================================
              ADD PHASE
          ====================================================== */}

          <Button
            type="button"
            variant="ghost"
            onClick={addPhase}
            className="mt-3 px-2 text-sm font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add phase
          </Button>
        </div>

        {/* ======================================================
            TERMS SNAPSHOT
        ====================================================== */}

        {data.termsContentSnapshot && (
          <div className="mt-6 border-t pt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Terms & Conditions
            </p>

            <div
              className="prose prose-sm max-w-none rounded-lg border bg-muted/20 p-4"
              dangerouslySetInnerHTML={{
                __html: data.termsContentSnapshot,
              }}
            />
          </div>
        )}

        {/* ======================================================
            STATUS
        ====================================================== */}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-5 text-xs">
          <span className="rounded-full border px-2.5 py-1 font-medium">
            Status: {data.status || "DRAFT"}
          </span>

          <span className="rounded-full border px-2.5 py-1 font-medium">
            Version: {data.version ?? 1}
          </span>

          {data.publishedAt && (
            <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
              Published: {new Date(data.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
