import { useState } from 'react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import { useGetVisitStagesQuery, useCreateVisitStageMutation, useUpdateVisitStageMutation, useDeleteVisitStageMutation } from '@/api/site-ops/site-ops.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const visitTypes = ['Mandatory', 'Hold Point', 'As Required', 'Mandatory (Critical)'];
const errorMessage = (error) => Array.isArray(error?.data?.message)
  ? error.data.message.join(', ') : error?.data?.message || 'Unable to save visit stage';

export default function VisitStageActions({ selected, onSelect = () => {}, disabled, showAdd = true, showRowActions = true }) {
  const canCreate = usePermission('architect-visit-stages', 'create');
  const canUpdate = usePermission('architect-visit-stages', 'update');
  const canDelete = usePermission('architect-visit-stages', 'delete');
  const { data, isFetching } = useGetVisitStagesQuery({ includeInactive: true });
  const [create, { isLoading: creating }] = useCreateVisitStageMutation();
  const [update, { isLoading: updating }] = useUpdateVisitStageMutation();
  const [remove, { isLoading: deleting }] = useDeleteVisitStageMutation();
  const [mode, setMode] = useState(null);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({});
  const busy = creating || updating || deleting;
  const change = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const start = (nextMode) => {
    setTarget(selected);
    const stages = Array.isArray(data) ? data : data?.data || [];
    setForm(nextMode === 'add' ? {
      visit_no: Math.max(0, ...stages.map((stage) => stage.visit_no)) + 1,
      stage: '', checks_purpose: '', visit_type: 'Mandatory', remarks: '',
    } : {
      visit_no: selected.visit_no, stage: selected.stage,
      checks_purpose: selected.checks_purpose, visit_type: selected.visit_type,
      remarks: selected.remarks || '',
    });
    setMode(nextMode);
  };
  const save = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const body = { ...form, visit_no: Number(form.visit_no), stage: form.stage.trim(), checks_purpose: form.checks_purpose.trim(), remarks: form.remarks.trim() };
    if (!body.stage || !body.checks_purpose) return toast.error('Stage and main checks are required');
    try {
      const result = await (mode === 'add' ? create(body) : update({ id: target.id, ...body })).unwrap();
      if (mode === 'add') onSelect((result?.data || result).id);
      toast.success(mode === 'add' ? 'Visit stage added' : 'Visit stage updated');
      setMode(null);
    } catch (error) { toast.error(errorMessage(error)); }
  };
  const deleteStage = async () => {
    try {
      await remove(target.id).unwrap();
      onSelect('');
      setMode(null);
      toast.success('Visit stage deleted');
    } catch (error) { toast.error(errorMessage(error)); }
  };
  return <>
    <div className="mt-2 flex flex-wrap gap-2">
      {showAdd && canCreate && <Button type="button" size="sm" variant="outline" disabled={disabled || isFetching} onClick={() => start('add')}>Add stage</Button>}
      {showRowActions && canUpdate && <Button type="button" size="sm" variant="outline" disabled={disabled || !selected} onClick={() => start('edit')}>Edit stage</Button>}
      {showRowActions && canDelete && <Button type="button" size="sm" variant="destructive" disabled={disabled || !selected} onClick={() => start('delete')}>Delete stage</Button>}
    </div>
    <Dialog open={!!mode} onOpenChange={(open) => { if (!open && !busy) setMode(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add visit stage' : mode === 'edit' ? 'Edit visit stage' : 'Delete visit stage'}</DialogTitle>
          <DialogDescription>{mode === 'delete'
            ? 'This stage will be removed from future allocations. Existing visit records are preserved.'
            : 'Stages are shared across projects. Changes apply to future allocations.'}</DialogDescription>
        </DialogHeader>
        {mode === 'delete' ? <div className="space-y-4">
          <p>Delete “{target?.stage}”?</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setMode(null)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={deleteStage}>{busy ? 'Deleting…' : 'Delete stage'}</Button>
          </div>
        </div> : <form className="space-y-4" onSubmit={save}>
          <div><Label htmlFor="visit-stage-number">Visit number</Label><Input id="visit-stage-number" type="number" min="1" step="1" required value={form.visit_no || ''} onChange={(event) => change('visit_no', event.target.value)} /></div>
          <div><Label htmlFor="visit-stage-name">Stage</Label><Input id="visit-stage-name" required maxLength={255} value={form.stage || ''} onChange={(event) => change('stage', event.target.value)} /></div>
          <div><Label htmlFor="visit-stage-checks">Main checks / Purpose</Label><textarea id="visit-stage-checks" className="w-full rounded border p-2" rows={3} required value={form.checks_purpose || ''} onChange={(event) => change('checks_purpose', event.target.value)} /></div>
          <div><Label htmlFor="visit-stage-type">Visit type</Label><select id="visit-stage-type" className="w-full rounded border p-2" value={form.visit_type || 'Mandatory'} onChange={(event) => change('visit_type', event.target.value)}>{visitTypes.map((type) => <option key={type}>{type}</option>)}</select></div>
          <div><Label htmlFor="visit-stage-remarks">Remarks</Label><textarea id="visit-stage-remarks" className="w-full rounded border p-2" value={form.remarks || ''} onChange={(event) => change('remarks', event.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setMode(null)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save stage'}</Button>
          </div>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}
