import React, { useMemo } from "react";
import {
  CircleDollarSign,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { Card, CardHeader } from "../ui/card";
import { Input } from "../ui/Field";

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

  /*
   * Keep the canonical seven milestones from the proposal.
   *
   * This prevents the form from accidentally drifting into
   * M1/M2/M3-only or generic payment terminology.
   *
   * Existing saved share/name/trigger values are preserved.
   */
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
     UPDATE
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
    const next = milestones.filter((_, idx) => idx !== index);

    updateData({
      milestones: next,
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
      <CardHeader
        icon={CircleDollarSign}
        title="Payment schedule"
        subtitle="Seven milestones against stages of work — edit before generating"
      />

      {/* ========================================================
          INTRODUCTION
      ======================================================== */}

      <div className="mb-5 rounded-lg border border-[var(--stroke)] bg-[var(--mist-soft)] p-4">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Each milestone falls due before the corresponding phase is mobilised,
          so material can be ordered and labour deployed without a break between
          phases.
        </p>
      </div>

      {/* ========================================================
          MILESTONES
      ======================================================== */}

      <div className="table-container">
        <table className="bc-table">
          <thead>
            <tr className="border-b border-[var(--stroke)]">
              <th className="boq-cell w-16 py-2.5">Code</th>

              <th className="boq-cell py-2.5">Milestone</th>

              <th className="boq-cell py-2.5">Release trigger</th>

              <th className="boq-cell num w-28 py-2.5">Share %</th>

              <th className="boq-cell actions py-2.5" />
            </tr>
          </thead>

          <tbody>
            {milestones.map((milestone, index) => (
              <tr
                key={milestone.id || milestone.code || index}
                className="border-b border-[var(--stroke)] last:border-0"
              >
                {/* CODE */}
                <td className="boq-cell">
                  <Input
                    value={milestone.code}
                    onChange={(event) =>
                      updateMilestone(index, "code", event.target.value)
                    }
                  />
                </td>

                {/* NAME */}
                <td className="boq-cell">
                  <Input
                    value={milestone.name}
                    onChange={(event) =>
                      updateMilestone(index, "name", event.target.value)
                    }
                  />
                </td>

                {/* TRIGGER */}
                <td className="boq-cell">
                  <Input
                    value={milestone.trigger}
                    onChange={(event) =>
                      updateMilestone(index, "trigger", event.target.value)
                    }
                  />
                </td>

                {/* SHARE */}
                <td className="boq-cell num">
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

                {/* DELETE */}
                <td className="boq-cell actions">
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--mist-soft)] hover:text-red-600"
                    title="Remove milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================
          MILESTONE FOOTER
      ======================================================== */}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addMilestone}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[var(--ink-green)] hover:bg-[var(--mist-soft)]"
        >
          <Plus className="h-4 w-4" />
          Add milestone
        </button>

        <div
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            isComplete ? "text-[var(--ink-green)]" : "text-amber-600"
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
        <p className="mt-2 text-right text-xs text-amber-600">
          Payment milestones must total 100%.
        </p>
      )}

      {/* ========================================================
          KEY TERMS
      ======================================================== */}

      <div className="mt-8 border-t border-[var(--stroke)] pt-6">
        <span className="eyebrow mb-1 block">Key terms</span>

        <p className="mb-4 text-xs text-[var(--muted)]">
          These terms form part of the proposal payment schedule.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {keyTerms.map((term, index) => (
            <div
              key={term.id || term.label || index}
              className="rounded-lg border border-[var(--stroke)] p-3"
            >
              <p className="mb-1.5 text-sm font-semibold text-[var(--ink-green)]">
                {term.label}
              </p>

              <Input
                value={term.value}
                onChange={(event) => updateTerm(index, event.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          SEPARATE PAYMENT SCHEDULE NOTE
      ======================================================== */}

      <div className="mt-6 rounded-lg border border-[var(--stroke)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Agreement note
        </p>

        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
          The full sixteen-clause Payment Schedule is issued as a separate
          document and forms part of the Agreement.
        </p>
      </div>
    </Card>
  );
}
