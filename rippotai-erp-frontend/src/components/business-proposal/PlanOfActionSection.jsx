import React from "react";
import { CalendarClock, Trash2, Plus } from "lucide-react";

import { Card, CardHeader } from "../ui/card";
import { Field, Input, Textarea } from "../ui/Field";

/* ============================================================
   ACTUAL PLAN OF ACTION FROM PROPOSAL
============================================================ */

const DEFAULT_PHASES = [
  {
    code: "01",
    name: "MEP & Waterproofing",
    detail:
      "Waterproofing of wet areas and terraces, AC piping and ducting, concealed wiring and plumbing lines.",
    parallel: "PARALLEL — OVERALL MATERIAL SELECTION",
    duration: "30–45 days",
  },
  {
    code: "02",
    name: "Tiling & POP",
    detail:
      "Floor and wall tiling, stone and dado work, POP punning, false ceiling framing and cove detailing.",
    parallel: "PARALLEL — LOOSE FURNITURE FINALISATION",
    duration: "25–30 days",
  },
  {
    code: "03",
    name: "Mill Work & Joinery",
    detail:
      "Modular kitchen, wardrobes, vanities and site-fabricated mill work, with the first coat of paint.",
    parallel: "INCLUDES — PAINT 1ST COAT",
    duration: "30–40 days",
  },
  {
    code: "04",
    name: "Fixtures & Fittings",
    detail:
      "Light fixtures, electrical fittings and appliances, CP fittings and sanitaryware, hardware and accessories.",
    parallel: "",
    duration: "12–15 days",
  },
  {
    code: "05",
    name: "Paint & Polish",
    detail:
      "Final coat on all walls and ceilings, polishing of wood work and veneer, touch-ups and edge finishing.",
    parallel: "",
    duration: "15–20 days",
  },
  {
    code: "06",
    name: "Snagging",
    detail:
      "Joint walkthrough room by room, written defect list, closure of every recorded item.",
    parallel: "",
    duration: "7–10 days",
  },
  {
    code: "07",
    name: "Handover",
    detail:
      "Deep clean, final walkthrough, keys, warranty cards and as-built service drawings.",
    parallel: "",
    duration: "3–5 days",
  },
];

const DEFAULT_OVERALL_PROGRAMME = "4–5 months";

const DEFAULT_NOTE =
  "Durations run from mobilisation of that phase and assume decisions within forty-eight hours and payments released on time. Statutory construction restrictions and material lead times extend the programme proportionately.";

/* ============================================================
   NORMALIZE PHASES
============================================================ */

function normalizePhases(phases) {
  if (!Array.isArray(phases) || phases.length === 0) {
    return DEFAULT_PHASES.map((phase) => ({
      ...phase,
    }));
  }

  /*
   * The proposal has seven canonical phases.
   *
   * We use the proposal as the source of truth while
   * preserving any saved edits made by the user.
   */
  return DEFAULT_PHASES.map((defaultPhase) => {
    const existing = phases.find((phase) => phase.code === defaultPhase.code);

    return existing
      ? {
          ...defaultPhase,
          ...existing,
        }
      : {
          ...defaultPhase,
        };
  });
}

/* ============================================================
   COMPONENT
============================================================ */

export default function PlanOfActionSection({ data, onChange }) {
  if (!data) return null;

  const phases = normalizePhases(data.phases);

  const normalizedData = {
    ...data,
    phases,
    overallProgramme: data.overallProgramme || DEFAULT_OVERALL_PROGRAMME,
    note: data.note || DEFAULT_NOTE,
  };

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

    updateData({
      phases: [
        ...phases,
        {
          code: String(nextNumber).padStart(2, "0"),
          name: "",
          detail: "",
          parallel: "",
          duration: "",
        },
      ],
    });
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Card>
      <CardHeader
        icon={CalendarClock}
        title="Plan of action"
        subtitle="Seven execution phases sequenced at site — edit before generating"
      />

      {/* ========================================================
          PROGRAMME INTRO
      ======================================================== */}

      <div className="mb-6 rounded-lg border border-[var(--stroke)] bg-[var(--mist-soft)] p-4">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Seven phases, sequenced at site. Phases overlap where the trade
          allows, which is how four to five months of work compresses into the
          stated programme.
        </p>
      </div>

      {/* ========================================================
          PHASES
      ======================================================== */}

      <div className="space-y-3">
        {phases.map((phase, index) => (
          <div
            key={phase.id || phase.code || index}
            className="rounded-lg border border-[var(--stroke)] p-4"
          >
            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="mb-3 grid grid-cols-[64px_1fr_140px_auto] items-start gap-2">
              {/* CODE */}

              <Input
                value={phase.code}
                onChange={(event) =>
                  updatePhase(index, "code", event.target.value)
                }
              />

              {/* NAME */}

              <Input
                value={phase.name}
                onChange={(event) =>
                  updatePhase(index, "name", event.target.value)
                }
                placeholder="Phase name"
              />

              {/* DURATION */}

              <Input
                value={phase.duration}
                onChange={(event) =>
                  updatePhase(index, "duration", event.target.value)
                }
                placeholder="Duration"
              />

              {/* DELETE */}

              <button
                type="button"
                onClick={() => removePhase(index)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--mist-soft)] hover:text-red-600"
                title="Remove phase"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* ==================================================
                DETAIL
            ================================================== */}

            <Textarea
              rows={3}
              value={phase.detail}
              onChange={(event) =>
                updatePhase(index, "detail", event.target.value)
              }
              placeholder="What happens in this phase"
              className="mb-2"
            />

            {/* ==================================================
                PARALLEL / SPECIAL NOTE
            ================================================== */}

            <Input
              value={phase.parallel}
              onChange={(event) =>
                updatePhase(index, "parallel", event.target.value)
              }
              placeholder="Parallel / special note"
            />
          </div>
        ))}

        {/* ======================================================
            ADD PHASE
        ====================================================== */}

        <button
          type="button"
          onClick={addPhase}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[var(--ink-green)] hover:bg-[var(--mist-soft)]"
        >
          <Plus className="h-4 w-4" />
          Add phase
        </button>
      </div>

      {/* ========================================================
          PROGRAMME DETAILS
      ======================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* OVERALL PROGRAMME */}

        <Field label="Overall programme">
          <Input
            value={normalizedData.overallProgramme}
            onChange={(event) =>
              updateData({
                overallProgramme: event.target.value,
              })
            }
          />
        </Field>

        {/* NOTE */}

        <Field label="Programme note">
          <Textarea
            rows={3}
            value={normalizedData.note}
            onChange={(event) =>
              updateData({
                note: event.target.value,
              })
            }
          />
        </Field>
      </div>

      {/* ========================================================
          PROGRAMME CONDITIONS
      ======================================================== */}

      <div className="mt-6 border-t border-[var(--stroke)] pt-5">
        <p className="eyebrow mb-2">Programme conditions</p>

        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-[var(--stroke)] p-3">
            <p className="font-semibold">Decision turnaround</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Decisions within forty-eight hours.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--stroke)] p-3">
            <p className="font-semibold">Payment release</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Payments released on time.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--stroke)] p-3">
            <p className="font-semibold">External restrictions</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Statutory construction restrictions and material lead times can
              extend the programme proportionately.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
