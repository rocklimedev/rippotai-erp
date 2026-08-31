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

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

import EditableList from "./EditableList";

/* ============================================================
   FORMATTERS
============================================================ */

const fmt = (n, currency = "₹") =>
  `${currency} ${Number(n || 0).toLocaleString("en-IN")}`;

const numberOrZero = (value) => {
  if (value == null || value === "") return 0;

  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
};

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
   NORMALIZE CATEGORY
============================================================ */

function normalizeCategory(category, index) {
  if (!category) {
    return {
      id: null,
      name: `Category ${index + 1}`,
      items: [],
    };
  }

  const rawItems = Array.isArray(category.items)
    ? category.items
    : Array.isArray(category.estimateItems)
      ? category.estimateItems
      : [];

  return {
    ...category,

    id: category.id || null,

    name: category.name || category.title || `Category ${index + 1}`,

    items: rawItems.map((item, itemIndex) => ({
      ...item,

      id: item.id || null,

      description: item.description || item.name || item.item_description || "",

      quantity: numberOrZero(item.quantity ?? item.qty),

      rate: numberOrZero(item.rate ?? item.unit_rate ?? item.unitRate),

      amount: numberOrZero(
        item.amount ?? item.total_amount ?? item.totalAmount,
      ),

      unit: item.unit || item.unit_name || item.unitName || "",

      sortOrder: item.sortOrder ?? item.sort_order ?? itemIndex + 1,
    })),
  };
}

/* ============================================================
   NORMALIZE BUDGET ESTIMATE
============================================================ */

function normalizeBudgetEstimate(data) {
  if (!data) return null;

  const rawCategories = Array.isArray(data.categories)
    ? data.categories
    : Array.isArray(data.sections)
      ? data.sections
      : [];

  return {
    ...data,

    id: data.id || null,

    currency: data.currency || "₹",

    estimateNumber: data.estimateNumber || data.estimate_number || "",

    title: data.title || "",

    status: data.status || "draft",

    clientName: data.clientName || data.client_name || "",

    location: data.location || "",

    gstRate: numberOrZero(data.gstRate ?? data.gst_rate),

    subtotal: numberOrZero(data.subtotal),

    gstAmount: numberOrZero(data.gstAmount ?? data.gst_amount),

    totalAmount: numberOrZero(
      data.totalAmount ??
        data.total_amount ??
        data.grandTotal ??
        data.grand_total ??
        data.total,
    ),

    categories: rawCategories.map(normalizeCategory),

    assumes:
      Array.isArray(data.assumes) && data.assumes.length
        ? data.assumes
        : DEFAULT_ASSUMES,

    excludes:
      Array.isArray(data.excludes) && data.excludes.length
        ? data.excludes
        : DEFAULT_EXCLUDES,
  };
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function BudgetEstimateSection({ data, onChange }) {
  const normalizedData = useMemo(() => normalizeBudgetEstimate(data), [data]);

  if (!normalizedData) return null;

  /* ============================================================
     LOCAL TOTALS
  ============================================================ */

  const calculatedSubtotal = useMemo(() => {
    return normalizedData.categories.reduce((categoryTotal, category) => {
      return (
        categoryTotal +
        category.items.reduce((itemTotal, item) => {
          const quantity = numberOrZero(item.quantity);

          const rate = numberOrZero(item.rate);

          const amount =
            item.amount > 0 ? numberOrZero(item.amount) : quantity * rate;

          return itemTotal + amount;
        }, 0)
      );
    }, 0);
  }, [normalizedData.categories]);

  const subtotal =
    normalizedData.subtotal > 0 ? normalizedData.subtotal : calculatedSubtotal;

  const gstAmount =
    normalizedData.gstAmount > 0
      ? normalizedData.gstAmount
      : Math.round((subtotal * normalizedData.gstRate) / 100);

  const totalAmount =
    normalizedData.totalAmount > 0
      ? normalizedData.totalAmount
      : subtotal + gstAmount;

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
     UPDATE CATEGORY
  ============================================================ */

  const updateCategory = (categoryIndex, key, value) => {
    const categories = [...normalizedData.categories];

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      [key]: value,
    };

    updateData({
      categories,
    });
  };

  /* ============================================================
     UPDATE ITEM
  ============================================================ */

  const updateItem = (categoryIndex, itemIndex, key, value) => {
    const categories = [...normalizedData.categories];

    const category = categories[categoryIndex];

    const items = [...category.items];

    items[itemIndex] = {
      ...items[itemIndex],

      [key]:
        key === "quantity" || key === "rate" || key === "amount"
          ? numberOrZero(value)
          : value,
    };

    if (key === "quantity" || key === "rate") {
      const quantity = numberOrZero(items[itemIndex].quantity);

      const rate = numberOrZero(items[itemIndex].rate);

      items[itemIndex].amount = quantity * rate;
    }

    categories[categoryIndex] = {
      ...category,
      items,
    };

    updateData({
      categories,
      subtotal: 0,
      gstAmount: 0,
      totalAmount: 0,
    });
  };

  /* ============================================================
     REMOVE ITEM
  ============================================================ */

  const removeItem = (categoryIndex, itemIndex) => {
    const categories = [...normalizedData.categories];

    categories[categoryIndex] = {
      ...categories[categoryIndex],

      items: categories[categoryIndex].items.filter(
        (_, index) => index !== itemIndex,
      ),
    };

    updateData({
      categories,
      subtotal: 0,
      gstAmount: 0,
      totalAmount: 0,
    });
  };

  /* ============================================================
     ADD ITEM
  ============================================================ */

  const addItem = (categoryIndex) => {
    const categories = [...normalizedData.categories];

    const category = categories[categoryIndex];

    categories[categoryIndex] = {
      ...category,

      items: [
        ...category.items,
        {
          id: null,
          description: "",
          quantity: 1,
          rate: 0,
          amount: 0,
          unit: "",
          sortOrder: category.items.length + 1,
        },
      ],
    };

    updateData({
      categories,
    });
  };

  /* ============================================================
     ADD CATEGORY
  ============================================================ */

  const addCategory = () => {
    updateData({
      categories: [
        ...normalizedData.categories,
        {
          id: null,
          name: "",
          items: [],
        },
      ],
    });
  };

  /* ============================================================
     REMOVE CATEGORY
  ============================================================ */

  const removeCategory = (categoryIndex) => {
    updateData({
      categories: normalizedData.categories.filter(
        (_, index) => index !== categoryIndex,
      ),
    });
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-6">
      {/* ======================================================
          MAIN BUDGET CARD
      ====================================================== */}

      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold leading-none tracking-tight">
              Budget estimate
            </h3>

            <p className="text-sm text-muted-foreground">
              Indicative proposal-stage estimate. The final amount is confirmed
              when the BOQ is priced and frozen at Gate 02.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {/* ====================================================
              ESTIMATE HEADER
          ==================================================== */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Estimate number">
              <Input
                value={normalizedData.estimateNumber}
                placeholder="Estimate number"
                onChange={(e) =>
                  updateData({
                    estimateNumber: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Estimate title">
              <Input
                value={normalizedData.title}
                placeholder="Budget estimate"
                onChange={(e) =>
                  updateData({
                    title: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Client">
              <Input
                value={normalizedData.clientName}
                placeholder="Client name"
                onChange={(e) =>
                  updateData({
                    clientName: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Location">
              <Input
                value={normalizedData.location}
                placeholder="Project location"
                onChange={(e) =>
                  updateData({
                    location: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          {/* ====================================================
              SUMMARY STRIP
          ==================================================== */}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">
                Base estimate
              </p>

              <p className="mt-1 text-lg font-semibold">
                {fmt(subtotal, normalizedData.currency)}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">GST</p>

              <p className="mt-1 text-lg font-semibold">
                {fmt(gstAmount, normalizedData.currency)}
              </p>
            </div>

            <div className="rounded-xl border bg-primary/5 px-4 py-3">
              <p className="text-xs font-medium text-primary">
                Estimated total
              </p>

              <p className="mt-1 text-lg font-semibold text-primary">
                {fmt(totalAmount, normalizedData.currency)}
              </p>
            </div>
          </div>

          {/* ====================================================
              CATEGORIES
          ==================================================== */}

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Cost breakdown</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Review categories and individual priced items.
              </p>
            </div>

            <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              {normalizedData.categories.length}{" "}
              {normalizedData.categories.length === 1
                ? "category"
                : "categories"}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {normalizedData.categories.map((category, categoryIndex) => (
              <div
                key={category.id || `category-${categoryIndex}`}
                className="overflow-hidden rounded-xl border"
              >
                {/* CATEGORY HEADER */}

                <div className="flex items-center gap-3 border-b bg-muted/40 p-4">
                  <Input
                    value={category.name}
                    placeholder="Category name"
                    onChange={(e) =>
                      updateCategory(categoryIndex, "name", e.target.value)
                    }
                    className="font-semibold"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCategory(categoryIndex)}
                    title="Remove category"
                    aria-label="Remove category"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* TABLE HEADER */}

                <div className="hidden grid-cols-[minmax(0,1fr)_90px_130px_140px_48px] items-center gap-3 border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span className="text-right">Amount</span>
                  <span />
                </div>

                {/* ITEMS */}

                {category.items.map((item, itemIndex) => (
                  <div
                    key={item.id || `item-${categoryIndex}-${itemIndex}`}
                    className="border-b p-4 last:border-b-0"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_90px_130px_140px_48px] md:items-center">
                      {/* DESCRIPTION */}

                      <FormField label="Description">
                        <Input
                          value={item.description}
                          placeholder="Item description"
                          onChange={(e) =>
                            updateItem(
                              categoryIndex,
                              itemIndex,
                              "description",
                              e.target.value,
                            )
                          }
                        />
                      </FormField>

                      {/* QUANTITY */}

                      <FormField label="Quantity">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              categoryIndex,
                              itemIndex,
                              "quantity",
                              e.target.value,
                            )
                          }
                        />
                      </FormField>

                      {/* RATE */}

                      <FormField label="Rate">
                        <Input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(
                              categoryIndex,
                              itemIndex,
                              "rate",
                              e.target.value,
                            )
                          }
                        />
                      </FormField>

                      {/* AMOUNT */}

                      <FormField label="Amount">
                        <Input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(
                              categoryIndex,
                              itemIndex,
                              "amount",
                              e.target.value,
                            )
                          }
                          className="text-right font-medium"
                        />
                      </FormField>

                      {/* DELETE */}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(categoryIndex, itemIndex)}
                          title="Remove item"
                          aria-label="Remove item"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* EMPTY CATEGORY */}

                {category.items.length === 0 && (
                  <div className="px-6 py-8 text-center">
                    <Wallet className="mx-auto h-7 w-7 text-muted-foreground" />

                    <p className="mt-2 text-sm font-medium">
                      No items in this category
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Add an estimate item to this category.
                    </p>
                  </div>
                )}

                {/* ADD ITEM */}

                <div className="border-t px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => addItem(categoryIndex)}
                    className="px-3 text-sm font-semibold"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add item
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ADD CATEGORY */}

          <Button
            type="button"
            variant="ghost"
            onClick={addCategory}
            className="mt-3 px-3 text-sm font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add category
          </Button>

          {/* ====================================================
              TOTALS
          ==================================================== */}

          <div className="mt-8 flex justify-end border-t pt-6">
            <div className="w-full max-w-md">
              <div className="space-y-3 text-sm">
                {/* SUBTOTAL */}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Subtotal</span>

                  <span className="font-medium">
                    {fmt(subtotal, normalizedData.currency)}
                  </span>
                </div>

                {/* GST */}

                <div className="rounded-xl border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">GST</span>

                      <span
                        title="GST is calculated by the backend from the estimate subtotal."
                        className="cursor-help text-muted-foreground"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={normalizedData.gstRate}
                        onChange={(e) =>
                          updateData({
                            gstRate: Math.min(
                              100,
                              Math.max(0, numberOrZero(e.target.value)),
                            ),
                            gstAmount: 0,
                            totalAmount: 0,
                          })
                        }
                        className="w-20 text-right"
                      />

                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Applicable GST
                    </span>

                    <span className="font-medium">
                      {fmt(gstAmount, normalizedData.currency)}
                    </span>
                  </div>
                </div>

                {/* TOTAL */}

                <div className="mt-2 rounded-xl bg-primary p-4 text-primary-foreground">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Estimated total</p>

                      <p className="mt-0.5 text-[11px] opacity-70">
                        Including GST
                      </p>
                    </div>

                    <p className="text-xl font-semibold">
                      {fmt(totalAmount, normalizedData.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================
          ASSUMPTIONS / EXCLUSIONS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ASSUMPTIONS */}

        <Card>
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-none tracking-tight">
                Estimate assumptions
              </h3>

              <p className="text-sm text-muted-foreground">
                Conditions used while preparing this preliminary estimate.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <EditableList
              items={normalizedData.assumes}
              onChange={(list) =>
                updateData({
                  assumes: list,
                })
              }
            />
          </CardContent>
        </Card>

        {/* EXCLUSIONS */}

        <Card>
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-none tracking-tight">
                Exclusions
              </h3>

              <p className="text-sm text-muted-foreground">
                Items that are outside the current estimate.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <EditableList
              items={normalizedData.excludes}
              onChange={(list) =>
                updateData({
                  excludes: list,
                })
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* ======================================================
          HOW NUMBER FIRMS UP
      ====================================================== */}

      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold leading-none tracking-tight">
              How the number firms up
            </h3>

            <p className="text-sm text-muted-foreground">
              The estimate becomes progressively more precise as the project
              moves through the commercial process.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
                className="relative rounded-xl border bg-card p-4"
              >
                {index < items.length - 1 && (
                  <div className="absolute right-[-13px] top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                )}

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-primary">
                  {item.no}
                </span>

                <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>

                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
