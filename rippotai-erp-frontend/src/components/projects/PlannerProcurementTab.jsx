import React, { useMemo, useState } from "react";

import { toast } from "sonner";

import { Plus, Trash2 } from "lucide-react";

import {
  useCreateProcurementItemMutation,
  useDeleteProcurementItemMutation,
  useGetProcurementItemsQuery,
  useUpdateProcurementItemMutation,
} from "../../api/documents/project-planner.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

// ============================================================
// DATE FIELDS
// ============================================================

const DATE_FIELDS = [
  { key: "estimate_finalised_at", label: "Estimate finalised" },
  { key: "quotation_finalised_at", label: "Quotation finalised" },
  { key: "planned_start_date", label: "Start date" },
  { key: "planned_end_date", label: "End date" },
  { key: "purchase_date", label: "Purchase" },
  { key: "received_at_site_date", label: "Received at site" },
];

// ============================================================
// ITEM TYPES
// ============================================================

const ITEM_TYPES = [
  { value: "MATERIAL", label: "Material" },
  { value: "LABOUR", label: "Labour" },
];

// ============================================================
// STATUS OPTIONS
// ============================================================

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NOT_APPLICABLE", label: "N/A" },
];

const STATUS_BADGE_VARIANT = {
  NOT_STARTED: "outline",
  IN_PROGRESS: "default",
  ON_HOLD: "secondary",
  COMPLETED: "success",
  NOT_APPLICABLE: "outline",
};

// ============================================================
// HELPERS
// ============================================================

function unwrapArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeError(error, fallback) {
  const message = error?.data?.message || error?.error || error?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || fallback;
}

// ============================================================
// COMPONENT
// ============================================================

export function PlannerProcurementTab({ projectId, plannerId }) {
  // CREATE FORM STATE
  const [newItemType, setNewItemType] = useState("MATERIAL");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newVendorName, setNewVendorName] = useState("");

  // FILTER
  const [itemTypeFilter, setItemTypeFilter] = useState("ALL");

  // DELETE CONFIRMATION
  const [pendingDelete, setPendingDelete] = useState(null);

  // API
  const {
    data: rowsResponse,
    isFetching,
    isError,
  } = useGetProcurementItemsQuery(
    {
      plannerId: plannerId || "",
      itemType: itemTypeFilter === "ALL" ? undefined : itemTypeFilter,
    },
    { skip: !plannerId },
  );

  const [createProcurementItem, { isLoading: isCreating }] =
    useCreateProcurementItemMutation();
  const [updateProcurementItem] = useUpdateProcurementItemMutation();
  const [deleteProcurementItem, { isLoading: isDeleting }] =
    useDeleteProcurementItemMutation();

  const rowList = unwrapArray(rowsResponse);

  // SUMMARY
  const stats = useMemo(() => {
    const material = rowList.filter((row) => row.item_type === "MATERIAL");
    const labour = rowList.filter((row) => row.item_type === "LABOUR");
    const completed = rowList.filter((row) => row.status === "COMPLETED");

    return {
      total: rowList.length,
      material: material.length,
      labour: labour.length,
      completed: completed.length,
    };
  }, [rowList]);

  // CREATE ITEM
  const handleAddRow = async () => {
    if (!plannerId) return toast.error("Procurement planner is not available");
    if (!newCategoryName.trim()) return toast.error("Enter a category name");

    try {
      await createProcurementItem({
        plannerId,
        data: {
          item_type: newItemType,
          category_name: newCategoryName.trim(),
          vendor_name: newVendorName.trim() || undefined,
          status: "NOT_STARTED",
        },
      }).unwrap();

      toast.success("Procurement item added");
      setNewCategoryName("");
      setNewVendorName("");
    } catch (error) {
      toast.error(normalizeError(error, "Failed to add procurement item"));
    }
  };

  // UPDATE FIELD
  const handleFieldChange = async (row, field, value) => {
    try {
      await updateProcurementItem({
        id: row.id,
        data: { [field]: value === "" ? null : value },
      }).unwrap();
    } catch (error) {
      toast.error(normalizeError(error, "Failed to update procurement item"));
    }
  };

  // DELETE ITEM
  const confirmRemoveRow = async () => {
    if (!pendingDelete) return;

    try {
      await deleteProcurementItem(pendingDelete.id).unwrap();
      toast.success("Procurement item removed");
    } catch (error) {
      toast.error(normalizeError(error, "Failed to remove procurement item"));
    } finally {
      setPendingDelete(null);
    }
  };

  // NO PLANNER
  if (!plannerId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Vendor & procurement planner is not available yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Initialize the project planners first.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ERROR
  if (isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">
          Failed to load procurement items.
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-5">
      {/* HEADER + SUMMARY */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Vendor & procurement
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Track material procurement, labour finalisation, purchasing and
                site receipt.
              </p>
            </div>

            <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All items</SelectItem>
                <SelectItem value="MATERIAL">Material</SelectItem>
                <SelectItem value="LABOUR">Labour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryItem label="Total" value={stats.total} />
            <SummaryItem label="Materials" value={stats.material} />
            <SummaryItem label="Labour" value={stats.labour} />
            <SummaryItem label="Completed" value={stats.completed} />
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {isFetching ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              Loading procurement…
            </p>
          ) : rowList.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No procurement items yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a material or labour item below.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1450px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[130px]">Type</TableHead>
                    <TableHead className="min-w-[180px]">Category</TableHead>
                    <TableHead className="min-w-[180px]">Vendor</TableHead>
                    {DATE_FIELDS.map((field) => (
                      <TableHead key={field.key} className="min-w-[145px]">
                        {field.label}
                      </TableHead>
                    ))}
                    <TableHead className="min-w-[150px]">Status</TableHead>
                    <TableHead className="min-w-[190px]">Remarks</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rowList.map((row) => (
                    <TableRow key={row.id}>
                      {/* ITEM TYPE */}
                      <TableCell>
                        <Select
                          defaultValue={row.item_type || "MATERIAL"}
                          onValueChange={(value) =>
                            handleFieldChange(row, "item_type", value)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ITEM_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* CATEGORY */}
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          defaultValue={row.category_name || ""}
                          onBlur={(event) =>
                            handleFieldChange(
                              row,
                              "category_name",
                              event.target.value.trim(),
                            )
                          }
                        />
                      </TableCell>

                      {/* VENDOR */}
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          defaultValue={
                            row.vendor_name || row.vendor?.name || ""
                          }
                          onBlur={(event) =>
                            handleFieldChange(
                              row,
                              "vendor_name",
                              event.target.value.trim(),
                            )
                          }
                        />
                      </TableCell>

                      {/* DATES */}
                      {DATE_FIELDS.map((field) => (
                        <TableCell key={field.key}>
                          <Input
                            type="date"
                            className="h-8 text-sm"
                            defaultValue={toDateInputValue(row[field.key])}
                            onChange={(event) =>
                              handleFieldChange(
                                row,
                                field.key,
                                event.target.value,
                              )
                            }
                          />
                        </TableCell>
                      ))}

                      {/* STATUS */}
                      <TableCell>
                        <Select
                          defaultValue={row.status || "NOT_STARTED"}
                          onValueChange={(value) =>
                            handleFieldChange(row, "status", value)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue asChild>
                              <Badge
                                variant={
                                  STATUS_BADGE_VARIANT[row.status] || "outline"
                                }
                                className="font-normal"
                              >
                                {STATUS_OPTIONS.find(
                                  (option) => option.value === row.status,
                                )?.label || "Not started"}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* REMARKS */}
                      <TableCell>
                        <Input
                          className="h-8 text-sm"
                          placeholder="Remarks"
                          defaultValue={row.remarks || ""}
                          onBlur={(event) =>
                            handleFieldChange(
                              row,
                              "remarks",
                              event.target.value.trim(),
                            )
                          }
                        />
                      </TableCell>

                      {/* DELETE */}
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Remove item"
                          className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setPendingDelete(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD PROCUREMENT ITEM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add procurement item</CardTitle>
          <CardDescription>
            Add a material category or labour contractor requirement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[160px_1fr_1fr_auto]">
            <Select value={newItemType} onValueChange={setNewItemType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={
                newItemType === "MATERIAL"
                  ? "Category e.g. Tiles"
                  : "Category e.g. Civil contractor"
              }
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />

            <Input
              placeholder="Vendor name (optional)"
              value={newVendorName}
              onChange={(event) => setNewVendorName(event.target.value)}
            />

            <Button onClick={handleAddRow} disabled={isCreating}>
              <Plus className="h-4 w-4" />
              {isCreating ? "Adding…" : "Add"}
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
            <AlertDialogTitle>Remove procurement item?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{pendingDelete?.category_name}"? This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmRemoveRow}
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

// ============================================================
// SUMMARY ITEM
// ============================================================

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default PlannerProcurementTab;
