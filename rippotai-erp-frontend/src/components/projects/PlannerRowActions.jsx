import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const planner = overview.planners?.find((p) => p.type === "PROJECT");
  if (!planner || view === "Overview") return null;
  const vendor = view === "Vendor & Procurement";
  const rows = vendor
    ? planner.procurement_items || []
    : workbookRows([planner]).filter(
        (i) =>
          i.phase?.module === (view === "Consultancy" ? "CONSULTANCY" : "PMC"),
      );
  const phases = Array.from(
    new Map(
      rows.filter((r) => r.phase).map((r) => [r.phase.id, r.phase]),
    ).values(),
  );
  return (
    <details className="rounded border p-3">
      <summary className="cursor-pointer text-sm">Add or remove rows</summary>
      <form
        className="planner-toolbar mt-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            if (vendor)
              await createVendor({
                plannerId: planner.id,
                data: {
                  category_name: name.trim(),
                  item_type: type,
                  sort_order:
                    Math.max(0, ...rows.map((r) => Number(r.sort_order))) + 1,
                },
              }).unwrap();
            else
              await createTask({
                plannerId: planner.id,
                data: {
                  phase_id: phaseId || phases[0]?.id,
                  work_name: name.trim(),
                  details: details.trim() || undefined,
                  sort_order:
                    Math.max(0, ...rows.map((r) => Number(r.sort_order))) + 1,
                  location_ids: (overview.locations || []).flatMap((f) => [
                    f.id,
                    ...(f.children || []).map((c) => c.id),
                  ]),
                },
              }).unwrap();
            setName("");
            setDetails("");
            await refresh();
            toast.success("Row added");
          } catch (error) {
            toast.error(error?.data?.message || "Could not add row");
          } finally {
            setBusy(false);
          }
        }}
      >
        {vendor ? (
          <select
            aria-label="Procurement type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="MATERIAL">Material vendor</option>
            <option value="LABOUR">Labour contractor</option>
          </select>
        ) : (
          <select
            aria-label="Task phase"
            value={phaseId || phases[0]?.id || ""}
            onChange={(e) => setPhaseId(e.target.value)}
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
        <input
          aria-label="New row name"
          required
          maxLength={255}
          placeholder={vendor ? "Category" : "Work / drawing name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {!vendor && (
          <input
            aria-label="New row details"
            placeholder="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        )}
        <Button type="submit" disabled={busy || !name.trim()}>
          Add row
        </Button>
      </form>
      <div className="planner-toolbar mt-3">
        <select
          aria-label="Row to remove"
          value={rowId}
          onChange={(e) => setRowId(e.target.value)}
        >
          <option value="">Select row to remove</option>
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.work_name || r.category_name || r.details}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          disabled={busy || !rowId}
          onClick={async () => {
            setBusy(true);
            try {
              await (vendor ? deleteVendor : deleteTask)(rowId).unwrap();
              setRowId("");
              await refresh();
              toast.success("Row removed");
            } catch {
              toast.error("Could not remove row");
            } finally {
              setBusy(false);
            }
          }}
        >
          Remove selected row
        </Button>
      </div>
    </details>
  );
}
