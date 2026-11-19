import { useState } from 'react';
import { toast } from 'sonner';
import { Layers3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/use-permission';
import { useGetVisitStagesQuery, useUpdateVisitStageMutation } from '@/api/site-ops/site-ops.api';
import { Page, PageHeader, Card, Button, Toolbar, SearchInput, Segmented, Pill } from '@/components/inos';
import { AdminAccessDenied, SkeletonRows, TableEmpty, adminCrumbs } from './_admin-ui';
import VisitStageActions from '@/pages/site-ops/VisitStageActions';

export default function VisitStageSettings() {
  const { user } = useAuth();
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user?.role);
  const canUpdate = usePermission('architect-visit-stages', 'update');
  const { data, isLoading, isFetching, isError, refetch } = useGetVisitStagesQuery({ includeInactive: true }, { skip: !isAdmin });
  const [update, { isLoading: restoring }] = useUpdateVisitStageMutation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const stages = Array.isArray(data) ? data : data?.data || [];
  const query = search.trim().toLowerCase();
  const rows = stages.filter((stage) =>
    (status === 'all' || Boolean(stage.is_active) === (status === 'active')) &&
    [stage.visit_no, stage.stage, stage.checks_purpose, stage.visit_type, stage.remarks].some((value) => String(value || '').toLowerCase().includes(query)),
  ).sort((a, b) => a.visit_no - b.visit_no);
  const restore = async (stage) => {
    try {
      await update({ id: stage.id, is_active: true }).unwrap();
      toast.success('Visit stage restored');
    } catch (error) { toast.error(error?.data?.message || 'Unable to restore visit stage'); }
  };
  if (!isAdmin) return <AdminAccessDenied crumb="Site visit stages" />;
  return <Page>
    <PageHeader crumbs={adminCrumbs('Site visit stages')} title="Site Visit Stages"
      subtitle="Manage the architect stages and checks available when allocating site visits. Changes apply across projects; existing visit records are preserved."
      actions={<VisitStageActions showRowActions={false} disabled={isError || isLoading} />} />
    <Toolbar>
      <SearchInput value={search} onChange={setSearch} placeholder="Search stages, checks or visit types" />
      <Segmented value={status} onChange={setStatus} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Deleted' }, { value: 'all', label: 'All' }]} />
    </Toolbar>
    {isError ? <Card><p role="alert">Unable to load site visit stages.</p><Button onClick={refetch}>Retry</Button></Card> : <Card flush>
      <div className="inos-table-wrap"><table className="inos-table">
        <thead><tr><th>No.</th><th>Stage</th><th>Main checks / Purpose</th><th>Visit type</th><th>Remarks</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{isLoading ? <SkeletonRows cols={7} /> : !rows.length ? <TableEmpty cols={7} icon={Layers3} title="No site visit stages found" text="Add a stage or change your search and status filter." /> : rows.map((stage) => <tr key={stage.id}>
          <td className="tabular">{stage.visit_no}</td>
          <td style={{ minWidth: 180, fontWeight: 600 }}>{stage.stage}</td>
          <td style={{ minWidth: 240, whiteSpace: 'normal' }}>{stage.checks_purpose}</td>
          <td>{stage.visit_type}</td><td style={{ whiteSpace: 'normal' }}>{stage.remarks || '—'}</td>
          <td><Pill tone={stage.is_active ? 'ok' : 'bad'}>{stage.is_active ? 'Active' : 'Deleted'}</Pill></td>
          <td>{stage.is_active ? <VisitStageActions selected={stage} showAdd={false} disabled={isFetching || restoring} /> : canUpdate && <Button size="sm" disabled={restoring || isFetching} onClick={() => restore(stage)}>Restore stage</Button>}</td>
        </tr>)}</tbody>
      </table></div>
      <div className="adm-table-foot">{rows.length} stage{rows.length === 1 ? '' : 's'} shown</div>
    </Card>}
  </Page>;
}
