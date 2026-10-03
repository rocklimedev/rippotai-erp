import { useState } from 'react';
import {
  useGetProjectShortlistsQuery, useGetShortlistPackagesQuery,
  useCreateShortlistPackageMutation, usePreviewShortlistPackageMutation,
  useApplyShortlistPackageMutation, useDeleteShortlistPackageMutation,
} from '../../api/vendors/vendor-shortlist.api';

export default function ShortlistPackages({ projectId, readOnly }) {
  const { data: shortlists = [] } = useGetProjectShortlistsQuery({ project_id: projectId });
  const { data: packages = [], isLoading, error: loadError } = useGetShortlistPackagesQuery();
  const [create, createState] = useCreateShortlistPackageMutation();
  const [preview, previewState] = usePreviewShortlistPackageMutation();
  const [apply, applyState] = useApplyShortlistPackageMutation();
  const [remove, removeState] = useDeleteShortlistPackageMutation();
  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selected = packages.find(pkg => pkg.id === packageId);
  const busy = createState.isLoading || previewState.isLoading || applyState.isLoading || removeState.isLoading;
  const run = async (action) => {
    setError(''); setMessage('');
    try { await action(); } catch (err) { setError(String(err?.data?.message || err?.error || 'Operation failed')); }
  };
  return <section className="bc-card p-4 mb-6 space-y-3">
    <h2 className="font-semibold">Shortlist packages</h2>
    <p className="text-sm text-[var(--muted)]">Save assigned vendors or materials as a reusable template. Matching project work is filled; unmatched and populated rows are skipped.</p>
    {isLoading && <p>Loading packages…</p>}
    {loadError && <p role="alert">Could not load shortlist packages.</p>}
    {!readOnly && <>
      <form className="flex flex-wrap gap-2" onSubmit={event => {
        event.preventDefault(); run(async () => {
          await create({ name: name.trim(), source_shortlist_id: sourceId }).unwrap();
          setName(''); setMessage('Package saved.');
        });
      }}>
        <input aria-label="Package name" className="bc-input" placeholder="Package name" maxLength={255} value={name} onChange={event => setName(event.target.value)} />
        <select aria-label="Source shortlist" className="bc-input" value={sourceId} onChange={event => setSourceId(event.target.value)}>
          <option value="">Save from shortlist…</option>
          {shortlists.map(sl => <option key={sl.id} value={sl.id}>{sl.title || sl.shortlist_type}</option>)}
        </select>
        <button className="bc-btn" disabled={busy || !name.trim() || !sourceId}>Save package</button>
      </form>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Shortlist package" className="bc-input" disabled={busy} value={packageId} onChange={event => { setPackageId(event.target.value); setTargetId(''); setPlan(null); }}>
          <option value="">Choose package…</option>
          {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.shortlist_type}, {pkg.entries.length} entries)</option>)}
        </select>
        <select aria-label="Target shortlist" className="bc-input" disabled={busy} value={targetId} onChange={event => { setTargetId(event.target.value); setPlan(null); }}>
          <option value="">Apply to shortlist…</option>
          {shortlists.filter(sl => sl.shortlist_type === selected?.shortlist_type && !sl.is_locked).map(sl => <option key={sl.id} value={sl.id}>{sl.title || sl.shortlist_type}</option>)}
        </select>
        <button className="bc-btn" disabled={busy || !packageId || !targetId} onClick={() => run(async () => {
          setPlan(null);
          setPlan(await preview({ id: packageId, target_shortlist_id: targetId }).unwrap());
        })}>Preview matches</button>
        <button className="bc-btn" disabled={busy || !plan?.applicable?.length} onClick={() => run(async () => {
          const result = await apply({ id: packageId, target_shortlist_id: targetId }).unwrap();
          setPlan({ applicable: [], skipped: result.skipped });
          setMessage(`Applied ${result.applied} entries; skipped ${result.skipped.length}.`);
        })}>Apply package</button>
        <button className="bc-btn" disabled={busy || !packageId} onClick={() => {
          if (window.confirm(`Delete package "${selected?.name}"?`)) run(async () => {
            await remove(packageId).unwrap(); setPackageId(''); setPlan(null); setMessage('Package deleted.');
          });
        }}>Delete package</button>
      </div>
    </>}
    {plan && <div className="text-sm space-y-1">
      <p>{plan.applicable.length} matching entries ready to apply.</p>
      {plan.applicable.map(entry => <p key={`${entry.trade}-${entry.working_type}`}>{entry.trade} / {entry.working_type}: {entry.name_of_vendor || 'Assigned'}</p>)}
      {plan.skipped.map(entry => <p key={`${entry.trade}-${entry.working_type}`} className="text-[var(--muted)]">{entry.trade} / {entry.working_type}: {entry.reason}</p>)}
    </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </section>;
}
