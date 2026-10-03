import { useState } from "react";
import { toast } from "sonner";

import { Button, TextInput as Input } from "@/components/inos";
import { Plus, Trash2, Rows3 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useCreatePlannerItemMutation,
  useCreateProcurementItemMutation,
  useDeletePlannerItemMutation,
  useDeleteProcurementItemMutation,
} from "../../api/documents/project-planner.api";

import { workbookRows } from "./plannerWorkbookFormat";

export function PlannerRowActions({ overview, view, refresh }) {
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [type, setType] = useState("MATERIAL");
  const [rowId, setRowId] = useState("");
  const [busy, setBusy] = useState(false);

  const [createTask] = useCreatePlannerItemMutation();

  const [createVendor] = useCreateProcurementItemMutation();

  const [deleteTask] = useDeletePlannerItemMutation();

  const [deleteVendor] = useDeleteProcurementItemMutation();

  const planner = overview?.planners?.find((p) => p.type === "PROJECT");

  if (!planner || view === "Overview") {
    return null;
  }

  const vendor = view === "Vendor & Procurement";

  const rows = vendor
    ? planner.procurement_items || []
    : workbookRows([planner]).filter(
        (item) =>
          item.phase?.module ===
          (view === "Consultancy" ? "CONSULTANCY" : "PMC"),
      );

  const phases = Array.from(
    new Map(
      rows.filter((row) => row.phase).map((row) => [row.phase.id, row.phase]),
    ).values(),
  );

  const selectedPhase = phaseId || phases[0]?.id || "";

  const selectedRow = rows.find((row) => row.id === rowId);

  const getNextSortOrder = () =>
    Math.max(0, ...rows.map((row) => Number(row.sort_order || 0))) + 1;

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setBusy(true);

    try {
      if (vendor) {
        await createVendor({
          plannerId: planner.id,
          data: {
            category_name: name.trim(),
            item_type: type,
            sort_order: getNextSortOrder(),
          },
        }).unwrap();
      } else {
        await createTask({
          plannerId: planner.id,
          data: {
            phase_id: selectedPhase || phases[0]?.id,
            work_name: name.trim(),
            details: details.trim() || undefined,
            sort_order: getNextSortOrder(),
            location_ids: (overview.locations || []).flatMap((floor) => [
              floor.id,
              ...(floor.children || []).map((child) => child.id),
            ]),
          },
        }).unwrap();
      }

      setName("");
      setDetails("");

      await refresh();

      toast.success("Row added");
    } catch (error) {
      toast.error(error?.data?.message || "Could not add row");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!rowId) return;

    setBusy(true);

    try {
      await (vendor ? deleteVendor : deleteTask)(rowId).unwrap();

      setRowId("");

      await refresh();

      toast.success("Row removed");
    } catch (error) {
      toast.error(error?.data?.message || "Could not remove row");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="inos-card" style={{ padding: "14px 20px" }}>
      <summary
        className="cursor-pointer select-none"
        style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14 }}
      >
        <span className="inos-icon-tile inos-icon-tile--sm" aria-hidden>
          <Rows3 />
        </span>
        Add or remove rows
        <span style={{ fontWeight: 500, color: "var(--text-3)", fontSize: 13 }}>
          — {vendor ? "procurement categories" : "tasks in this sheet"}
        </span>
      </summary>

      <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
        <form className="planner-toolbar" onSubmit={handleCreate}>
          {vendor ? (
            <Select value={type} onValueChange={setType} disabled={busy}>
              <SelectTrigger
                aria-label="Procurement type"
                className="min-w-[190px]"
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="MATERIAL">Material vendor</SelectItem>

                <SelectItem value="LABOUR">Labour contractor</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={selectedPhase}
              onValueChange={setPhaseId}
              disabled={busy || !phases.length}
            >
              <SelectTrigger aria-label="Task phase" className="min-w-[220px]">
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>

              <SelectContent>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Input
            aria-label="New row name"
            required
            maxLength={255}
            placeholder={vendor ? "Category" : "Work / drawing name"}
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            className="min-w-[220px]"
          />

          {!vendor && (
            <Input
              aria-label="New row details"
              placeholder="Details"
              value={details}
              disabled={busy}
              onChange={(e) => setDetails(e.target.value)}
              className="min-w-[220px]"
            />
          )}

          <Button type="submit" variant="soft" icon={Plus} disabled={busy || !name.trim()}>
            {busy ? "Adding…" : "Add row"}
          </Button>
        </form>

        <div className="planner-toolbar">
          <Select
            value={rowId}
            onValueChange={setRowId}
            disabled={busy || !rows.length}
          >
            <SelectTrigger aria-label="Row to remove" className="min-w-[280px]">
              <SelectValue placeholder="Select row to remove" />
            </SelectTrigger>

            <SelectContent>
              {rows.map((row) => (
                <SelectItem key={row.id} value={row.id}>
                  {row.work_name ||
                    row.category_name ||
                    row.details ||
                    "Untitled row"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="danger"
            icon={Trash2}
            disabled={busy || !rowId}
            onClick={handleDelete}
          >
            {busy ? "Removing…" : "Remove selected row"}
          </Button>

          {selectedRow && (
            <span className="inos-hint">
              Selected:{" "}
              {selectedRow.work_name ||
                selectedRow.category_name ||
                selectedRow.details}
            </span>
          )}
        </div>
      </div>
    </details>
  );
}

export default PlannerRowActions;
