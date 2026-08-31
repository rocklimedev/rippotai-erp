import React from "react";
import { ClipboardList, Trash2, Plus, MapPin, Layers3 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { FormField } from "@/components/ui/form-field";

/* ============================================================
   HELPERS
============================================================ */

function text(value) {
  return value == null ? "" : String(value);
}

/* ============================================================
   SCOPE ITEM EDITOR
============================================================ */

function ScopeItemList({ items, onChange, emptyText, type }) {
  const updateItem = (index, key, value) => {
    const next = [...items];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    onChange(next);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        id: null,

        text: "",

        scopeOfWork: "",

        notes: "",

        projectId: null,

        scopeOfWorkId: null,

        projectSpaceId: null,

        projectSpaceName: "",

        projectSpace: null,

        scopeCategoryId: null,

        scopeCategoryName: "",

        scopeCategory: null,

        isIncluded: type === "included",

        isExcluded: type === "excluded",

        sortOrder: items.length + 1,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id || `scope-item-${index}`}
          className="rounded-lg border bg-card p-3"
        >
          {/* -----------------------------------------
              Scope text
          ----------------------------------------- */}

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Textarea
                rows={3}
                value={text(item.scopeOfWork ?? item.text)}
                onChange={(event) => {
                  const value = event.target.value;

                  updateItem(index, "scopeOfWork", value);

                  /*
                   * Keep `text` synchronized because the proposal
                   * preview may consume the normalized display field.
                   */
                  const next = [...items];

                  next[index] = {
                    ...next[index],
                    scopeOfWork: value,
                    text: value,
                  };

                  onChange(next);
                }}
                placeholder="Describe the work included in this scope..."
                className="resize-y"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              title="Remove scope item"
              aria-label="Remove scope item"
              className="shrink-0 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* -----------------------------------------
              Project space
          ----------------------------------------- */}

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Project space
              </label>

              <Input
                value={text(item.projectSpaceName)}
                onChange={(event) => {
                  const next = [...items];

                  next[index] = {
                    ...next[index],
                    projectSpaceName: event.target.value,

                    /*
                     * Keep the nested object synchronized when
                     * the user edits the display name.
                     */
                    projectSpace: next[index].projectSpace
                      ? {
                          ...next[index].projectSpace,
                          name: event.target.value,
                        }
                      : {
                          id: next[index].projectSpaceId || null,
                          name: event.target.value,
                        },
                  };

                  onChange(next);
                }}
                placeholder="Project space"
              />
            </div>

            {/* -----------------------------------------
                Discipline / category
            ----------------------------------------- */}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Layers3 className="h-3.5 w-3.5" />
                Discipline
              </label>

              <Input
                value={text(item.scopeCategoryName)}
                onChange={(event) => {
                  const next = [...items];

                  next[index] = {
                    ...next[index],
                    scopeCategoryName: event.target.value,

                    scopeCategory: next[index].scopeCategory
                      ? {
                          ...next[index].scopeCategory,
                          name: event.target.value,
                        }
                      : {
                          id: next[index].scopeCategoryId || null,
                          name: event.target.value,
                        },
                  };

                  onChange(next);
                }}
                placeholder="Discipline"
              />
            </div>
          </div>

          {/* -----------------------------------------
              Notes
          ----------------------------------------- */}

          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Notes
            </label>

            <Textarea
              rows={2}
              value={text(item.notes)}
              onChange={(event) =>
                updateItem(index, "notes", event.target.value)
              }
              placeholder="Additional notes for this scope item..."
              className="resize-y"
            />
          </div>
        </div>
      ))}

      {/* -----------------------------------------
          Empty state
      ----------------------------------------- */}

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed p-5 text-center">
          <p className="text-sm font-medium">No scope items</p>

          <p className="mt-1 text-xs text-muted-foreground">{emptyText}</p>
        </div>
      )}

      {/* -----------------------------------------
          Add
      ----------------------------------------- */}

      <Button
        type="button"
        variant="ghost"
        onClick={addItem}
        className="px-2 text-sm font-semibold"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add scope item
      </Button>
    </div>
  );
}

/* ============================================================
   DISCIPLINE VIEW
============================================================ */

function DisciplineList({ disciplines, onChange }) {
  const removeDiscipline = (index) => {
    onChange(
      disciplines.filter((_, disciplineIndex) => disciplineIndex !== index),
    );
  };

  const updateDiscipline = (index, patch) => {
    const next = [...disciplines];

    next[index] = {
      ...next[index],
      ...patch,
    };

    onChange(next);
  };

  const addDiscipline = () => {
    onChange([
      ...disciplines,
      {
        id: null,
        name: "",
        description: "",
        items: [],
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {disciplines.map((discipline, index) => {
        const disciplineItems = Array.isArray(discipline.items)
          ? discipline.items
          : [];

        return (
          <div
            key={discipline.id || `discipline-${index}`}
            className="rounded-lg border bg-card p-4"
          >
            {/* -----------------------------------------
                Discipline header
            ----------------------------------------- */}

            <div className="mb-3 flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Discipline
                </label>

                <Input
                  value={text(discipline.name)}
                  onChange={(event) =>
                    updateDiscipline(index, {
                      name: event.target.value,
                    })
                  }
                  placeholder="Discipline name"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeDiscipline(index)}
                title="Remove discipline"
                aria-label="Remove discipline"
                className="mt-6 shrink-0 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* -----------------------------------------
                Discipline description
            ----------------------------------------- */}

            <Textarea
              rows={2}
              value={text(discipline.description)}
              onChange={(event) =>
                updateDiscipline(index, {
                  description: event.target.value,
                })
              }
              placeholder="Describe this discipline..."
              className="resize-y"
            />

            {/* -----------------------------------------
                Items
            ----------------------------------------- */}

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Scope items
              </p>

              {disciplineItems.length === 0 ? (
                <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  No items in this discipline.
                </p>
              ) : (
                <div className="space-y-2">
                  {disciplineItems.map((item, itemIndex) => (
                    <div
                      key={item.id || `discipline-item-${itemIndex}`}
                      className="rounded-md border bg-background p-3"
                    >
                      <Textarea
                        rows={2}
                        value={text(item.scopeOfWork ?? item.text)}
                        onChange={(event) => {
                          const nextItems = [...disciplineItems];

                          nextItems[itemIndex] = {
                            ...nextItems[itemIndex],
                            scopeOfWork: event.target.value,
                            text: event.target.value,
                          };

                          updateDiscipline(index, {
                            items: nextItems,
                          });
                        }}
                        placeholder="Describe the work..."
                        className="resize-y"
                      />

                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          value={text(item.projectSpaceName)}
                          onChange={(event) => {
                            const nextItems = [...disciplineItems];

                            nextItems[itemIndex] = {
                              ...nextItems[itemIndex],
                              projectSpaceName: event.target.value,
                            };

                            updateDiscipline(index, {
                              items: nextItems,
                            });
                          }}
                          placeholder="Project space"
                        />

                        <Input
                          value={text(item.notes)}
                          onChange={(event) => {
                            const nextItems = [...disciplineItems];

                            nextItems[itemIndex] = {
                              ...nextItems[itemIndex],
                              notes: event.target.value,
                            };

                            updateDiscipline(index, {
                              items: nextItems,
                            });
                          }}
                          placeholder="Notes"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {disciplines.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm font-medium">No disciplines found</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Disciplines are automatically created from the scope categories
            returned by the API.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={addDiscipline}
        className="px-2 text-sm font-semibold"
      >
        <Plus className="mr-1.5 h-4 w-4" />
        <Plus className="mr-1.5 h-4 w-4" />
        Add discipline
      </Button>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function ScopeOfWorkSection({ data, onChange }) {
  if (!data) return null;

  const included = Array.isArray(data.included) ? data.included : [];

  const notIncluded = Array.isArray(data.notIncluded) ? data.notIncluded : [];

  const optional = Array.isArray(data.optional) ? data.optional : [];

  const disciplines = Array.isArray(data.disciplines) ? data.disciplines : [];

  /* ==========================================================
     GENERIC UPDATE
  ========================================================== */

  const updateData = (patch) => {
    onChange({
      ...data,
      ...patch,
    });
  };

  /* ==========================================================
     SUMMARY / EXCLUSIONS
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          DOCUMENT SUMMARY
      ====================================================== */}

      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold leading-none tracking-tight">
              Scope of work
            </h3>

            <p className="text-sm text-muted-foreground">
              Fetched from the scope record — edit before generating.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* -----------------------------------------
              Scope summary
          ----------------------------------------- */}

          <FormField label="Scope summary">
            <Textarea
              rows={4}
              value={text(data.scopeSummary)}
              onChange={(event) =>
                updateData({
                  scopeSummary: event.target.value,
                })
              }
              placeholder="Describe the overall scope of the project..."
              className="resize-y"
            />
          </FormField>

          {/* -----------------------------------------
              Specific exclusions
          ----------------------------------------- */}

          <FormField label="Specific exclusions">
            <Textarea
              rows={4}
              value={text(data.specificExclusions)}
              onChange={(event) =>
                updateData({
                  specificExclusions: event.target.value,
                })
              }
              placeholder="List specific exclusions..."
              className="resize-y"
            />
          </FormField>

          {/* -----------------------------------------
              Notes
          ----------------------------------------- */}

          <FormField label="Notes">
            <Textarea
              rows={3}
              value={text(data.notes)}
              onChange={(event) =>
                updateData({
                  notes: event.target.value,
                })
              }
              placeholder="Additional scope notes..."
              className="resize-y"
            />
          </FormField>

          {/* -----------------------------------------
              Project mode
          ----------------------------------------- */}

          <FormField label="Project mode">
            <Input
              value={text(data.projectMode)}
              onChange={(event) =>
                updateData({
                  projectMode: event.target.value,
                })
              }
              placeholder="TURNKEY"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* ======================================================
          INCLUDED / EXCLUDED / OPTIONAL
      ====================================================== */}

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold">Scope items</h3>

          <p className="text-sm text-muted-foreground">
            Review exactly which work items are included, excluded, or optional.
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* ---------------------------------------
                INCLUDED
            --------------------------------------- */}

            <FormField label={`Included (${included.length})`}>
              <ScopeItemList
                items={included}
                type="included"
                onChange={(items) =>
                  updateData({
                    included: items,

                    /*
                     * Keep the canonical items array
                     * synchronized.
                     */
                    items: [...items, ...notIncluded, ...optional],
                  })
                }
                emptyText="No included scope items."
              />
            </FormField>

            {/* ---------------------------------------
                NOT INCLUDED
            --------------------------------------- */}

            <FormField label={`Not included (${notIncluded.length})`}>
              <ScopeItemList
                items={notIncluded}
                type="excluded"
                onChange={(items) =>
                  updateData({
                    notIncluded: items,

                    items: [...included, ...items, ...optional],
                  })
                }
                emptyText="No excluded scope items."
              />
            </FormField>

            {/* ---------------------------------------
                OPTIONAL
            --------------------------------------- */}

            <FormField label={`Optional (${optional.length})`}>
              <ScopeItemList
                items={optional}
                type="optional"
                onChange={(items) =>
                  updateData({
                    optional: items,

                    items: [...included, ...notIncluded, ...items],
                  })
                }
                emptyText="No optional scope items."
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================
          SCOPE BY DISCIPLINE
      ====================================================== */}

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold">Scope by discipline</h3>

          <p className="text-sm text-muted-foreground">
            These disciplines are grouped automatically from the scope
            categories returned by the backend.
          </p>
        </CardHeader>

        <CardContent>
          <DisciplineList
            disciplines={disciplines}
            onChange={(nextDisciplines) =>
              updateData({
                disciplines: nextDisciplines,
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
