// Project planner sheet — Design / Build / Procurement.
// Columns: S.no · (Phase | Labour contractor) · (Drawings & design | Work | Material vendor)
// · (Details | Vendor name & phase) · Date · Status · Remarks.
// Date red = Late (past date, not completed) · green = Completed.
import { useState } from 'react';
import { toast } from 'sonner';
import {
  useUpdatePlannerItemMutation,
  useUpdateProcurementItemMutation,
} from '../../api/documents/project-planner.api';
import { STATUS_OPTIONS, VIEW_COLUMNS, rowState, viewRows } from './plannerModel';
import './PlannerWorkbook.css';

const fmt = (d) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

function EditCell({ value, type = 'text', title, save, className }) {
  const [draft, setDraft] = useState(value || '');
  const [busy, setBusy] = useState(false);
  const Control = type === 'date' ? 'input' : 'textarea';
  return (
    <Control
      rows={1}
      aria-label={title}
      type={type}
      value={draft}
      disabled={busy}
      className={className}
      ref={(node) => {
        if (node?.tagName === 'TEXTAREA') {
          node.style.height = 'auto';
          node.style.height = `${node.scrollHeight}px`;
        }
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        if (type !== 'date') {
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }
      }}
      onBlur={async () => {
        if (draft === (value || '')) return;
        setBusy(true);
        try {
          await save(draft || null);
        } catch (error) {
          setDraft(value || '');
          toast.error(error?.data?.message || 'Could not save this cell');
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export function PlannerWorkbook({ overview, view, refresh, editable = true }) {
  const [updateItem] = useUpdatePlannerItemMutation();
  const [updateProcurement] = useUpdateProcurementItemMutation();
  const [saving, setSaving] = useState('');
  const isProc = view === 'Procurement';
  const cols = VIEW_COLUMNS[view] || VIEW_COLUMNS.Design;
  const rows = viewRows(overview, view);

  const save = async (item, data) => {
    await (isProc ? updateProcurement : updateItem)({ id: item.id, data }).unwrap();
    await refresh();
  };

  const field = (item, key, type = 'text', className) =>
    editable ? (
      <EditCell
        key={`${item.id}:${key}:${item[key] || ''}`}
        value={
          type === 'date'
            ? String(item[key] || '').slice(0, 10)
            : String(item[key] ?? '')
                  .trim()
                  .toUpperCase() === 'NULL'
              ? ''
              : item[key]
        }
        type={type}
        className={className}
        title={`${key.replaceAll('_', ' ')} — ${item.work_name || item.category_name || item.details || ''}`}
        save={(value) => save(item, { [key]: value })}
      />
    ) : type === 'date' ? (
      fmt(String(item[key] || '').slice(0, 10))
    ) : String(item[key] ?? '')
        .trim()
        .toUpperCase() === 'NULL' ? (
      ''
    ) : (
      item[key] || ''
    );

  const setStatus = async (item, status) => {
    setSaving(item.id);
    try {
      const data = { status };
      if (!isProc) {
        data.progress_pct = status === 'COMPLETED' ? 100 : 0;
        data.actual_end_date =
          status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : null;
      }
      await save(item, data);
    } catch (error) {
      toast.error(error?.data?.message || 'Could not save status');
    } finally {
      setSaving('');
    }
  };

  const startCell = (item) => <div className="planner-date">{field(item, 'planned_start_date', 'date')}</div>;

  const dateCell = (item, st) => {
    const tone = st.key === 'late' ? 'is-late' : st.key === 'completed' ? 'is-done' : '';
    if (st.auto)
      return (
        <div
          className={`planner-date ${tone}`}
          title={`Uploaded: ${st.evidence.title}${st.planned ? ` · planned ${fmt(st.planned)}` : ''}`}
        >
          <span className="planner-date__text">{fmt(st.evidence.date)}</span>
          <small>Uploaded</small>
        </div>
      );
    return <div className={`planner-date ${tone}`}>{field(item, 'planned_end_date', 'date')}</div>;
  };

  const statusCell = (item, st) => {
    if (st.auto)
      return (
        <span
          className="planner-state is-completed"
          title={`Completed automatically — ${st.evidence.title} uploaded`}
        >
          Completed
        </span>
      );
    if (!editable) return <span className={`planner-state is-${st.key}`}>{st.label}</span>;
    const value =
      st.key === 'late'
        ? item.status || 'NOT_STARTED'
        : item.status === 'COMPLETED'
          ? 'COMPLETED'
          : item.status === 'IN_PROGRESS'
            ? 'IN_PROGRESS'
            : 'NOT_STARTED';
    return (
      <div className="planner-state-wrap">
        <select
          className={`planner-state is-${st.key}`}
          value={st.key === 'late' ? 'LATE' : value}
          disabled={saving === item.id}
          aria-label={`Status — ${item.work_name || item.category_name || item.details || ''}`}
          onChange={(e) => e.target.value !== 'LATE' && setStatus(item, e.target.value)}
        >
          {st.key === 'late' && (
            <option value="LATE" disabled>
              Late
            </option>
          )}
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="planner-sheet-scroll">
      <section className="planner-sheet" style={{ minWidth: 1130 }} data-sheet={view}>
        <header>
          <strong>RIPPŌTAI</strong>
          <h2>{`${view.toUpperCase()} — PROJECT PLANNER`}</h2>
          <p>{overview?.project?.name}</p>
        </header>

        <table>
          <colgroup>
            {[48, 116, 186, 146, 142, 142, 122, 158].map((width, index) => (
              <col key={index} style={{ width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th>S.no</th>
              <th>{cols.a}</th>
              <th>{cols.b}</th>
              <th>{cols.c}</th>
              <th>START</th>
              <th>END</th>
              <th>STATUS</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => {
              const st = rowState(item);
              const rowCls = st.key === 'late' ? 'is-late-row' : '';
              if (isProc)
                return (
                  <tr key={item.id} className={rowCls}>
                    <td>{index + 1}.0</td>
                    <td>{item.item_type === 'LABOUR' ? field(item, 'category_name') : ''}</td>
                    <td>{item.item_type === 'MATERIAL' ? field(item, 'category_name') : ''}</td>
                    <td>{field(item, 'vendor_name')}</td>
                    <td>{startCell(item)}</td>
                    <td>{dateCell(item, st)}</td>
                    <td>{statusCell(item, st)}</td>
                    <td>{field(item, 'remarks')}</td>
                  </tr>
                );
              const start = index === 0 || rows[index - 1].phase_id !== item.phase_id;
              let span = 1;
              while (rows[index + span]?.phase_id === item.phase_id) span++;
              return (
                <tr key={item.id} className={rowCls}>
                  <td>{index + 1}.0</td>
                  {start && (
                    <td rowSpan={span} className="planner-phase">
                      {item.phase?.title}
                    </td>
                  )}
                  <td>{field(item, 'work_name')}</td>
                  <td>{field(item, 'details')}</td>
                  <td>{startCell(item)}</td>
                  <td>{dateCell(item, st)}</td>
                  <td>{statusCell(item, st)}</td>
                  <td>{field(item, 'remarks')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!rows.length && (
          <p className="planner-empty">
            {isProc
              ? 'No procurement rows yet — add labour contractors and material vendors below.'
              : 'No rows yet — initialise the planner or add rows below.'}
          </p>
        )}
      </section>
    </div>
  );
}

export default PlannerWorkbook;
