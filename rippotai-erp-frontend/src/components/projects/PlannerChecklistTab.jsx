import React, { useMemo, useState } from "react";

import { toast } from "sonner";

import { Check, PlayCircle, Plus, Trash2 } from "lucide-react";

import {
  useCreatePlannerItemMutation,
  useDeletePlannerItemMutation,
  useUpdateItemLocationMutation,
  useAttachPlannerLocationsMutation,
} from "../../api/documents/project-planner.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ============================================================
// HELPERS
// ============================================================

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeError(error, fallback) {
  const message = error?.data?.message || error?.error || error?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
}

function getItemLocation(item, locationId) {
  return (item.locations || []).find(
    (relation) =>
      relation.location_id === locationId ||
      relation.location?.id === locationId,
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PlannerChecklistTab({
  projectId,
  plannerId,
  plannerType,
  module,
  moduleLabel,

  locations = [],
  floors = [],

  items = [],
  taskTree = [],

  isLoading,
  isInitialized,

  onInitialize,
  isInitializing,
}) {
  // ============================================================
  // NORMALIZE INPUT
  // ============================================================

  const plannerItems = items.length ? items : taskTree;

  // ============================================================
  // STATE
  // ============================================================

  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [newWorkName, setNewWorkName] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [savingCellKey, setSavingCellKey] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // ============================================================
  // API
  // ============================================================

  const [createPlannerItem, { isLoading: isCreatingItem }] =
    useCreatePlannerItemMutation();
  const [deletePlannerItem, { isLoading: isDeleting }] =
    useDeletePlannerItemMutation();
  const [updateItemLocation] = useUpdateItemLocationMutation();
  const [attachPlannerLocations] = useAttachPlannerLocationsMutation();

  // ============================================================
  // PHASES
  // ============================================================

  const phases = useMemo(() => {
    const map = new Map();

    plannerItems.forEach((item) => {
      if (item.phase?.id) {
        map.set(item.phase.id, item.phase);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
    );
  }, [plannerItems]);

  React.useEffect(() => {
    if (!selectedPhaseId && phases.length) {
      setSelectedPhaseId(phases[0].id);
    }
  }, [phases, selectedPhaseId]);

  // ============================================================
  // GROUP ITEMS BY PHASE
  // ============================================================

  const groupedItems = useMemo(() => {
    const map = new Map();

    plannerItems.forEach((item) => {
      const phaseId = item.phase_id || item.phase?.id || "NO_PHASE";

      if (!map.has(phaseId)) {
        map.set(phaseId, { phase: item.phase || null, items: [] });
      }

      map.get(phaseId).items.push(item);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        Number(a.phase?.sort_order || 0) - Number(b.phase?.sort_order || 0),
    );
  }, [plannerItems]);

  // ============================================================
  // OVERALL PROGRESS
  // ============================================================

  const overallPercent = useMemo(() => {
    const applicable = plannerItems.filter(
      (item) => item.status !== "NOT_APPLICABLE",
    );

    if (!applicable.length) return 0;

    const total = applicable.reduce(
      (sum, item) => sum + Number(item.progress_pct || 0),
      0,
    );

    return Math.round(total / applicable.length);
  }, [plannerItems]);

  // ============================================================
  // ADD PLANNER ITEM
  // ============================================================

  const handleAddItem = async () => {
    if (!plannerId) return toast.error("Planner is not available");
    if (!selectedPhaseId) return toast.error("Select a phase");
    if (!newWorkName.trim()) return toast.error("Enter a work item");

    try {
      await createPlannerItem({
        plannerId,
        data: {
          phase_id: selectedPhaseId,
          work_name: newWorkName.trim(),
          details: newDetails.trim() || undefined,
          location_ids: floors.map((floor) => floor.id),
        },
      }).unwrap();

      setNewWorkName("");
      setNewDetails("");
      toast.success("Planner item added");
    } catch (error) {
      toast.error(normalizeError(error, "Failed to add planner item"));
    }
  };

  // ============================================================
  // DELETE PLANNER ITEM
  // ============================================================

  const confirmRemoveItem = async () => {
    if (!pendingDelete) return;

    try {
      await deletePlannerItem(pendingDelete.id).unwrap();
      toast.success("Planner item removed");
    } catch (error) {
      toast.error(normalizeError(error, "Failed to remove planner item"));
    } finally {
      setPendingDelete(null);
    }
  };

  // ============================================================
  // ATTACH FLOOR
  // ============================================================

  const handleAttachFloor = async (item, floor) => {
    const cellKey = `${item.id}:${floor.id}`;
    setSavingCellKey(cellKey);

    try {
      await attachPlannerLocations({
        itemId: item.id,
        location_ids: [floor.id],
      }).unwrap();

      toast.success(`${floor.name} attached`);
    } catch (error) {
      toast.error(normalizeError(error, "Failed to attach floor"));
    } finally {
      setSavingCellKey(null);
    }
  };

  // ============================================================
  // TOGGLE FLOOR PROGRESS
  // ============================================================

  const handleToggleCell = async (item, floor) => {
    const relation = getItemLocation(item, floor.id);

    if (!relation) {
      await handleAttachFloor(item, floor);
      return;
    }

    const isDone =
      relation.status === "COMPLETED" ||
      Number(relation.progress_pct || 0) >= 100;

    const cellKey = `${item.id}:${floor.id}`;
    setSavingCellKey(cellKey);

    try {
      await updateItemLocation({
        id: relation.id,
        data: isDone
          ? { status: "NOT_STARTED", progress_pct: 0, actual_end_date: null }
          : {
              status: "COMPLETED",
              progress_pct: 100,
              actual_end_date: todayIso(),
            },
      }).unwrap();
    } catch (error) {
      toast.error(normalizeError(error, "Failed to update progress"));
    } finally {
      setSavingCellKey(null);
    }
  };

  // ============================================================
  // NOT INITIALIZED
  // ============================================================

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <PlayCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {moduleLabel} checklist isn't set up yet
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Initialize it to generate the standard phase-by-phase checklist
              for this project.
            </p>
          </div>
          <Button onClick={onInitialize} disabled={isInitializing}>
            <PlayCircle className="h-4 w-4" />
            {isInitializing ? "Initializing…" : `Initialize ${moduleLabel}`}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // NO FLOORS
  // ============================================================

  if (floors.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Add at least one floor in the "Floors & Setup" tab to track floor-wise
          progress.
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-5">
      {/* SUMMARY */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {moduleLabel}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {plannerItems.length} planner item
              {plannerItems.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="w-full max-w-[220px] sm:w-auto">
            <div className="mb-1.5 flex items-center justify-between gap-6">
              <span className="text-xs text-muted-foreground">
                Overall progress
              </span>
              <span className="text-xs font-medium text-foreground">
                {overallPercent}%
              </span>
            </div>
            <Progress value={overallPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* PLANNER TABLES BY PHASE */}
      {isLoading ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ) : groupedItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No checklist items found.
          </CardContent>
        </Card>
      ) : (
        groupedItems.map(({ phase, items: phaseItems }) => (
          <Card key={phase?.id || "NO_PHASE"} className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b pb-4">
              <div>
                {phase?.phase_code && (
                  <CardDescription className="text-xs font-medium uppercase tracking-wide">
                    {phase.phase_code}
                  </CardDescription>
                )}
                <CardTitle className="mt-0.5 text-base">
                  {phase?.title || "Unassigned phase"}
                </CardTitle>
              </div>

              <Badge variant="secondary" className="font-normal">
                {phaseItems.length} item{phaseItems.length === 1 ? "" : "s"}
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[850px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 min-w-[280px] bg-background">
                        Work / details
                      </TableHead>

                      {floors.map((floor) => (
                        <TableHead
                          key={floor.id}
                          className="min-w-[100px] text-center"
                        >
                          {floor.name}
                        </TableHead>
                      ))}

                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {phaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="sticky left-0 z-10 bg-background align-top">
                          <p className="font-medium text-foreground">
                            {item.work_name || item.details || "Untitled item"}
                          </p>
                          {item.work_name && item.details && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.details}
                            </p>
                          )}
                          {item.remarks && (
                            <p className="mt-1 text-xs text-muted-foreground/70">
                              {item.remarks}
                            </p>
                          )}
                        </TableCell>

                        {floors.map((floor) => {
                          const relation = getItemLocation(item, floor.id);
                          const isDone =
                            relation?.status === "COMPLETED" ||
                            Number(relation?.progress_pct || 0) >= 100;
                          const cellKey = `${item.id}:${floor.id}`;
                          const saving = savingCellKey === cellKey;

                          return (
                            <TableCell key={floor.id} className="text-center">
                              {relation ? (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleToggleCell(item, floor)}
                                  title={
                                    isDone
                                      ? "Mark as not done"
                                      : "Mark as complete"
                                  }
                                  className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
                                    isDone
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input bg-background text-transparent hover:border-primary/60",
                                  )}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleAttachFloor(item, floor)}
                                  title="Attach floor"
                                  className="rounded-md border border-dashed border-input px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-50"
                                >
                                  +
                                </button>
                              )}
                            </TableCell>
                          );
                        })}

                        <TableCell className="text-center">
                          <span className="text-xs font-medium text-foreground">
                            {Math.round(Number(item.progress_pct || 0))}%
                          </span>
                        </TableCell>

                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setPendingDelete(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* ADD CUSTOM ITEM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add planner item</CardTitle>
          <CardDescription>
            Add a custom item to the {moduleLabel} planner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[220px_1fr_1fr_auto]">
            <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.phase_code ? `${phase.phase_code} — ` : ""}
                    {phase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Work item"
              value={newWorkName}
              onChange={(event) => setNewWorkName(event.target.value)}
            />

            <Input
              placeholder="Details (optional)"
              value={newDetails}
              onChange={(event) => setNewDetails(event.target.value)}
            />

            <Button onClick={handleAddItem} disabled={isCreatingItem}>
              <Plus className="h-4 w-4" />
              {isCreatingItem ? "Adding…" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DELETE CONFIRMATION */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove planner item?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "
              {pendingDelete?.work_name ||
                pendingDelete?.details ||
                "this planner item"}
              "? Any floor progress linked to this item will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmRemoveItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PlannerChecklistTab;
