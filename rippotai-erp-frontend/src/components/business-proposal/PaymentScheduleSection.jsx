import React, { useMemo } from "react";
import {
  CircleDollarSign,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/* ============================================================
   ACTUAL PAYMENT SCHEDULE FROM PROPOSAL
============================================================ */

const DEFAULT_MILESTONES = [
  {
    code: "M1",
    name: "Booking & mobilisation",
    trigger: "On signing, before site start",
    share: 15,
  },
  {
    code: "M2",
    name: "MEP & waterproofing",
    trigger: "Before Phase 01 mobilises",
    share: 20,
  },
  {
    code: "M3",
    name: "Tiling & POP",
    trigger: "Before Phase 02 mobilises",
    share: 20,
  },
  {
    code: "M4",
    name: "Mill work & joinery",
    trigger: "Before Phase 03 mobilises",
    share: 20,
  },
  {
    code: "M5",
    name: "Fixtures & fittings",
    trigger: "Before Phase 04 mobilises",
    share: 10,
  },
  {
    code: "M6",
    name: "Paint & polish",
    trigger: "Before Phase 05 mobilises",
    share: 10,
  },
  {
    code: "M7",
    name: "Snagging & handover",
    trigger: "On closure of the signed snag list",
    share: 5,
  },
];

/* ============================================================
   ACTUAL KEY TERMS FROM PROPOSAL
============================================================ */

const DEFAULT_KEY_TERMS = [
  {
    id: "invoicing-due-date",
    label: "Invoicing and due date",
    value: "Payment due within three working days of invoice",
  },
  {
    id: "mode-of-payment",
    label: "Mode of payment",
    value:
      "NEFT, RTGS or cheque to the Rippotai account only. No cash, and no payment to anyone at site",
  },
  {
    id: "taxes",
    label: "Taxes",
    value: "All figures exclusive of GST",
  },
  {
    id: "delay-in-release",
    label: "Delay in release",
    value: "Beyond seven days, work may pause. Timeline extends day for day",
  },
  {
    id: "variations",
    label: "Variations",
    value: "Quoted in writing, billed 100% in advance",
  },
  {
    id: "retention",
    label: "Retention",
    value: "Final 5% held until the snag list is signed",
  },
  {
    id: "title-of-materials",
    label: "Title of materials",
    value: "Passes to the Client on full milestone payment",
  },
  {
    id: "jurisdiction",
    label: "Jurisdiction",
    value: "Settled amicably, failing which courts at Delhi",
  },
];

/* ============================================================
   NORMALIZE MILESTONES
============================================================ */

function normalizeMilestones(milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return DEFAULT_MILESTONES.map((milestone) => ({
      ...milestone,
    }));
  }

  return DEFAULT_MILESTONES.map((defaultMilestone) => {
    const existing = milestones.find(
      (milestone) => milestone.code === defaultMilestone.code,
    );

    return existing
      ? {
          ...defaultMilestone,
          ...existing,
          share: Number(existing.share ?? defaultMilestone.share),
        }
      : {
          ...defaultMilestone,
        };
  });
}

/* ============================================================
   NORMALIZE KEY TERMS
============================================================ */

function normalizeKeyTerms(keyTerms) {
  if (!Array.isArray(keyTerms) || keyTerms.length === 0) {
    return DEFAULT_KEY_TERMS.map((term) => ({
      ...term,
    }));
  }

  return DEFAULT_KEY_TERMS.map((defaultTerm) => {
    const existing = keyTerms.find(
      (term) => term.id === defaultTerm.id || term.label === defaultTerm.label,
    );

    return existing
      ? {
          ...defaultTerm,
          ...existing,
        }
      : {
          ...defaultTerm,
        };
  });
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PaymentScheduleSection({ data, onChange }) {
  if (!data) return null;

  const milestones = normalizeMilestones(data.milestones);
  const keyTerms = normalizeKeyTerms(data.keyTerms);

  const normalizedData = {
    ...data,
    milestones,
    keyTerms,
  };

  /* ============================================================
     TOTAL
  ============================================================ */

  const totalShare = useMemo(
    () =>
      milestones.reduce(
        (sum, milestone) => sum + Number(milestone.share || 0),
        0,
      ),
    [milestones],
  );

  const isComplete = totalShare === 100;

  /* ============================================================
     UPDATE DATA
  ============================================================ */

  const updateData = (patch) => {
    onChange({
      ...normalizedData,
      ...patch,
    });
  };

  /* ============================================================
     MILESTONE ACTIONS
  ============================================================ */

  const updateMilestone = (index, key, value) => {
    const next = [...milestones];

    next[index] = {
      ...next[index],
      [key]: key === "share" ? Number(value) : value,
    };

    updateData({
      milestones: next,
    });
  };

  const removeMilestone = (index) => {
    updateData({
      milestones: milestones.filter((_, idx) => idx !== index),
    });
  };

  const addMilestone = () => {
    const nextNumber = milestones.length + 1;

    updateData({
      milestones: [
        ...milestones,
        {
          code: `M${nextNumber}`,
          name: "",
          trigger: "",
          share: 0,
        },
      ],
    });
  };

  /* ============================================================
     KEY TERM ACTIONS
  ============================================================ */

  const updateTerm = (index, value) => {
    const next = [...keyTerms];

    next[index] = {
      ...next[index],
      value,
    };

    updateData({
      keyTerms: next,
    });
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Card>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <CardHeader className="space-y-1">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <CircleDollarSign className="h-5 w-5 text-primary" />
          </div>

          <div>
            <CardTitle>Payment schedule</CardTitle>

            <CardDescription className="mt-1">
              Seven milestones against stages of work — edit before generating
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ====================================================
            INTRODUCTION
        ==================================================== */}

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Each milestone falls due before the corresponding phase is
            mobilised, so material can be ordered and labour deployed without a
            break between phases.
          </p>
        </div>

        {/* ====================================================
            MILESTONES
        ==================================================== */}

        <div className="space-y-3">
          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="w-20 px-4 py-3 text-left font-medium text-muted-foreground">
                    Code
                  </th>

                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Milestone
                  </th>

                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Release trigger
                  </th>

                  <th className="w-28 px-4 py-3 text-right font-medium text-muted-foreground">
                    Share %
                  </th>

                  <th className="w-16 px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {milestones.map((milestone, index) => (
                  <tr
                    key={milestone.id || milestone.code || index}
                    className="border-b last:border-0"
                  >
                    <td className="p-3">
                      <Input
                        value={milestone.code}
                        onChange={(event) =>
                          updateMilestone(index, "code", event.target.value)
                        }
                      />
                    </td>

                    <td className="p-3">
                      <Input
                        value={milestone.name}
                        placeholder="Milestone"
                        onChange={(event) =>
                          updateMilestone(index, "name", event.target.value)
                        }
                      />
                    </td>

                    <td className="p-3">
                      <Input
                        value={milestone.trigger}
                        placeholder="Release trigger"
                        onChange={(event) =>
                          updateMilestone(index, "trigger", event.target.value)
                        }
                      />
                    </td>

                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={milestone.share}
                        onChange={(event) =>
                          updateMilestone(index, "share", event.target.value)
                        }
                        className="text-right"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMilestone(index)}
                        title="Remove milestone"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}

          <div className="space-y-3 md:hidden">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id || milestone.code || index}
                className="rounded-lg border p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Milestone {index + 1}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Code</Label>

                    <Input
                      value={milestone.code}
                      onChange={(event) =>
                        updateMilestone(index, "code", event.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Share %</Label>

                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={milestone.share}
                      onChange={(event) =>
                        updateMilestone(index, "share", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <Label>Milestone</Label>

                  <Input
                    value={milestone.name}
                    placeholder="Milestone"
                    onChange={(event) =>
                      updateMilestone(index, "name", event.target.value)
                    }
                  />
                </div>

                <div className="mt-3 space-y-2">
                  <Label>Release trigger</Label>

                  <Input
                    value={milestone.trigger}
                    placeholder="Release trigger"
                    onChange={(event) =>
                      updateMilestone(index, "trigger", event.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====================================================
            MILESTONE FOOTER
        ==================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={addMilestone}
            className="gap-2 text-primary"
          >
            <Plus className="h-4 w-4" />
            Add milestone
          </Button>

          <div
            className={`flex items-center gap-2 text-sm font-semibold ${
              isComplete ? "text-primary" : "text-amber-600 dark:text-amber-500"
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            Total: {totalShare}%
          </div>
        </div>

        {!isComplete && (
          <p className="text-right text-xs text-amber-600 dark:text-amber-500">
            Payment milestones must total 100%.
          </p>
        )}

        {/* ====================================================
            KEY TERMS
        ==================================================== */}

        <div className="border-t pt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Key terms</h3>

            <p className="mt-1 text-xs text-muted-foreground">
              These terms form part of the proposal payment schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {keyTerms.map((term, index) => (
              <div
                key={term.id || term.label || index}
                className="rounded-lg border p-4"
              >
                <Label className="mb-2 block text-sm font-semibold">
                  {term.label}
                </Label>

                <Input
                  value={term.value}
                  onChange={(event) => updateTerm(index, event.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ====================================================
            AGREEMENT NOTE
        ==================================================== */}

        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Agreement note
          </p>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            The full sixteen-clause Payment Schedule is issued as a separate
            document and forms part of the Agreement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
