import React, { useMemo, useState } from "react";
import { ListChecks, Save, CheckCircle2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import { saveNextSteps } from "../../lib/mockApi";

/* ============================================================
   ACTUAL PROPOSAL CONTENT
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
   NORMALIZE STEPS
============================================================ */

function normalizeSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return DEFAULT_STEPS.map((step) => ({
      ...step,
    }));
  }

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

/* ============================================================
   NORMALIZE CHECKLIST
============================================================ */

function normalizeChecklist(checklist) {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return DEFAULT_CHECKLIST.map((item) => ({
      ...item,
    }));
  }

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

  /* ============================================================
     SAFE DATA
  ============================================================ */

  const normalizedData = useMemo(() => {
    if (!data) return null;

    return {
      ...data,
      steps: normalizeSteps(data.steps),
      checklist: normalizeChecklist(data.checklist),
    };
  }, [data]);

  if (!normalizedData) return null;

  const { steps, checklist } = normalizedData;

  /* ============================================================
     UPDATE DATA
  ============================================================ */

  const updateData = (patch) => {
    onChange({
      ...normalizedData,
      ...patch,
    });

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

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Card className="w-full">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mist-soft)] text-[var(--ink-green)]">
            <ListChecks className="h-5 w-5" />
          </div>

          <div>
            <CardTitle className="text-base sm:text-lg">Next steps</CardTitle>

            <CardDescription className="mt-1 max-w-2xl text-xs sm:text-sm">
              Five things stand between this proposal and a live site. Most
              clients clear them inside a fortnight.
            </CardDescription>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="w-full shrink-0 sm:w-auto"
        >
          <Save className="h-4 w-4" />

          {saving ? "Saving..." : "Save progress"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ======================================================
            SAVE STATUS
        ====================================================== */}

        {savedAt && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-[var(--mist-soft)] px-3 py-2 text-xs font-medium text-[var(--ink-green)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            <span>Saved at {new Date(savedAt).toLocaleTimeString()}</span>
          </div>
        )}

        {saveError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
          >
            {saveError}
          </div>
        )}

        {/* ======================================================
            PROGRESS
        ====================================================== */}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Progress
            </span>

            <span className="text-xs font-semibold text-[var(--ink-green)]">
              {completedProgressItems}/{totalProgressItems}
            </span>
          </div>

          <div
            className="h-2 w-full overflow-hidden rounded-full bg-[var(--mist-soft)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-[var(--ink-green)] transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="mt-1.5 text-right text-[11px] text-[var(--muted)]">
            {progress}% complete
          </p>
        </div>

        {/* ======================================================
            FIVE NEXT STEPS
        ====================================================== */}

        <section>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Next steps
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              Complete each step as the proposal moves toward mobilisation.
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const titleId = `${step.id}-title`;
              const detailId = `${step.id}-detail`;

              return (
                <div
                  key={step.id}
                  className={[
                    "rounded-xl border p-4 transition-colors",
                    step.done
                      ? "border-[var(--ink-green)]/20 bg-[var(--mist-soft)]"
                      : "border-[var(--stroke)]",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* NUMBER */}

                    <div
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        step.done
                          ? "border-[var(--ink-green)] bg-[var(--ink-green)] text-white"
                          : "border-[var(--stroke)] text-[var(--sage)]",
                      ].join(" ")}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        {/* CHECKBOX */}

                        <div className="pt-2">
                          <Checkbox
                            id={`${step.id}-checkbox`}
                            checked={step.done}
                            onCheckedChange={() => toggleStep(step.id)}
                            aria-label={`Mark "${step.title}" as ${
                              step.done ? "incomplete" : "complete"
                            }`}
                          />
                        </div>

                        {/* FIELDS */}

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={titleId} className="sr-only">
                              Step title
                            </Label>

                            <Input
                              id={titleId}
                              value={step.title}
                              onChange={(event) =>
                                updateStepField(
                                  step.id,
                                  "title",
                                  event.target.value,
                                )
                              }
                              className={[
                                "font-semibold",
                                step.done ? "line-through opacity-60" : "",
                              ].join(" ")}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={detailId} className="sr-only">
                              Step details
                            </Label>

                            <Textarea
                              id={detailId}
                              rows={2}
                              value={step.detail}
                              onChange={(event) =>
                                updateStepField(
                                  step.id,
                                  "detail",
                                  event.target.value,
                                )
                              }
                              className={step.done ? "opacity-60" : ""}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================
            WHAT WE NEED FROM YOU TO START
        ====================================================== */}

        <section className="border-t border-[var(--stroke)] pt-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              What we need from you to start
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              Complete these items before mobilisation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {checklist.map((item) => {
              const checkboxId = `checklist-${item.id}`;

              return (
                <label
                  key={item.id}
                  htmlFor={checkboxId}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                    item.done
                      ? "border-[var(--ink-green)]/20 bg-[var(--mist-soft)]"
                      : "border-[var(--stroke)] hover:bg-[var(--mist-soft)]",
                  ].join(" ")}
                >
                  <Checkbox
                    id={checkboxId}
                    checked={item.done}
                    onCheckedChange={() => toggleChecklist(item.id)}
                    className="mt-0.5"
                  />

                  <span
                    className={[
                      "text-sm leading-5",
                      item.done
                        ? "text-[var(--muted)] line-through"
                        : "text-foreground",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ======================================================
            M1 MOBILISATION NOTE
        ====================================================== */}

        <div className="rounded-xl border border-[var(--stroke)] bg-[var(--mist-soft)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Release M1 and mobilise
          </p>

          <p className="mt-1 text-sm font-semibold">
            15% booking and mobilisation
          </p>

          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            Site team on the ground within five days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
