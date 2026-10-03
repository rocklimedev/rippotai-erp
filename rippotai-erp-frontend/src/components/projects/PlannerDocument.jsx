// Project planner — the current workbook view as a client-ready A4 document (shared Rippotai print kit).
// Status grids become plain text per location (only locations that have a status are listed).
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, has, fmtDate, humanize } from "../print-document";
import { COMMERCE_CLASS } from "../print-document/commerce";
import { workbookRows } from "./plannerWorkbookFormat";

const ACRONYMS = new Set(["AC", "CP", "RCC", "MEP", "HVAC", "PU", "LED", "DB", "UPVC", "WPC", "MDF", "HDF", "PVC", "GI", "MS", "SS", "TV", "POP", "PMC", "BOQ", "3D", "2D"]);
const titleCase = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (w) => (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .replace(/\bPrepration\b/, "Preparation")
    .replace(/\bAnd\b/g, "and");

/** Drop columns that are empty in every row (keeps the first two). */
function pruneColumns(table) {
  const cellText = (c) => (c && typeof c === "object" && !React.isValidElement(c) ? c.text : c);
  const keep = table.cols.map((_, ci) => ci < 2 || table.items.some((r) => has(cellText(r.cells[ci]))));
  const tpl = table.template.split(" ");
  return {
    ...table,
    cols: table.cols.filter((_, i) => keep[i]),
    template: tpl.filter((_, i) => keep[i]).join(" "),
    items: table.items.map((r) => ({ ...r, cells: r.cells.filter((_, i) => keep[i]) })),
  };
}

const MODULES = { CONSULTANCY: "Consultancy", PMC: "Project management (PMC)" };

export const plannerFileName = (projectName, view) =>
  `Project-Planner_${String(projectName || "project").replace(/[^\w-]+/g, "-")}_${String(view || "overview").toLowerCase().replace(/[^\w]+/g, "-")}.pdf`;

const PlannerDocument = forwardRef(function PlannerDocument({ overview, view = "Overview", project: projectInfo }, ref) {
  const project = { ...(projectInfo || {}), ...(overview?.project || {}) };
  const floors = useMemo(() => (overview?.locations || []).filter((l) => l.type === "FLOOR"), [overview]);
  const columns = useMemo(
    () => (view === "Overview" ? floors.flatMap((f) => (f.children?.length ? f.children : [f])) : floors),
    [floors, view],
  );

  const { sections, stats } = useMemo(() => {
    if (!overview) return { sections: [], stats: {} };
    const all = workbookRows(overview.planners);
    const isVendor = view === "Vendor & Procurement";
    const rows =
      view === "Overview" ? all : all.filter((i) => i.phase?.module === (view === "Consultancy" ? "CONSULTANCY" : "PMC"));
    const floorOf = (loc) => {
      const parent = floors.find((f) => (f.children || []).some((c) => c.id === loc.id));
      return parent ? `${parent.name} · ${loc.name}` : loc.name;
    };
    const statusText = (item) => {
      const set = columns
        .map((loc) => {
          const rel = (item.locations || []).find((r) => r.location_id === loc.id || r.location?.id === loc.id);
          return rel?.status ? `${floorOf(loc)} — ${humanize(rel.status)}` : "";
        })
        .filter(has);
      if (set.length) return set.join("\n");
      return item.status && item.status !== "NOT_STARTED" ? humanize(item.status) : "";
    };

    if (isVendor) {
      const proc = (overview.planners || [])
        .flatMap((p) => p.procurement_items || [])
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      const d = (v) => fmtDate(v, { short: true });
      const range = (a, b) => (a && b ? `${d(a)} – ${d(b)}` : d(a) || d(b));
      const group = (type, title) => {
        const list = proc.filter((p) => p.item_type === type);
        if (!list.length) return null;
        return {
          table: pruneColumns({
            heading: title,
            cols: ["No.", "Category", "Vendor", "Milestones", "Remarks"],
            template: "9mm 42mm 34mm 1fr 34mm",
            allowSplit: list.length >= 3,
            items: list.map((p, i) => ({
              key: p.id,
              cells: [
                { text: String(i + 1), strong: false },
                titleCase(p.category_name),
                p.vendor_name || p.vendor?.name || "",
                {
                  text: [
                    p.estimate_finalised_at ? `Estimate finalised ${d(p.estimate_finalised_at)}` : "",
                    p.quotation_finalised_at ? `Quotation finalised ${d(p.quotation_finalised_at)}` : "",
                    p.planned_start_date || p.planned_end_date ? `Work ${range(p.planned_start_date, p.planned_end_date)}` : "",
                    p.purchase_date ? `Purchased ${d(p.purchase_date)}` : "",
                    p.received_at_site_date ? `At site ${d(p.received_at_site_date)}` : "",
                  ]
                    .filter(has)
                    .join("\n"),
                  strong: false,
                },
                { text: p.remarks || "", strong: false },
              ],
            })),
          }),
        };
      };
      return {
        stats: { lines: proc.length, vendors: new Set(proc.map((p) => p.vendor_name || p.vendor?.name).filter(has)).size },
        sections: [
          {
            title: "Vendor & procurement",
            blocks: [group("LABOUR", "Labour contractors"), group("MATERIAL", "Material vendors")].filter(Boolean),
          },
        ],
      };
    }

    // group: module → phase
    const modules = [];
    rows.forEach((item) => {
      const m = item.phase?.module || "OTHER";
      let mod = modules.find((x) => x.key === m);
      if (!mod) modules.push((mod = { key: m, phases: [] }));
      const pid = item.phase_id || item.phase?.id || "none";
      let ph = mod.phases.find((x) => x.id === pid);
      if (!ph) mod.phases.push((ph = { id: pid, title: item.phase?.title || "Other", items: [] }));
      ph.items.push(item);
    });
    let n = 0;
    const secs = modules.map((mod) => ({
      title: MODULES[mod.key] || titleCase(mod.key),
      blocks: mod.phases.map((ph) => ({
        table: pruneColumns({
          heading: titleCase(ph.title),
          cols: ["No.", "Work", "Status", "Remarks"],
          template: "9mm 1fr 52mm 38mm",
          allowSplit: ph.items.length >= 3,
          items: ph.items.map((it) => ({
            key: it.id,
            cells: [
              { text: String(++n), strong: false },
              { text: titleCase(it.work_name || it.details), sub: it.work_name ? titleCase(it.details) : "", strong: true },
              { text: statusText(it), strong: false },
              { text: it.remarks || "", strong: false },
            ],
          })),
        }),
      })),
    }));
    const applicable = rows.filter((i) => i.status !== "NOT_APPLICABLE");
    return {
      stats: {
        tasks: rows.length,
        completed: applicable.filter((i) => i.status === "COMPLETED").length,
        inProgress: applicable.filter((i) => i.status === "IN_PROGRESS").length,
      },
      sections: secs,
    };
  }, [overview, view, columns, floors]);

  if (!overview) return null;
  const locations = columns.map((c) => c.name);
  const summary = {
    title: "Summary",
    blocks: [
      <KV
        key="kv"
        cols={3}
        items={[
          { label: "Project", value: project.name, strong: true },
          { label: "Client", value: project.client?.name },
          { label: "Site", value: project.site_location },
          { label: "Sheet", value: view },
          { label: "Tasks", value: stats.tasks != null ? String(stats.tasks) : "" },
          { label: "Completed", value: stats.completed ? String(stats.completed) : "" },
          { label: "In progress", value: stats.inProgress ? String(stats.inProgress) : "" },
          { label: "Procurement lines", value: stats.lines ? String(stats.lines) : "" },
          { label: "Locations", value: locations.length ? locations : "", wide: true },
        ]}
      />,
    ],
  };
  const today = new Date().toISOString().slice(0, 10);
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType="Project Planner"
      title={project.name}
      subtitle={view === "Overview" ? "Overview of all work" : view}
      coverDetails={[
        { label: "Client", value: project.client?.name },
        { label: "Project", value: project.name },
        { label: "Site", value: project.site_location },
        { label: "Sheet", value: view },
        { label: "Status as on", value: fmtDate(today) },
        { label: "Prepared by", value: "Rippotai Architecture" },
      ]}
      preparedFor={project.client?.name || project.name}
      reference={view}
      date={fmtDate(today, { short: true })}
      sections={[summary, ...sections]}
    />
  );
});

export default PlannerDocument;
