import React, { useMemo } from "react";
import {
  Wallet,
  Trash2,
  Plus,
  CircleHelp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { Card, CardHeader } from "../ui/card";
import { Field, Input } from "../ui/Field";
import EditableList from "./EditableList";

const fmt = (n, currency = "₹") =>
  `${currency} ${Number(n || 0).toLocaleString("en-IN")}`;

/* ============================================================
   DEFAULT LINE ITEMS
============================================================ */

const DEFAULT_LINE_ITEMS = [
  {
    head: "Civil & demolition",
    description: "Removal, masonry, plaster and making good",
    amount: 0,
  },
  {
    head: "MEP & waterproofing",
    description: "Electrical, plumbing, AC and wet area treatment",
    amount: 0,
  },
  {
    head: "Flooring & tiling",
    description: "Floor, wall, counters and skirting",
    amount: 0,
  },
  {
    head: "Ceiling & POP",
    description: "Framework, boarding and cove detailing",
    amount: 0,
  },
  {
    head: "Mill work & joinery",
    description: "Kitchen, wardrobes, vanities and storage",
    amount: 0,
  },
  {
    head: "Paint & polish",
    description: "Walls, ceilings, wood polish and veneer",
    amount: 0,
  },
  {
    head: "Fixtures & fittings",
    description: "Lighting, CP fittings, sanitaryware and hardware",
    amount: 0,
  },
  {
    head: "Loose furniture & decor",
    description: "Optional — included only if ticked in scope",
    amount: 0,
  },
  {
    head: "Site management & supervision",
    description: "Labour control, logistics and quality checks",
    amount: 0,
  },
];

/* ============================================================
   DEFAULT ASSUMPTIONS
============================================================ */

const DEFAULT_ASSUMES = [
  "Finish level as discussed at the site visit",
  "Standard ceiling height, no structural change",
  "Material lead times within four weeks",
  "Uninterrupted site access and services",
  "Decisions returned within forty-eight hours",
];

/* ============================================================
   DEFAULT EXCLUSIONS
============================================================ */

const DEFAULT_EXCLUDES = [
  "GST and statutory levies",
  "Society charges, permissions and deposits",
  "Appliances and loose furniture unless ticked",
  "Client-supplied material and its handling",
  "Variations raised after the BOQ is frozen",
];

/* ============================================================
   NORMALIZE LINE ITEMS
============================================================ */

function normalizeLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_LINE_ITEMS.map((item) => ({ ...item }));
  }

  return DEFAULT_LINE_ITEMS.map((defaultItem) => {
    const existing = items.find(
      (item) =>
        String(item?.head || "")
          .trim()
          .toLowerCase() === defaultItem.head.toLowerCase(),
    );

    return existing
      ? {
          ...defaultItem,
          ...existing,
          amount: Number(existing.amount || 0),
        }
      : {
          ...defaultItem,
        };
  });
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function BudgetEstimateSection({ data, onChange }) {
  const normalizedData = useMemo(() => {
    if (!data) return null;

    return {
      ...data,
      currency: data.currency || "₹",
      contingencyPct: Number(data.contingencyPct || 0),

      lineItems: normalizeLineItems(data.lineItems),

      assumes:
        Array.isArray(data.assumes) && data.assumes.length
          ? data.assumes
          : DEFAULT_ASSUMES,

      excludes:
        Array.isArray(data.excludes) && data.excludes.length
          ? data.excludes
          : DEFAULT_EXCLUDES,
    };
  }, [data]);

  /* ============================================================
     TOTALS
  ============================================================ */

  const totals = useMemo(() => {
    if (!normalizedData) {
      return {
        subtotal: 0,
        contingency: 0,
        total: 0,
      };
    }

    const subtotal = normalizedData.lineItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const contingency = Math.round(
      (subtotal * Number(normalizedData.contingencyPct || 0)) / 100,
    );

    return {
      subtotal,
      contingency,
      total: subtotal + contingency,
    };
  }, [normalizedData]);

  if (!normalizedData) return null;

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
     UPDATE LINE ITEM
  ============================================================ */

  const updateItem = (index, key, value) => {
    const next = [...normalizedData.lineItems];

    next[index] = {
      ...next[index],
      [key]: key === "amount" ? Number(value || 0) : value,
    };

    updateData({
      lineItems: next,
    });
  };

  /* ============================================================
     REMOVE LINE ITEM
  ============================================================ */

  const removeItem = (index) => {
    const next = normalizedData.lineItems.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    updateData({
      lineItems: next,
    });
  };

  /* ============================================================
     ADD LINE ITEM
  ============================================================ */

  const addItem = () => {
    updateData({
      lineItems: [
        ...normalizedData.lineItems,
        {
          head: "",
          description: "",
          amount: 0,
        },
      ],
    });
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-6">
      {/* ========================================================
          MAIN BUDGET CARD
      ======================================================== */}

      <Card>
        <CardHeader
          icon={Wallet}
          title="Budget estimate"
          subtitle="Indicative proposal-stage estimate. The final amount is confirmed when the BOQ is priced and frozen at Gate 02."
        />

        {/* ======================================================
            SUMMARY STRIP
        ====================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--stroke)] bg-[var(--mist-soft)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--muted)]">
              Base estimate
            </p>

            <p className="mt-1 text-lg font-semibold">
              {fmt(totals.subtotal, normalizedData.currency)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--stroke)] bg-[var(--mist-soft)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--muted)]">
              Contingency
            </p>

            <p className="mt-1 text-lg font-semibold">
              {fmt(totals.contingency, normalizedData.currency)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--ink-green)]/20 bg-[var(--ink-green)]/5 px-4 py-3">
            <p className="text-xs font-medium text-[var(--ink-green)]">
              Estimated total
            </p>

            <p className="mt-1 text-lg font-semibold text-[var(--ink-green)]">
              {fmt(totals.total, normalizedData.currency)}
            </p>
          </div>
        </div>

        {/* ======================================================
            LINE ITEMS HEADER
        ====================================================== */}

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Cost breakdown</p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              Add or adjust individual heads of cost.
            </p>
          </div>

          <span className="hidden rounded-full bg-[var(--mist-soft)] px-3 py-1 text-xs font-medium text-[var(--muted)] sm:inline-flex">
            {normalizedData.lineItems.length}{" "}
            {normalizedData.lineItems.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* ======================================================
            LINE ITEMS
        ====================================================== */}

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--stroke)]">
          {/* TABLE HEADER */}

          <div className="hidden grid-cols-[1fr_180px_48px] items-center gap-4 border-b border-[var(--stroke)] bg-[var(--mist-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] md:grid">
            <span>Head of cost</span>
            <span className="text-right">
              Amount ({normalizedData.currency})
            </span>
            <span />
          </div>

          {/* ITEMS */}

          <div>
            {normalizedData.lineItems.map((li, index) => (
              <div
                key={`${li.head}-${index}`}
                className="group border-b border-[var(--stroke)] p-4 last:border-b-0"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_48px] md:items-start">
                  {/* ==================================================
                      DESCRIPTION
                  ================================================== */}

                  <div className="min-w-0">
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--muted)] md:hidden">
                      Head of cost
                    </label>

                    <Input
                      value={li.head}
                      placeholder="Head of cost"
                      onChange={(e) =>
                        updateItem(index, "head", e.target.value)
                      }
                      className="font-medium"
                    />

                    <Input
                      value={li.description}
                      placeholder="Add a short description"
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className="mt-2 text-xs text-[var(--muted)]"
                    />
                  </div>

                  {/* ==================================================
                      AMOUNT
                  ================================================== */}

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--muted)] md:hidden">
                      Amount
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">
                        {normalizedData.currency}
                      </span>

                      <Input
                        type="number"
                        min="0"
                        value={li.amount}
                        onChange={(e) =>
                          updateItem(index, "amount", e.target.value)
                        }
                        className="pl-8 text-right font-medium"
                      />
                    </div>
                  </div>

                  {/* ==================================================
                      DELETE
                  ================================================== */}

                  <div className="flex items-center justify-end md:pt-0">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
                      title="Remove line item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* ITEM TOTAL */}

                {Number(li.amount || 0) > 0 && (
                  <div className="mt-3 flex items-center justify-between border-t border-dashed border-[var(--stroke)] pt-2 text-xs md:hidden">
                    <span className="text-[var(--muted)]">Line total</span>

                    <span className="font-semibold">
                      {fmt(li.amount, normalizedData.currency)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* EMPTY STATE */}

          {normalizedData.lineItems.length === 0 && (
            <div className="px-6 py-10 text-center">
              <Wallet className="mx-auto h-8 w-8 text-[var(--muted)]" />

              <p className="mt-3 text-sm font-medium">No cost items added</p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Add a cost head to start building the estimate.
              </p>
            </div>
          )}
        </div>

        {/* ======================================================
            ADD ITEM
        ====================================================== */}

        <button
          type="button"
          onClick={addItem}
          className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ink-green)] transition hover:bg-[var(--mist-soft)]"
        >
          <Plus className="h-4 w-4" />
          Add line item
        </button>

        {/* ======================================================
            TOTALS
        ====================================================== */}

        <div className="mt-8 flex justify-end border-t border-[var(--stroke)] pt-6">
          <div className="w-full max-w-md">
            <div className="space-y-3 text-sm">
              {/* SUBTOTAL */}

              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted)]">Subtotal</span>

                <span className="font-medium">
                  {fmt(totals.subtotal, normalizedData.currency)}
                </span>
              </div>

              {/* CONTINGENCY */}

              <div className="rounded-xl border border-[var(--stroke)] bg-[var(--mist-soft)] p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Contingency</span>

                    <span
                      title="Allowance against site conditions discovered after demolition."
                      className="cursor-help text-[var(--muted)]"
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={normalizedData.contingencyPct}
                      onChange={(e) =>
                        updateData({
                          contingencyPct: Math.min(
                            100,
                            Math.max(0, Number(e.target.value || 0)),
                          ),
                        })
                      }
                      className="!w-20 text-right"
                    />

                    <span className="text-sm text-[var(--muted)]">%</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">
                    Allowance for unforeseen site conditions
                  </span>

                  <span className="font-medium">
                    {fmt(totals.contingency, normalizedData.currency)}
                  </span>
                </div>
              </div>

              {/* TOTAL */}

              <div className="mt-2 rounded-xl bg-[var(--ink-green)] p-4 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Estimated total</p>

                    <p className="mt-0.5 text-[11px] text-white/70">
                      Exclusive of GST
                    </p>
                  </div>

                  <p className="text-xl font-semibold">
                    {fmt(totals.total, normalizedData.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================
          ASSUMPTIONS / EXCLUSIONS
      ======================================================== */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ASSUMPTIONS */}

        <Card>
          <CardHeader
            icon={CheckCircle2}
            title="Estimate assumptions"
            subtitle="Conditions used while preparing this preliminary estimate."
          />

          <div className="mt-5">
            <Field label="">
              <EditableList
                items={normalizedData.assumes}
                onChange={(list) =>
                  updateData({
                    assumes: list,
                  })
                }
              />
            </Field>
          </div>
        </Card>

        {/* EXCLUSIONS */}

        <Card>
          <CardHeader
            icon={AlertCircle}
            title="Exclusions"
            subtitle="Items that are outside the current estimate."
          />

          <div className="mt-5">
            <Field label="">
              <EditableList
                items={normalizedData.excludes}
                onChange={(list) =>
                  updateData({
                    excludes: list,
                  })
                }
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* ========================================================
          HOW THE NUMBER FIRMS UP
      ======================================================== */}

      <Card>
        <CardHeader
          icon={ArrowRight}
          title="How the number firms up"
          subtitle="The estimate becomes progressively more precise as the project moves through the commercial process."
        />

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            {
              no: "01",
              title: "Estimate",
              text: "This document — an indicative estimate, not a final quote.",
            },
            {
              no: "02",
              title: "Detailed BOQ",
              text: "Every item is priced with quantities, specifications and brands.",
            },
            {
              no: "03",
              title: "Freeze at Gate 02",
              text: "Scope and cost are signed off and the agreement is issued.",
            },
            {
              no: "04",
              title: "Variations only",
              text: "Any change is quoted in writing before it is executed.",
            },
          ].map((item, index, items) => (
            <div
              key={item.no}
              className="relative rounded-xl border border-[var(--stroke)] bg-white p-4"
            >
              {/* CONNECTOR */}

              {index < items.length - 1 && (
                <div className="absolute right-[-13px] top-1/2 z-10 hidden -translate-y-1/2 md:block">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--stroke)] bg-white">
                    <ArrowRight className="h-3 w-3 text-[var(--muted)]" />
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--mist-soft)] text-[10px] font-bold text-[var(--ink-green)]">
                  {item.no}
                </span>
              </div>

              <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>

              <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
