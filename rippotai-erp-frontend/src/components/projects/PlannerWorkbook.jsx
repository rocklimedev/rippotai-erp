import { useState } from "react";
import { toast } from "sonner";

import {
  useAttachPlannerLocationsMutation,
  useUpdateItemLocationMutation,
  useUpdatePlannerItemMutation,
  useUpdateProcurementItemMutation,
} from "../../api/documents/project-planner.api";

import "./PlannerWorkbook.css";
import { workbookRows } from "./plannerWorkbookFormat";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "NOT_APPLICABLE",
];

const label = (value) => value?.toLowerCase().replaceAll("_", " ") || "";

function EditCell({ value, type = "text", title, save }) {
  const [draft, setDraft] = useState(value || "");
  const [busy, setBusy] = useState(false);

  const Control = type === "date" ? "input" : "textarea";

  return (
    <Control
      rows={2}
      aria-label={title}
      type={type}
      value={draft}
      disabled={busy}
      ref={(node) => {
        if (node?.tagName === "TEXTAREA") {
          node.style.height = "auto";
          node.style.height = `${node.scrollHeight}px`;
        }
      }}
      onChange={(e) => {
        setDraft(e.target.value);

        if (type !== "date") {
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }
      }}
      onBlur={async () => {
        if (draft === (value || "")) return;

        setBusy(true);

        try {
          await save(draft || null);
        } catch (error) {
          setDraft(value || "");

          toast.error(error?.data?.message || "Could not save this cell");
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export function PlannerWorkbook({ overview, view, refresh, editable = true }) {
  const [updateLocation] = useUpdateItemLocationMutation();
  const [attachLocation] = useAttachPlannerLocationsMutation();
  const [updateItem] = useUpdatePlannerItemMutation();
  const [updateProcurement] = useUpdateProcurementItemMutation();

  const [saving, setSaving] = useState("");

  const floors = (overview?.locations || []).filter(
    (location) => location.type === "FLOOR",
  );

  const columns =
    view === "Overview"
      ? floors.flatMap((floor) =>
          floor.children?.length ? floor.children : [floor],
        )
      : floors;

  const allRows = workbookRows(overview?.planners);

  const rows =
    view === "Overview"
      ? allRows
      : allRows.filter(
          (item) =>
            item.phase?.module ===
            (view === "Consultancy" ? "CONSULTANCY" : "PMC"),
        );

  const procurement = (overview?.planners || [])
    .flatMap((planner) => planner.procurement_items || [])
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  const isVendor = view === "Vendor & Procurement";

  const saveItem = async (item, key, value) => {
    await updateItem({
      id: item.id,
      data: {
        [key]: value,
      },
    }).unwrap();

    await refresh();
  };

  const saveVendor = async (item, key, value) => {
    await updateProcurement({
      id: item.id,
      data: {
        [key]: value,
      },
    }).unwrap();

    await refresh();
  };

  const statusCell = (item, location) => {
    const relation = item.locations?.find(
      (locationItem) => locationItem.location_id === location.id,
    );

    const key = `${item.id}:${location.id}`;

    if (!editable) {
      return label(relation?.status);
    }

    return (
      <div className="min-w-[130px]">
        <Select
          value={relation?.status || ""}
          disabled={saving === key}
          onValueChange={async (status) => {
            if (!status) return;

            setSaving(key);

            try {
              let id = relation?.id;

              if (!id) {
                await attachLocation({
                  itemId: item.id,
                  location_ids: [location.id],
                }).unwrap();

                const result = await refresh();

                const data = result?.data?.data || result?.data;

                id = workbookRows(data?.planners)
                  .find((plannerItem) => plannerItem.id === item.id)
                  ?.locations?.find(
                    (locationItem) => locationItem.location_id === location.id,
                  )?.id;
              }

              if (!id) {
                throw new Error("Location relation could not be resolved");
              }

              await updateLocation({
                id,
                data: {
                  status,
                  progress_pct:
                    status === "COMPLETED"
                      ? 100
                      : status === "IN_PROGRESS"
                        ? Math.max(
                            1,
                            Math.min(99, Number(relation?.progress_pct || 1)),
                          )
                        : 0,
                },
              }).unwrap();

              await refresh();
            } catch (error) {
              toast.error(
                error?.data?.message ||
                  error.message ||
                  "Could not save status",
              );
            } finally {
              setSaving("");
            }
          }}
        >
          <SelectTrigger
            className="h-9 w-full min-w-[125px] border-0 bg-transparent shadow-none focus:ring-1"
            aria-label={`${item.work_name || item.details} — ${location.name}`}
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>

          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {label(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const field = (item, key, type = "text", vendor = false) =>
    editable ? (
      <EditCell
        key={`${item.id}:${key}:${item[key] || ""}`}
        value={item[key]}
        type={type}
        title={`${key.replaceAll("_", " ")} — ${
          item.work_name || item.category_name || item.details
        }`}
        save={(value) =>
          vendor ? saveVendor(item, key, value) : saveItem(item, key, value)
        }
      />
    ) : (
      item[key] || ""
    );

  return (
    <div className="planner-sheet-scroll">
      <section
        className="planner-sheet"
        style={{
          minWidth: isVendor
            ? 1800
            : Math.max(1100, 650 + columns.length * 150),
        }}
        data-sheet={view}
      >
        <header>
          <strong>RIPPŌTAI</strong>

          <h2>
            {view === "Overview"
              ? "PROJECT PLANNER"
              : `${view.toUpperCase()} — PROJECT PLANNER`}
          </h2>

          <p>{overview?.project?.name}</p>
        </header>

        <table>
          <colgroup>
            {(isVendor
              ? [54, 170, 170, 220, 140, 140, 140, 140, 140, 140, 220]
              : [
                  54,
                  180,
                  230,
                  250,
                  ...columns.map(() => 150),
                  ...(view !== "Overview" ? [220] : []),
                ]
            ).map((width, index) => (
              <col
                key={index}
                style={{
                  width,
                }}
              />
            ))}
          </colgroup>

          <thead>
            {isVendor ? (
              <>
                <tr className="planner-superhead">
                  <th colSpan={6} />

                  <th colSpan={2}>TIMELINE (LABOUR WORK)</th>

                  <th colSpan={2}>STATUS (MATERIAL)</th>

                  <th />
                </tr>

                <tr>
                  {[
                    "Sr. No.",
                    "LABOUR CONTRACTOR",
                    "MATERIAL VENDOR",
                    "VENDOR NAME",
                    "ESTIMATE FINALISED",
                    "QUOTATION FINALISED",
                    "START",
                    "END",
                    "PURCHASE",
                    "RECEIVED AT SITE",
                    "REMARKS",
                  ].map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <th rowSpan={view === "Overview" ? 2 : 1}>S.no</th>

                  <th rowSpan={view === "Overview" ? 2 : 1}>
                    {view === "Overview" ? "EXECUTION" : "PHASE"}
                  </th>

                  <th rowSpan={view === "Overview" ? 2 : 1}>
                    {view === "Consultancy"
                      ? "DRAWINGS & DESIGN"
                      : view === "Overview"
                        ? "DOCUMENTS"
                        : "WORK"}
                  </th>

                  <th rowSpan={view === "Overview" ? 2 : 1}>DETAILS</th>

                  {view === "Overview"
                    ? floors.map((floor) => (
                        <th
                          key={floor.id}
                          colSpan={floor.children?.length || 1}
                        >
                          {floor.name}
                        </th>
                      ))
                    : columns.map((location) => (
                        <th key={location.id}>{location.name}</th>
                      ))}

                  {view !== "Overview" && <th>REMARKS</th>}
                </tr>

                {view === "Overview" && (
                  <tr>
                    {columns.map((location) => (
                      <th key={location.id}>{location.name}</th>
                    ))}
                  </tr>
                )}
              </>
            )}
          </thead>

          <tbody>
            {isVendor
              ? procurement.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}.0</td>

                    <td>
                      {item.item_type === "LABOUR"
                        ? field(item, "category_name", "text", true)
                        : ""}
                    </td>

                    <td>
                      {item.item_type === "MATERIAL"
                        ? field(item, "category_name", "text", true)
                        : ""}
                    </td>

                    <td>{field(item, "vendor_name", "text", true)}</td>

                    {[
                      "estimate_finalised_at",
                      "quotation_finalised_at",
                      "planned_start_date",
                      "planned_end_date",
                      "purchase_date",
                      "received_at_site_date",
                    ].map((key) => (
                      <td key={key}>{field(item, key, "date", true)}</td>
                    ))}

                    <td>{field(item, "remarks", "text", true)}</td>
                  </tr>
                ))
              : rows.map((item, index) => {
                  const start =
                    index === 0 || rows[index - 1].phase_id !== item.phase_id;

                  let span = 1;

                  while (rows[index + span]?.phase_id === item.phase_id) {
                    span++;
                  }

                  return (
                    <tr key={item.id}>
                      <td>{index + 1}.0</td>

                      {start && (
                        <td rowSpan={span} className="planner-phase">
                          {item.phase?.title}
                        </td>
                      )}

                      <td>{field(item, "work_name")}</td>

                      <td>{field(item, "details")}</td>

                      {columns.map((location) => (
                        <td key={location.id}>{statusCell(item, location)}</td>
                      ))}

                      {view !== "Overview" && <td>{field(item, "remarks")}</td>}
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {!rows.length && !isVendor && (
          <p className="planner-empty">
            Initialize the project planner to populate this sheet.
          </p>
        )}

        {isVendor && !procurement.length && (
          <p className="planner-empty">
            Initialize the project planner to populate procurement categories.
          </p>
        )}
      </section>
    </div>
  );
}

export default PlannerWorkbook;
