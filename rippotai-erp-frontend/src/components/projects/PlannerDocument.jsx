import React, { forwardRef, useMemo } from 'react';
import {
  PrintDocument,
  WFields,
  coverRows,
  useProjectPeople,
  has,
  fmtDate,
} from '../print-document';
import './planner-document.css';
import { VIEW_COLUMNS, normalizeView, rowState, viewCounts, viewRows } from './plannerModel';

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

export const plannerFileName = (projectName, view) =>
  `Project-Planner_${String(projectName || 'project').replace(/[^\w-]+/g, '-')}_${String(
    view || 'overview',
  )
    .toLowerCase()
    .replace(/[^\w]+/g, '-')}.pdf`;

const fmtDay = (d) => (d ? fmtDate(d, { short: true }) : '');

const PlannerDocument = forwardRef(function PlannerDocument(
  { overview, view = 'Design', project: projectInfo },
  ref,
) {
  const sheet = normalizeView(view);
  const project = { ...(projectInfo || {}), ...(overview?.project || {}) };
  const people = useProjectPeople(project.id);

  const { sections, counts, total } = useMemo(() => {
    if (!overview) return { sections: [], counts: {}, total: 0 };
    const rows = viewRows(overview, sheet);
    const cols = VIEW_COLUMNS[sheet];
    const dateText = (it) => {
      const st = rowState(it);
      return st.auto ? `${fmtDay(st.evidence.date)}\nUploaded` : fmtDay(st.date);
    };
    const stateText = (it) => rowState(it).label;
    let n = 0;
    const table = (title, list, cells, headers, template) => ({
      table: pruneColumns({
        skin: 'word',
        className: 'wd-table--open wd-pl-t',
        headNode: <div className="wd-pl-phase">{title}</div>,
        contLabel: title,
        cols: headers,
        template,
        allowSplit: list.length >= 3,
        items: list.map((it) => ({ key: it.id, cells: cells(it) })),
      }),
    });
    let secs;
    if (sheet === 'Procurement') {
      const cell = (it) => [
        { text: String(++n), strong: false },
        { text: titleCase(it.category_name), strong: true },
        { text: it.vendor_name || it.vendor?.name || '', strong: false },
        { text: dateText(it), strong: false },
        { text: stateText(it), strong: false },
        { text: it.remarks || '', strong: false },
      ];
      const headers = ['No.', 'Name', titleCase(cols.c), 'Date', 'Status', 'Remarks'];
      const tpl = '9mm 1fr 40mm 24mm 20mm 34mm';
      secs = [
        {
          title: 'Procurement',
          blocks: [
            rows.some((r) => r.item_type === 'LABOUR') &&
              table(
                titleCase(cols.a),
                rows.filter((r) => r.item_type === 'LABOUR'),
                cell,
                headers,
                tpl,
              ),
            rows.some((r) => r.item_type === 'MATERIAL') &&
              table(
                titleCase(cols.b),
                rows.filter((r) => r.item_type === 'MATERIAL'),
                cell,
                headers,
                tpl,
              ),
          ].filter(Boolean),
        },
      ];
    } else {
      const phases = [];
      rows.forEach((it) => {
        const pid = it.phase_id || it.phase?.id || 'none';
        let ph = phases.find((x) => x.id === pid);
        if (!ph) phases.push((ph = { id: pid, title: it.phase?.title || 'Other', items: [] }));
        ph.items.push(it);
      });
      secs = [
        {
          title: `${sheet} planner`,
          blocks: phases.map((ph) =>
            table(
              titleCase(ph.title),
              ph.items,
              (it) => [
                { text: String(++n), strong: false },
                {
                  text: titleCase(it.work_name || clean(it.details)),
                  sub: it.work_name ? titleCase(clean(it.details)) : '',
                  strong: true,
                },
                { text: dateText(it), strong: false },
                { text: stateText(it), strong: false },
                { text: it.remarks || '', strong: false },
              ],
              ['No.', titleCase(cols.b), 'Date', 'Status', 'Remarks'],
              '9mm 1fr 24mm 20mm 38mm',
            ),
          ),
        },
      ];
    }
    return { sections: secs, counts: viewCounts(rows), total: rows.length };
  }, [overview, sheet]);

  if (!overview) return null;
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
          { label: 'Planner', value: sheet },
          { label: 'Status as on', value: fmtDate(today) },
          { label: 'Rows', value: String(total) },
          { label: 'Completed', value: String(counts.completed || 0) },
          { label: 'Late', value: String(counts.late || 0) },
          { label: 'Due / pending', value: String((counts.due || 0) + (counts.pending || 0)) },
        ]}
      />,
    ],
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
        subtitle: sheet,
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
