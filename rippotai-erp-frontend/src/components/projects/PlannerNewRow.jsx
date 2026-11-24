import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button, TextInput as Input } from '@/components/inos';
import {
  useCreatePlannerItemMutation,
  useCreatePlannerPhaseMutation,
  useCreateProcurementItemMutation,
  useListPlannerPhasesQuery,
} from '../../api/documents/project-planner.api';
import { VIEW_COLUMNS, VIEW_MODULE, mainPlanner, viewRows } from './plannerModel';

const NEW_PHASE = '__new__';

export function PlannerNewRow({ overview, view, refresh }) {
  const formId = useId();
  const [phaseId, setPhaseId] = useState('');
  const [newPhase, setNewPhase] = useState('');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [start, setStart] = useState('');
  const [date, setDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [type, setType] = useState('LABOUR');
  const [busy, setBusy] = useState(false);

  const isProc = view === 'Procurement';
  const module = VIEW_MODULE[view];
  const { data: phaseData } = useListPlannerPhasesQuery(module, { skip: isProc || !module });
  const [createTask] = useCreatePlannerItemMutation();
  const [createPhase] = useCreatePlannerPhaseMutation();
  const [createVendor] = useCreateProcurementItemMutation();

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
    setStart('');
    setDate('');
    setRemarks('');
    setNewPhase('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      if (isProc) {
        await createVendor({
          plannerId: planner.id,
          data: {
            item_type: type,
            category_name: name.trim(),
            vendor_name: details.trim() || undefined,
            planned_start_date: start || undefined,
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
          if (phase) setPhaseId(phase);
        }
        if (!phase) throw new Error('Choose a phase');
        await createTask({
          plannerId: planner.id,
          data: {
            phase_id: phase,
            work_name: name.trim(),
            details: details.trim() || undefined,
            planned_start_date: start || undefined,
            planned_end_date: date || undefined,
            remarks: remarks.trim() || undefined,
            sort_order: nextSort(),
          },
        }).unwrap();
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

  const nameInput = (label) => (
    <Input
      form={formId}
      aria-label={label}
      placeholder={label}
      required
      maxLength={255}
      value={name}
      disabled={busy}
      onChange={(e) => setName(e.target.value)}
    />
  );

  return (
    <tr className="planner-new-row">
      <td><Plus size={15} aria-label="New row" /></td>
      <td>
        {isProc ? (
          <>
            <select
              form={formId}
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={busy}
              aria-label="Row type"
            >
              <option value="LABOUR">{cols.a}</option>
              <option value="MATERIAL">{cols.b}</option>
            </select>
            {type === 'LABOUR' && nameInput(cols.a)}
          </>
        ) : (
          <>
            <select
              form={formId}
              value={selectedPhase}
              onChange={(e) => setPhaseId(e.target.value)}
              disabled={busy}
              aria-label="Phase"
            >
              {!phases.length && <option value="">Choose a phase</option>}
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>{phase.title}</option>
              ))}
              <option value={NEW_PHASE}>+ New phase…</option>
            </select>
            {selectedPhase === NEW_PHASE && (
              <Input
                form={formId}
                aria-label="New phase"
                placeholder="New phase name"
                required
                value={newPhase}
                disabled={busy}
                onChange={(e) => setNewPhase(e.target.value)}
              />
            )}
          </>
        )}
      </td>
      <td>{(!isProc || type === 'MATERIAL') && nameInput(cols.b)}</td>
      <td>
        <Input form={formId} aria-label={cols.c} placeholder={cols.c} value={details} disabled={busy} onChange={(e) => setDetails(e.target.value)} />
      </td>
      <td>
        <Input form={formId} type="date" aria-label="Start date" value={start} disabled={busy} onChange={(e) => setStart(e.target.value)} />
      </td>
      <td>
        <Input form={formId} type="date" aria-label="End date" min={start || undefined} value={date} disabled={busy} onChange={(e) => setDate(e.target.value)} />
      </td>
      <td />
      <td>
        <Input form={formId} aria-label="Remarks" placeholder="Remarks" value={remarks} disabled={busy} onChange={(e) => setRemarks(e.target.value)} />
      </td>
      <td>
        <form id={formId} onSubmit={handleCreate}>
          <Button type="submit" size="sm" variant="soft" icon={Plus} disabled={busy || !name.trim()}>
            {busy ? 'Adding…' : 'Add row'}
          </Button>
        </form>
      </td>
    </tr>
  );
}
