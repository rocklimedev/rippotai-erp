import ArchitectVisitScheduleList from '@/pages/doc-lists/ArchitectVisitScheduleList';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useSiteProjects,
  useProjectParam,
  ProjectPicker,
  rowProjectName,
  useTradeTeams,
} from './siteProjects';
import {
  useGetVisitAssignmentsQuery,
  useCreateVisitAssignmentMutation,
  useUpdateVisitAssignmentMutation,
  useDeactivateVisitAssignmentMutation,
} from '@/api/procuerment/site-ops.api';
import {
  useDownloadVisitScheduleMutation,
  useGetVisitStagesQuery,
} from '@/api/site-ops/site-ops.api';
import {
  Button, Card, EmptyState, Field, Page, PageHeader, SearchInput, SelectInput,
  StatusPill, TextInput, Toolbar, prettyStatus,
} from '@/components/inos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
const initial = () => ({
  projectId: '',
  visitorType: 'ARCHITECT',
  stageId: '',
  scheduledDate: '',
  teamId: '',
  externalPartyName: '',
  purpose: '',
});
const types = ['ARCHITECT', 'SUPERVISOR', 'VENDOR', 'CONTRACTOR', 'CLIENT', 'OTHER'];
const message = (e) =>
  Array.isArray(e?.data?.message)
    ? e.data.message.join(', ')
    : e?.data?.message || 'Unable to save allocation';
// Without a project the page is the Architect Site Visit Schedule list.
export default function VisitAssignmentsPage() {
  const [params] = useSearchParams();
  if (!params.get('project') && !params.get('new')) return <ArchitectVisitScheduleList />;
  return <VisitAssignmentsEditor />;
}

function VisitAssignmentsEditor() {
  const [projectId, setProjectId] = useProjectParam();
  const [downloadSchedule, { isLoading: exportingSchedule }] = useDownloadVisitScheduleMutation();
  const { projects, nameOf } = useSiteProjects();
  const teams = useTradeTeams();
  const { data, isLoading, error } = useGetVisitAssignmentsQuery({ projectId });
  const { data: stageData, isLoading: loadingStages } = useGetVisitStagesQuery();
  const stages = Array.isArray(stageData) ? stageData : stageData?.data || [];
  const [create, { isLoading: creating }] = useCreateVisitAssignmentMutation();
  const [update, { isLoading: updating }] = useUpdateVisitAssignmentMutation();
  const [deactivate] = useDeactivateVisitAssignmentMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initial);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const assignments = Array.isArray(data) ? data : data?.data || [];
  const rows = assignments.filter(
    (a) =>
      (status === 'all' || Boolean(a.isActive) === (status === 'active')) &&
      [
        rowProjectName(a, nameOf),
        a.stageName,
        a.purpose,
        a.externalPartyName,
        a.team?.name,
        a.visitorType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = stages.find((s) => s.id === form.stageId);
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const start = (a) => {
    setEditing(a || null);
    setForm(
      a
        ? {
            ...initial(),
            ...a,
            teamId: a.teamId ? String(a.teamId) : '',
            externalPartyName: a.externalPartyName || '',
            purpose: a.purpose || '',
          }
        : { ...initial(), projectId: projectId || '' },
    );
    setOpen(true);
  };
  const save = async (e) => {
    e.preventDefault();
    const body = {
      projectId: form.projectId,
      visitorType: form.visitorType,
      scheduledDate: form.scheduledDate,
      stageId: form.visitorType === 'ARCHITECT' ? form.stageId : undefined,
      teamId: form.teamId ? Number(form.teamId) : null,
      externalPartyName: form.externalPartyName.trim() || null,
      purpose: form.visitorType === 'ARCHITECT' ? undefined : form.purpose.trim(),
    };
    try {
      if (editing) await update({ id: editing.id, ...body }).unwrap();
      else await create(body).unwrap();
      setOpen(false);
      toast.success(editing ? 'Visit allocation updated' : 'Visit allocated');
    } catch (e) {
      toast.error(message(e));
    }
  };
  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: 'Site Operations' },
          { label: 'Architect Site Visit Schedule', to: '/site-operations/visit-assignments' },
          { label: 'Visit Assignments' },
        ]}
        icon={<CalendarCheck size={22} />}
        title="Visit Assignments"
        info={projectId ? nameOf(projectId) : undefined}
        actions={
          <>
            <Button icon={Download} disabled={exportingSchedule} onClick={() => downloadSchedule(projectId || undefined)}>
              {exportingSchedule ? 'Preparing Excel…' : 'Visit schedule (Excel)'}
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => start()}>Allocate visit</Button>
          </>
        }
      />
      <Card flush>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search allocations" />
          <ProjectPicker className="max-w-full sm:w-64" projects={projects} value={projectId} onChange={setProjectId} />
          <SelectInput
            className="sm:w-44"
            aria-label="Allocation status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive / legacy</option>
            <option value="all">All</option>
          </SelectInput>
        </Toolbar>
        {error ? (
          <div className="p-4" role="alert">Unable to load allocations. Please try again.</div>
        ) : isLoading ? (
          <p className="p-4" role="status">Loading allocations…</p>
        ) : !rows.length ? (
          <EmptyState icon={CalendarCheck} title="No visit allocations found" />
        ) : (
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  {[
                    'Project',
                    'Visitor',
                    'Date',
                    'Stage / Purpose',
                    'Visit type',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>{rowProjectName(a, nameOf)}</td>
                    <td>
                      {a.externalPartyName || a.team?.name || `Team ${a.teamId || '—'}`}
                      <div className="text-xs text-[var(--text-2)]">{prettyStatus(a.visitorType)}</div>
                    </td>
                    <td>{a.scheduledDate || 'Legacy recurrence'}</td>
                    <td className="max-w-md whitespace-normal">
                      {a.stageName || a.purpose || 'Requires event allocation'}
                      {a.checksPurpose && (
                        <p className="mt-1 text-xs text-[var(--text-2)]">{a.checksPurpose}</p>
                      )}
                    </td>
                    <td>{a.visitType || '—'}</td>
                    <td>
                      <StatusPill status={a.visitLogs?.[0]?.status || (a.isActive ? 'Allocated' : 'Inactive')} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {a.isActive && a.visitLogs?.[0]?.status !== 'COMPLETED' && (
                          <>
                            <Button
                              size="sm"
                              disabled={!!a.visitLogs?.length}
                              onClick={() => start(a)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await deactivate(a.id).unwrap();
                                  toast.success('Allocation cancelled');
                                } catch (e) {
                                  toast.error(message(e));
                                }
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {a.visitLogs?.length ? (
                          <Link
                            className="inos-btn inos-btn--secondary inos-btn--sm"
                            to={`/site-operations/site-visits/${a.visitLogs[0].id}`}
                          >
                            View visit
                          </Link>
                        ) : a.isActive && a.scheduledDate ? (
                          <Link
                            className="inos-btn inos-btn--secondary inos-btn--sm"
                            to={`/site-operations/site-visits/new?assignment=${a.id}`}
                          >
                            Record visit
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit visit allocation' : 'Allocate visit'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Project, visitor type and stage are locked. Logged events cannot be edited.'
                : 'Choose the stage the architect is coming to inspect, then allocate the visitor and date.'}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={save}>
            <Field htmlFor="allocation-project" label="Project" required>
              <SelectInput
                id="allocation-project"
                required
                disabled={!!editing}
                value={form.projectId}
                onChange={(e) => change('projectId', e.target.value)}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {nameOf(p.id)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field htmlFor="allocation-type" label="Visitor type">
              <SelectInput
                id="allocation-type"
                disabled={!!editing}
                value={form.visitorType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    visitorType: e.target.value,
                    stageId: '',
                    purpose: '',
                  }))
                }
              >
                {types.map((t) => (
                  <option key={t} value={t}>{prettyStatus(t)}</option>
                ))}
              </SelectInput>
            </Field>
            {form.visitorType === 'ARCHITECT' ? (
              <Field htmlFor="allocation-stage" label="Visit stage" required>
                <SelectInput
                  id="allocation-stage"
                  required
                  disabled={!!editing || loadingStages}
                  value={form.stageId || ''}
                  onChange={(e) => change('stageId', e.target.value)}
                >
                  <option value="">Select purpose / stage</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.visit_no}. {s.stage}
                    </option>
                  ))}
                </SelectInput>
                <p className="mt-2 text-sm">{editing?.checksPurpose || selected?.checks_purpose}</p>
                <p className="text-sm text-[var(--text-2)]">
                  {editing?.visitType || selected?.visit_type}
                </p>
                {selected?.remarks && (
                  <p className="text-sm text-[var(--text-2)]">{selected.remarks}</p>
                )}
              </Field>
            ) : (
              <Field htmlFor="allocation-purpose" label="Purpose" required>
                <TextInput
                  id="allocation-purpose"
                  required
                  maxLength={250}
                  value={form.purpose}
                  onChange={(e) => change('purpose', e.target.value)}
                />
              </Field>
            )}
            <Field htmlFor="allocation-date" label="Scheduled date" required>
              <TextInput
                id="allocation-date"
                type="date"
                required
                value={form.scheduledDate || ''}
                onChange={(e) => change('scheduledDate', e.target.value)}
              />
            </Field>
            <Field htmlFor="allocation-team" label="Allocated team">
              <SelectInput
                id="allocation-team"
                value={form.teamId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    teamId: e.target.value,
                    externalPartyName: '',
                  }))
                }
              >
                <option value="">Named visitor instead</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {!form.teamId && (
              <Field htmlFor="allocation-visitor" label="Allocated visitor name" required>
                <TextInput
                  id="allocation-visitor"
                  required
                  maxLength={150}
                  value={form.externalPartyName}
                  onChange={(e) => change('externalPartyName', e.target.value)}
                />
              </Field>
            )}
            <Button type="submit" variant="primary" disabled={creating || updating || loadingStages}>
              {creating || updating ? 'Saving…' : 'Save allocation'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
