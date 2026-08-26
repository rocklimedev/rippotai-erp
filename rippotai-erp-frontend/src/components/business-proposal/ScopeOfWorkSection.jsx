import React from "react";
import { ClipboardList, Trash2, Plus } from "lucide-react";

import { Card, CardHeader } from "../ui/card";
import { Field, Input, Textarea } from "../ui/Field";

import EditableList from "./EditableList";

export default function ScopeOfWorkSection({ data, onChange }) {
  if (!data) return null;

  /* ============================================================
     SAFE DATA
  ============================================================ */

  const included = Array.isArray(data.included) ? data.included : [];

  const notIncluded = Array.isArray(data.notIncluded) ? data.notIncluded : [];

  const optional = Array.isArray(data.optional) ? data.optional : [];

  const disciplines = Array.isArray(data.disciplines) ? data.disciplines : [];

  /* ============================================================
     GENERIC UPDATE
  ============================================================ */

  const updateData = (patch) => {
    onChange({
      ...data,
      ...patch,
    });
  };

  const setList = (key) => (list) => {
    updateData({
      [key]: list,
    });
  };

  /* ============================================================
     DISCIPLINES
  ============================================================ */

  const updateDiscipline = (index, key, value) => {
    const next = [...disciplines];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    updateData({
      disciplines: next,
    });
  };

  const removeDiscipline = (index) => {
    updateData({
      disciplines: disciplines.filter(
        (_, disciplineIndex) => disciplineIndex !== index,
      ),
    });
  };

  const addDiscipline = () => {
    updateData({
      disciplines: [
        ...disciplines,
        {
          name: "",
          items: "",
        },
      ],
    });
  };

  return (
    <Card>
      <CardHeader
        icon={ClipboardList}
        title="Scope of work"
        subtitle="Fetched from the scope record — edit before generating"
      />

      {/* ========================================================
          INCLUDED / NOT INCLUDED / OPTIONAL
      ======================================================== */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* INCLUDED */}

        <Field label="Included">
          <EditableList items={included} onChange={setList("included")} />
        </Field>

        {/* NOT INCLUDED */}

        <Field label="Not included">
          <EditableList items={notIncluded} onChange={setList("notIncluded")} />
        </Field>

        {/* OPTIONAL */}

        <Field label="Optional — quoted separately">
          <EditableList items={optional} onChange={setList("optional")} />
        </Field>
      </div>

      {/* ========================================================
          SCOPE BY DISCIPLINE
      ======================================================== */}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <span className="eyebrow block">Scope by discipline</span>

            <p className="mt-1 text-xs text-[var(--muted)]">
              Define the disciplines and the work covered under each one.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {disciplines.map((discipline, index) => (
            <div
              key={discipline.id || `discipline-${index}`}
              className="rounded-lg border border-[var(--stroke)] p-4"
            >
              {/* ==================================================
                  DISCIPLINE HEADER
              ================================================== */}

              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    value={discipline.name ?? ""}
                    onChange={(event) =>
                      updateDiscipline(index, "name", event.target.value)
                    }
                    placeholder="Discipline name"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeDiscipline(index)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--mist-soft)] hover:text-red-600"
                  title="Remove discipline"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* ==================================================
                  DISCIPLINE ITEMS
              ================================================== */}

              <Textarea
                rows={3}
                value={discipline.items ?? ""}
                onChange={(event) =>
                  updateDiscipline(index, "items", event.target.value)
                }
                placeholder="Describe the items covered under this discipline..."
              />

              <p className="mt-1.5 text-[11px] text-[var(--muted)]">
                Separate multiple items with "·" if you want them displayed as a
                compact list in the proposal.
              </p>
            </div>
          ))}

          {/* ======================================================
              EMPTY STATE
          ====================================================== */}

          {disciplines.length === 0 && (
            <div className="rounded-lg border border-dashed border-[var(--stroke)] p-6 text-center">
              <p className="text-sm font-medium">No disciplines added</p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Add the disciplines covered by this scope of work.
              </p>
            </div>
          )}

          {/* ======================================================
              ADD DISCIPLINE
          ====================================================== */}

          <button
            type="button"
            onClick={addDiscipline}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[var(--ink-green)] hover:bg-[var(--mist-soft)]"
          >
            <Plus className="h-4 w-4" />
            Add discipline
          </button>
        </div>
      </div>
    </Card>
  );
}
