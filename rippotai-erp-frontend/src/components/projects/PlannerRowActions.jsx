// Add / remove rows of the Design, Build or Procurement planner.
// Design: Phase (existing or new) · Drawings & design · Details · Date
// Build:  Phase (existing or new) · Work · Details · Date
// Procurement: Labour contractor or Material vendor · Vendor name & phase · Date
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Rows3, Trash2 } from 'lucide-react';
import { Button, TextInput as Input } from '@/components/inos';
import {
  useCreatePlannerItemMutation,
  useCreatePlannerPhaseMutation,
  useCreateProcurementItemMutation,
  useDeletePlannerItemMutation,
  useDeleteProcurementItemMutation,
  useListPlannerPhasesQuery,
} from '../../api/documents/project-planner.api';
import { VIEW_COLUMNS, VIEW_MODULE, mainPlanner, viewRows } from './plannerModel';

const NEW_PHASE = '__new__';
const selectCls = 'inos-select';

export function PlannerRowActions({ overview, view, refresh }) {
  const [phaseId, setPhaseId] = useState('');
  const [newPhase, setNewPhase] = useState('');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [type, setType] = useState('LABOUR');
  const [rowId, setRowId] = useState('');
  const [busy, setBusy] = useState(false);

  const isProc = view === 'Procurement';
  const module = VIEW_MODULE[view];
  const { data: phaseData } = useListPlannerPhasesQuery(module, { skip: isProc || !module });
  const [createTask] = useCreatePlannerItemMutation();
  const [createPhase] = useCreatePlannerPhaseMutation();
  const [createVendor] = useCreateProcurementItemMutation();
  const [deleteTask] = useDeletePlannerItemMutation();
  const [deleteVendor] = useDeleteProcurementItemMutation();

  const planner = mainPlanner(overview);
  if (!planner) return null;

  const cols = VIEW_COLUMNS[view];
  const rows = viewRows(overview, view);
  const phases = (Array.isArray(phaseData) ? phaseData : phaseData?.data || []).filter(
    (p) => p.module === module,
  );
  const selectedPhase = phaseId || phases[0]?.id || '';
  const nextSort = () => Math.max(0, ...rows.map((r) => Number(r.sort_order || 0))) + 1;

  const reset = () => {
    setName('');
    setDetails('');
    setDate('');
    setRemarks('');
    setNewPhase('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (isProc) {
        await createVendor({
          plannerId: planner.id,
          data: {
            item_type: type,
            category_name: name.trim(),
            vendor_name: details.trim() || undefined,
            planned_end_date: date || undefined,
            remarks: remarks.trim() || undefined,
            sort_order: nextSort(),
          },
        }).unwrap();
      } else {
        let phase = selectedPhase;
        if (phase === NEW_PHASE) {
          if (!newPhase.trim()) throw new Error('Enter the new phase name');
          const created = await createPhase({ module, title: newPhase.trim() }).unwrap();
          phase = (created?.data || created)?.id;
        }
        if (!phase) throw new Error('Choose a phase');
        await createTask({
          plannerId: planner.id,
          data: {
            phase_id: phase,
            work_name: name.trim(),
            details: details.trim() || undefined,
            planned_end_date: date || undefined,
            remarks: remarks.trim() || undefined,
            sort_order: nextSort(),
          },
        }).unwrap();
        if (selectedPhase === NEW_PHASE) setPhaseId(phase);
      }
      reset();
      await refresh();
      toast.success('Row added');
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'Could not add row');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!rowId) return;
    setBusy(true);
    try {
      await (isProc ? deleteVendor : deleteTask)(rowId).unwrap();
      setRowId('');
      await refresh();
      toast.success('Row removed');
    } catch (error) {
      toast.error(error?.data?.message || 'Could not remove row');
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="inos-card" style={{ padding: '14px 20px' }} open>
      <summary
        className="cursor-pointer select-none"
        style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14 }}
      >
        <span className="inos-icon-tile inos-icon-tile--sm" aria-hidden>
          <Rows3 />
        </span>
        Add or remove rows
        <span style={{ fontWeight: 500, color: 'var(--text-3)', fontSize: 13 }}>
          — {view} planner
        </span>
      </summary>

      <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
        <form className="planner-add-row" onSubmit={handleCreate}>
          {isProc ? (
            <select
              className={selectCls}
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={busy}
              aria-label="Row type"
              style={{ minWidth: 190 }}
            >
              <option value="LABOUR">{cols.a}</option>
              <option value="MATERIAL">{cols.b}</option>
            </select>
          ) : (
            <select
              className={selectCls}
              value={selectedPhase}
              onChange={(e) => setPhaseId(e.target.value)}
              disabled={busy}
              aria-label="Phase"
              style={{ minWidth: 200 }}
            >
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
              <option value={NEW_PHASE}>+ New phase…</option>
            </select>
          )}
          {!isProc && selectedPhase === NEW_PHASE && (
            <Input
              aria-label="New phase"
              placeholder="New phase name"
              value={newPhase}
              disabled={busy}
              onChange={(e) => setNewPhase(e.target.value)}
              style={{ minWidth: 180 }}
            />
          )}
          <Input
            aria-label={isProc ? (type === 'LABOUR' ? cols.a : cols.b) : cols.b}
            required
            maxLength={255}
            placeholder={
              isProc
                ? type === 'LABOUR'
                  ? 'Labour contractor (e.g. Electrician)'
                  : 'Material vendor (e.g. Tiles)'
                : view === 'Design'
                  ? 'Drawings & design'
                  : 'Work'
            }
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <Input
            aria-label={cols.c}
            placeholder={isProc ? 'Vendor name & phase' : 'Details'}
            value={details}
            disabled={busy}
            onChange={(e) => setDetails(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <Input
            type="date"
            aria-label="Date"
            value={date}
            disabled={busy}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 160 }}
          />
          <Input
            aria-label="Remarks"
            placeholder="Remarks"
            value={remarks}
            disabled={busy}
            onChange={(e) => setRemarks(e.target.value)}
            style={{ minWidth: 160 }}
          />
          <Button type="submit" variant="soft" icon={Plus} disabled={busy || !name.trim()}>
            {busy ? 'Adding…' : 'Add row'}
          </Button>
        </form>

        <div className="planner-add-row planner-add-row--remove">
          <select
            className={selectCls}
            value={rowId}
            onChange={(e) => setRowId(e.target.value)}
            disabled={busy || !rows.length}
            aria-label="Row to remove"
            style={{ minWidth: 280 }}
          >
            <option value="">Select row to remove</option>
            {rows.map((row, i) => (
              <option key={row.id} value={row.id}>
                {i + 1}.{' '}
                {[row.work_name || row.category_name, row.details || row.vendor_name]
                  .filter(Boolean)
                  .join(' — ') || 'Untitled row'}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="danger"
            icon={Trash2}
            disabled={busy || !rowId}
            onClick={handleDelete}
          >
            {busy ? 'Removing…' : 'Remove selected row'}
          </Button>
        </div>
      </div>
    </details>
  );
}

export default PlannerRowActions;
