import React, { useState } from "react";
import { ListChecks, Save, CheckCircle2, GripVertical } from "lucide-react";

import { Card, CardHeader } from "../ui/card";
import { Checkbox, Input, Textarea } from "../ui/Field";
import { Button } from "../ui/button";
import { saveNextSteps } from "../../lib/mockApi";

/* ============================================================
   ACTUAL PROPOSAL CONTENT
   Based on BUSINESS PROPOSAL_removed.pdf
============================================================ */

const DEFAULT_STEPS = [
  {
    id: "review-proposal",
    title: "Review this proposal",
    detail:
      "Take a week. Mark anything unclear. We will walk it through with you.",
    done: false,
  },
  {
    id: "confirm-scope",
    title: "Confirm the scope",
    detail:
      "Tick the engagement and optional items. We revise the BOQ against your ticks.",
    done: false,
  },
  {
    id: "freeze-cost",
    title: "Freeze cost at Gate 02",
    detail:
      "BOQ priced line by line and signed. The estimate becomes a firm number.",
    done: false,
  },
  {
    id: "sign-agreement",
    title: "Sign the Agreement",
    detail:
      "Scope of Work, Payment Schedule, Plan of Action issued together for signature.",
    done: false,
  },
  {
    id: "release-m1",
    title: "Release M1 and mobilise",
    detail:
      "15% booking and mobilisation. Site team on the ground within five days.",
    done: false,
  },
];

const DEFAULT_CHECKLIST = [
  {
    id: "signed-agreement",
    label: "Signed Scope of Work and Agreement",
    done: false,
  },
  {
    id: "booking-payment",
    label: "Booking and mobilisation payment",
    done: false,
  },
  {
    id: "society-permission",
    label: "Society permission for work and material lift",
    done: false,
  },
  {
    id: "site-access",
    label: "Access, keys and a point of contact at site",
    done: false,
  },
  {
    id: "water-power",
    label: "Water and power connection at the unit",
    done: false,
  },
  {
    id: "client-material",
    label: "Any client-supplied material schedule",
    done: false,
  },
];

/* ============================================================
   NORMALIZE DATA
============================================================ */

function normalizeSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return DEFAULT_STEPS.map((step) => ({ ...step }));
  }

  /*
   * Keep the proposal's five canonical steps.
   * Preserve the saved `done` state from the API.
   */
  return DEFAULT_STEPS.map((defaultStep) => {
    const existing = steps.find((step) => step.id === defaultStep.id);

    return existing
      ? {
          ...defaultStep,
          ...existing,
          done: Boolean(existing.done),
        }
      : {
          ...defaultStep,
        };
  });
}

function normalizeChecklist(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return DEFAULT_CHECKLIST.map((item) => ({ ...item }));
  }

  /*
   * Keep the six canonical checklist items.
   * Preserve saved completion state.
   */
  return DEFAULT_CHECKLIST.map((defaultItem) => {
    const existing = checklist.find((item) => item.id === defaultItem.id);

    return existing
      ? {
          ...defaultItem,
          ...existing,
          done: Boolean(existing.done),
        }
      : {
          ...defaultItem,
        };
  });
}

/* ============================================================
   COMPONENT
============================================================ */

export default function NextStepsSection({ data, onChange, projectId }) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);

  if (!data) return null;

  const steps = normalizeSteps(data.steps);
  const checklist = normalizeChecklist(data.checklist);

  const normalizedData = {
    ...data,
    steps,
    checklist,
  };

  const updateData = (patch) => {
    onChange({
      ...normalizedData,
      ...patch,
    });

    /*
     * Once the user changes something, remove the
     * previous success indicator.
     */
    setSavedAt(null);
    setSaveError(null);
  };

  /* ============================================================
     STEP ACTIONS
  ============================================================ */

  const toggleStep = (id) => {
    updateData({
      steps: steps.map((step) =>
        step.id === id
          ? {
              ...step,
              done: !step.done,
            }
          : step,
      ),
    });
  };

  const updateStepField = (id, key, value) => {
    updateData({
      steps: steps.map((step) =>
        step.id === id
          ? {
              ...step,
              [key]: value,
            }
          : step,
      ),
    });
  };

  /* ============================================================
     CHECKLIST ACTIONS
  ============================================================ */

  const toggleChecklist = (id) => {
    updateData({
      checklist: checklist.map((item) =>
        item.id === id
          ? {
              ...item,
              done: !item.done,
            }
          : item,
      ),
    });
  };

  /* ============================================================
     SAVE
  ============================================================ */

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const res = await saveNextSteps(projectId, normalizedData);

      if (res?.ok) {
        setSavedAt(res.savedAt || new Date().toISOString());
      } else {
        setSaveError(res?.message || "Unable to save next-step progress.");
      }
    } catch (error) {
      console.error("Failed to save next steps:", error);

      setSaveError(error?.message || "Unable to save next-step progress.");
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     PROGRESS
  ============================================================ */

  const completedSteps = steps.filter((step) => step.done).length;

  const completedChecklist = checklist.filter((item) => item.done).length;

  const totalProgressItems = steps.length + checklist.length;

  const completedProgressItems = completedSteps + completedChecklist;

  const progress =
    totalProgressItems > 0
      ? Math.round((completedProgressItems / totalProgressItems) * 100)
      : 0;

  return (
    <Card>
      {/* ========================================================
          HEADER
      ======================================================== */}

      <CardHeader
        icon={ListChecks}
        title="Next steps"
        subtitle="Five things stand between this proposal and a live site. Most clients clear them inside a fortnight."
        action={
          <Button
            type="button"
            onClick={handleSave}
            loading={saving}
            className="!min-h-[36px] !px-3 !text-[13px]"
          >
            <Save className="h-3.5 w-3.5" />
            Save progress
          </Button>
        }
      />

      {/* ========================================================
          SAVE STATUS
      ======================================================== */}

      {savedAt && (
        <div className="mb-4 flex items-center gap-1.5 rounded-lg border border-[var(--stroke)] bg-[var(--mist-soft)] px-3 py-2 text-xs font-medium text-[var(--ink-green)]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Saved at {new Date(savedAt).toLocaleTimeString()}
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {saveError}
        </div>
      )}

      {/* ========================================================
          PROGRESS
      ======================================================== */}

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Progress
          </span>

          <span className="text-xs font-semibold text-[var(--ink-green)]">
            {completedProgressItems}/{totalProgressItems}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--mist-soft)]">
          <div
            className="h-full rounded-full bg-[var(--ink-green)] transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* ========================================================
          FIVE NEXT STEPS
      ======================================================== */}

      <div>
        <p className="eyebrow mb-3">Next steps</p>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`rounded-lg border p-4 transition ${
                step.done
                  ? "border-[var(--ink-green)]/20 bg-[var(--mist-soft)]"
                  : "border-[var(--stroke)]"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* NUMBER */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    step.done
                      ? "border-[var(--ink-green)] bg-[var(--ink-green)] text-white"
                      : "border-[var(--stroke)] text-[var(--sage)]"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                {/* CHECKBOX */}
                <div className="pt-1">
                  <Checkbox
                    checked={step.done}
                    onChange={() => toggleStep(step.id)}
                  />
                </div>

                {/* CONTENT */}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={step.title}
                    onChange={(e) =>
                      updateStepField(step.id, "title", e.target.value)
                    }
                    className={`!min-h-[36px] font-semibold ${
                      step.done ? "line-through opacity-60" : ""
                    }`}
                  />

                  <Textarea
                    rows={2}
                    value={step.detail}
                    onChange={(e) =>
                      updateStepField(step.id, "detail", e.target.value)
                    }
                    className={step.done ? "opacity-60" : ""}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          WHAT WE NEED FROM YOU TO START
      ======================================================== */}

      <div className="mt-8 border-t border-[var(--stroke)] pt-6">
        <p className="eyebrow mb-1">What we need from you to start</p>

        <p className="mb-4 text-xs text-[var(--muted)]">
          Complete these items before mobilisation.
        </p>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-3 transition ${
                item.done
                  ? "border-[var(--ink-green)]/20 bg-[var(--mist-soft)]"
                  : "border-[var(--stroke)]"
              }`}
            >
              <Checkbox
                checked={item.done}
                onChange={() => toggleChecklist(item.id)}
                label={item.label}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          M1 MOBILISATION NOTE
      ======================================================== */}

      <div className="mt-6 rounded-lg border border-[var(--stroke)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Release M1 and mobilise
        </p>

        <p className="mt-1 text-sm font-medium">15% booking and mobilisation</p>

        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
          Site team on the ground within five days.
        </p>
      </div>
    </Card>
  );
}
