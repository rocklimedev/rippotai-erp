// Project planner — the current workbook view as an A4 document in the Word template family of the
// print kit (same cover, "01  Title" headings, thin rules and footer label as the Client Brief /
// Scope of Work / Plan of Action documents). No PDF reference exists for the planner; it follows
// the family. Status grids become plain text per location (only locations with a status listed).
import React, { forwardRef, useMemo } from 'react';
import {
  PrintDocument,
  WFields,
  coverRows,
  useProjectPeople,
  has,
  fmtDate,
  humanize,
} from '../print-document';
import './planner-document.css';
import { workbookRows } from './plannerWorkbookFormat';

const ACRONYMS = new Set([
  'AC',
  'CP',
  'RCC',
  'MEP',
  'HVAC',
  'PU',
  'LED',
  'DB',
  'UPVC',
  'WPC',
  'MDF',
  'HDF',
  'PVC',
  'GI',
  'MS',
  'SS',
  'TV',
  'POP',
  'PMC',
  'BOQ',
  '3D',
  '2D',
]);
const titleCase = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (w) =>
      ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1),
    )
    .replace(/\bPrepration\b/, 'Preparation')
    .replace(/\bAnd\b/g, 'and');

/** Drop columns that are empty in every row (keeps the first two). */
function pruneColumns(table) {
  const cellText = (c) => (c && typeof c === 'object' && !React.isValidElement(c) ? c.text : c);
  const keep = table.cols.map(
    (_, ci) => ci < 2 || table.items.some((r) => has(cellText(r.cells[ci]))),
  );
  const tpl = table.template.split(' ');
  return {
    ...table,
    cols: table.cols.filter((_, i) => keep[i]),
    template: tpl.filter((_, i) => keep[i]).join(' '),
    items: table.items.map((r) => ({ ...r, cells: r.cells.filter((_, i) => keep[i]) })),
  };
}

// Imported sheets sometimes store the text "NULL" for an empty cell — never print it.
const clean = (v) => (has(v) && String(v).trim().toLowerCase() !== 'null' ? v : '');

const MODULES = { CONSULTANCY: 'Consultancy', PMC: 'Project management (PMC)' };

export const plannerFileName = (projectName, view) =>
  `Project-Planner_${String(projectName || 'project').replace(/[^\w-]+/g, '-')}_${String(
    view || 'overview',
  )
    .toLowerCase()
    .replace(/[^\w]+/g, '-')}.pdf`;

const PlannerDocument = forwardRef(function PlannerDocument(
  { overview, view = 'Overview', project: projectInfo },
  ref,
) {
  const project = { ...(projectInfo || {}), ...(overview?.project || {}) };
  const people = useProjectPeople(project.id);
  const floors = useMemo(
    () => (overview?.locations || []).filter((l) => l.type === 'FLOOR'),
    [overview],
  );
  const columns = useMemo(
    () =>
      view === 'Overview' ? floors.flatMap((f) => (f.children?.length ? f.children : [f])) : floors,
    [floors, view],
  );

  const { sections, stats } = useMemo(() => {
    if (!overview) return { sections: [], stats: {} };
    const all = workbookRows(overview.planners);
    const isVendor = view === 'Vendor & Procurement';
    const rows =
      view === 'Overview'
        ? all
        : all.filter((i) => i.phase?.module === (view === 'Consultancy' ? 'CONSULTANCY' : 'PMC'));
    const floorOf = (loc) => {
      const parent = floors.find((f) => (f.children || []).some((c) => c.id === loc.id));
      return parent ? `${parent.name} · ${loc.name}` : loc.name;
    };
    const statusText = (item) => {
      const set = columns
        .map((loc) => {
          const rel = (item.locations || []).find(
            (r) => r.location_id === loc.id || r.location?.id === loc.id,
          );
          return rel?.status ? `${floorOf(loc)} — ${humanize(rel.status)}` : '';
        })
        .filter(has);
      if (set.length) return set.join('\n');
      return item.status && item.status !== 'NOT_STARTED' ? humanize(item.status) : '';
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
            skin: 'word',
            className: 'wd-table--open wd-pl-t',
            headNode: <div className="wd-pl-phase">{title}</div>,
            contLabel: title,
            cols: ['No.', 'Category', 'Vendor', 'Milestones', 'Remarks'],
            template: '9mm 42mm 34mm 1fr 34mm',
            allowSplit: list.length >= 3,
            items: list.map((p, i) => ({
              key: p.id,
              cells: [
                { text: String(i + 1), strong: false },
                titleCase(p.category_name),
                p.vendor_name || p.vendor?.name || '',
                {
                  text: [
                    p.estimate_finalised_at
                      ? `Estimate finalised ${d(p.estimate_finalised_at)}`
                      : '',
                    p.planned_start_date || p.planned_end_date
                      ? `Work ${range(p.planned_start_date, p.planned_end_date)}`
                      : '',
                    p.purchase_date ? `Purchased ${d(p.purchase_date)}` : '',
                    p.received_at_site_date ? `At site ${d(p.received_at_site_date)}` : '',
                  ]
                    .filter(has)
                    .join('\n'),
                  strong: false,
                },
                { text: p.remarks || '', strong: false },
              ],
            })),
          }),
        };
      };
      return {
        stats: {
          lines: proc.length,
          vendors: new Set(proc.map((p) => p.vendor_name || p.vendor?.name).filter(has)).size,
        },
        sections: [
          {
            title: 'Vendor & procurement',
            blocks: [
              group('LABOUR', 'Labour contractors'),
              group('MATERIAL', 'Material vendors'),
            ].filter(Boolean),
          },
        ],
      };
    }

    // group: module → phase
    const modules = [];
    rows.forEach((item) => {
      const m = item.phase?.module || 'OTHER';
      let mod = modules.find((x) => x.key === m);
      if (!mod) modules.push((mod = { key: m, phases: [] }));
      const pid = item.phase_id || item.phase?.id || 'none';
      let ph = mod.phases.find((x) => x.id === pid);
      if (!ph) mod.phases.push((ph = { id: pid, title: item.phase?.title || 'Other', items: [] }));
      ph.items.push(item);
    });
    let n = 0;
    const secs = modules.map((mod) => ({
      title: MODULES[mod.key] || titleCase(mod.key),
      blocks: mod.phases.map((ph) => ({
        table: pruneColumns({
          skin: 'word',
          className: 'wd-table--open wd-pl-t',
          headNode: <div className="wd-pl-phase">{titleCase(ph.title)}</div>,
          contLabel: titleCase(ph.title),
          cols: ['No.', 'Work', 'Status', 'Remarks'],
          template: '9mm 1fr 52mm 38mm',
          allowSplit: ph.items.length >= 3,
          items: ph.items.map((it) => ({
            key: it.id,
            cells: [
              { text: String(++n), strong: false },
              {
                text: titleCase(it.work_name || clean(it.details)),
                sub: it.work_name ? titleCase(clean(it.details)) : '',
                strong: true,
              },
              { text: statusText(it), strong: false },
              { text: it.remarks || '', strong: false },
            ],
          })),
        }),
      })),
    }));
    const applicable = rows.filter((i) => i.status !== 'NOT_APPLICABLE');
    return {
      stats: {
        tasks: rows.length,
        completed: applicable.filter((i) => i.status === 'COMPLETED').length,
        inProgress: applicable.filter((i) => i.status === 'IN_PROGRESS').length,
      },
      sections: secs,
    };
  }, [overview, view, columns, floors]);

  if (!overview) return null;
  const locations = columns.map((c) => c.name);
  const today = new Date().toISOString().slice(0, 10);
  const summary = {
    title: 'Summary',
    blocks: [
      <WFields
        key="f"
        cols={3}
        items={[
          { label: 'Project', value: project.name },
          { label: 'Client', value: project.client?.name },
          { label: 'Site', value: project.site_location },
          { label: 'Sheet', value: view },
          { label: 'Status as on', value: fmtDate(today) },
          { label: 'Tasks', value: stats.tasks != null ? String(stats.tasks) : '' },
          ...(stats.lines != null
            ? [
                { label: 'Procurement lines', value: String(stats.lines || 0) },
                { label: 'Vendors', value: String(stats.vendors || 0) },
              ]
            : [
                { label: 'Completed', value: String(stats.completed || 0) },
                { label: 'In progress', value: String(stats.inProgress || 0) },
              ]),
        ]}
      />,
      locations.length > 0 && (
        <WFields key="l" cols={1} items={[{ label: 'Locations', value: locations.join(', ') }]} />
      ),
    ].filter(Boolean),
  };
  return (
    <PrintDocument
      ref={ref}
      variant="word"
      className="wd-pl"
      docType="Project Planner"
      footerLabel="PROJECT PLANNER"
      title={project.name}
      wordCover={{
        title: 'PROJECT PLANNER',
        subtitle: view,
        className: 'wd-cover--stacked',
        rowsTop: 240,
        rows: coverRows({
          project: project.name,
          address: project.site_location,
          client: project.client?.name,
          architect: people.architect,
          lead: people.lead,
        }).map((row, i) => (i === 2 ? row.map((f) => ({ ...f, gold: true })) : row)),
      }}
      sections={[summary, ...sections]}
    />
  );
});

export default PlannerDocument;
