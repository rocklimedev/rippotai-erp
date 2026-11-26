import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
import { Fragment, useState, useEffect, useMemo } from 'react';
import DeleteChecklist from './DeleteChecklist';
import {
  PrintBlankChecklist,
  PrintChecklistButton,
  PrintTemplateButton,
} from '@/components/site-ops/ChecklistPrint';
import { ArrowLeft, ClipboardCheck, Download, Plus, Save } from 'lucide-react';
import { Button, Card, EmptyState, Field, Page, PageHeader, SelectInput, StatusPill, TextArea, TextInput } from '@/components/inos';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGetProjectsQuery } from '../../api/projects/project.api';
import {
  useGetProjectQualityChecksQuery,
  useUpsertQualityCheckMutation,
  useGetQualityChecklistTemplatesQuery,
  useGetQualityChecklistTemplateQuery,
  useCreateQualityChecklistFromTemplateMutation,
  useCreateQualityChecklistMutation,
  useGetQualityChecklistsByProjectQuery,
  useGetQualityChecklistByIdQuery,
  useUpdateQualityChecklistItemMutation,
  useAddQualityChecklistItemMutation,
  useCompleteQualityChecklistMutation,
  useLazyExportQualityChecklistJsonQuery,
  useLazyExportProjectQualityWorkbookJsonQuery,
} from '../../api/site-ops/site-ops.api';

const PHASES = [
  ['BEFORE_EXECUTION', 'Before Execution'],
  ['DURING_EXECUTION', 'During Execution'],
  ['AFTER_EXECUTION', 'After Execution'],
];
const STATUSES = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  DEFERRED: 'Deferred',
};
const OVERVIEW_STATUSES = ['Pending', 'Passed', 'Failed', 'N/A'];

const message = (error) => String(error?.data?.message || error?.error || 'Request failed');
const array = (response) =>
  Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : response?.data?.data || [];

/** Map API status (PASSED, Failed, etc.) to the option labels used in the UI */
function normalizeOverviewStatus(status) {
  if (status == null || status === '') return 'Pending';
  const key = String(status).trim().toUpperCase().replace(/\s+/g, ' ');
  if (key === 'N/A' || key === 'NA' || key === 'NOT APPLICABLE') return 'N/A';
  if (key === 'PASSED' || key === 'PASS') return 'Passed';
  if (key === 'FAILED' || key === 'FAIL') return 'Failed';
  if (key === 'PENDING') return 'Pending';
  if (OVERVIEW_STATUSES.includes(status)) return status;
  return 'Pending';
}

function dateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function QualityChecksPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const projectId = params.get('projectId') || '';
  const checklistId = params.get('checklistId') || '';
  const recordInfo = useRecordInfo('checklist', checklistId);
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useGetProjectsQuery({ includeArchived: false });
  const projects = array(response);
  const project = projects.find((project) => project.id === projectId);
  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: 'Site Operations' },
          { label: 'Checklists', to: '/site-operations/checklists' },
          { label: 'Workspace' },
        ]}
        icon={<ClipboardCheck size={22} />}
        title="Quality checklist workspace"
        info={checklistId ? recordInfo : undefined}
        actions={
          <Button icon={ArrowLeft} onClick={() => navigate('/site-operations/checklists')}>
            Checklists list
          </Button>
        }
      />
      <Card title="Project details">
        <div className="inos-form-grid">
          <Field label="Project" htmlFor="quality-project">
            <SelectInput
              id="quality-project"
              className="w-full"
              value={projectId}
              disabled={isLoading}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                next.delete('checklistId');
                if (event.target.value) next.set('projectId', event.target.value);
                else next.delete('projectId');
                setParams(next);
              }}
            >
              <option value="">{isLoading ? 'Loading projects…' : 'Select a project'}</option>
              {projectId && !project && <option value={projectId}>{projectId}</option>}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.project_name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        {error && <Button className="mt-3" onClick={refetch}>Retry loading projects</Button>}
      </Card>
      {checklistId && <RecordContext type="checklist" id={checklistId} />}
      {projectId ? (
        <QualityProject
          key={projectId}
          projectId={projectId}
          projectName={project?.name || projectId}
          initialId={params.get('checklistId')}
        />
      ) : (
        <Card>
          <EmptyState icon={ClipboardCheck} title="Select a project" text="Choose a project to create and inspect its quality checklists." />
        </Card>
      )}
      {checklistId && <VersionHistory type="checklist" id={checklistId} />}
    </Page>
  );
}

function QualityProject({ projectId, projectName, initialId }) {
  const [activeId, setActiveId] = useState(initialId || '');
  useEffect(() => {
    setActiveId(initialId || '');
  }, [initialId]);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const {
    currentData: overview = [],
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refreshOverview,
  } = useGetProjectQualityChecksQuery({ project_id: projectId });
  const { data: templates = [], error: templateError } = useGetQualityChecklistTemplatesQuery();
  const {
    currentData: list,
    isFetching,
    error,
    refetch,
  } = useGetQualityChecklistsByProjectQuery({ projectId, page, limit: 12 });
  const [exportJson, { isFetching: exporting }] = useLazyExportProjectQualityWorkbookJsonQuery();
  return (
    <>
      <Card title={projectName}>
        <div className="flex flex-wrap gap-2">
          <PrintBlankChecklist templates={templates} />
          <Button
            icon={Download}
            disabled={exporting}
            onClick={async () => {
              try {
                const data = await exportJson(projectId, false).unwrap();
                const { downloadQualityWorkbook } = await import('./qualityChecklistExcel');
                await downloadQualityWorkbook(data, `Quality checks - ${projectName}`);
              } catch (error) {
                toast.error(message(error));
              }
            }}
          >
            {exporting ? 'Preparing Excel…' : 'Download project Excel'}
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>
            New checklist
          </Button>
        </div>
      </Card>
      {showCreate && (
        <CreateChecklist
          projectId={projectId}
          templates={templates}
          templateError={templateError}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setActiveId(id);
            setShowCreate(false);
          }}
        />
      )}
      {activeId ? (
        <ChecklistDetail
          key={activeId}
          id={activeId}
          projectId={projectId}
          projectName={projectName}
          onBack={() => setActiveId('')}
        />
      ) : (
        <>
          <OverviewTable
            overview={overview}
            overviewLoading={overviewLoading}
            overviewError={overviewError}
            refreshOverview={refreshOverview}
            projectId={projectId}
          />
          <Card title="Project checklists" flush>
            {error ? (
              <Button className="m-4" onClick={refetch}>
                Could not load checklists. Retry
              </Button>
            ) : isFetching ? (
              <p className="p-4" role="status">Loading checklists…</p>
            ) : !list?.data?.length ? (
              <EmptyState icon={ClipboardCheck} title="No checklists yet" text="Create a checklist to start inspecting this project." />
            ) : (
              <div className="inos-table-wrap">
                <table className="inos-table">
                  <thead>
                    <tr>
                      <th>Checklist</th>
                      <th>Status</th>
                      <th>Checkpoints</th>
                      <th>Inspected</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.map((checklist) => (
                      <tr key={checklist.id}>
                        <td>
                          <span className="font-semibold">{checklist.checklist_name}</span>
                          {checklist.description && (
                            <p className="mt-1 whitespace-normal text-[var(--text-2)]">{checklist.description}</p>
                          )}
                        </td>
                        <td><StatusPill status={checklist.status} /></td>
                        <td>{checklist.checklist_items?.length || 0}</td>
                        <td>{Number(checklist.completion_percentage)}%</td>
                        <td>
                          <Button
                            size="sm"
                            aria-label={`Open ${checklist.checklist_name}`}
                            onClick={() => setActiveId(checklist.id)}
                          >
                            Open
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {list?.totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--line)] p-4">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {list.totalPages}
                </span>
                <Button
                  disabled={page >= list.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}

function OverviewTable({ overview, overviewLoading, overviewError, refreshOverview, projectId }) {
  const heads = useMemo(
    () =>
      overview
        .filter((head) => head.work_head)
        .sort((a, b) => a.template_serial_number - b.template_serial_number),
    [overview],
  );

  const [drafts, setDrafts] = useState({});
  const [save, { isLoading }] = useUpsertQualityCheckMutation();

  useEffect(() => {
    const next = {};
    for (const head of heads) {
      next[head.item_id] = {
        status: normalizeOverviewStatus(head.status),
        remarks: head.remarks ?? '',
      };
    }
    setDrafts(next);
  }, [heads]);

  const dirtyIds = useMemo(() => {
    return heads
      .filter((head) => {
        const d = drafts[head.item_id];
        if (!d) return false;
        const serverStatus = normalizeOverviewStatus(head.status);
        const serverRemarks = head.remarks ?? '';
        return d.status !== serverStatus || d.remarks !== serverRemarks;
      })
      .map((head) => head.item_id);
  }, [heads, drafts]);

  const updateDraft = (itemId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const saveAll = async () => {
    if (!dirtyIds.length) return;
    try {
      await Promise.all(
        dirtyIds.map((itemId) =>
          save({
            project_id: projectId,
            item_id: itemId,
            status: drafts[itemId].status,
            remarks: drafts[itemId].remarks,
          }).unwrap(),
        ),
      );
      toast.success(
        dirtyIds.length === 1
          ? 'Work-head result saved'
          : `${dirtyIds.length} work-head results saved`,
      );
      await refreshOverview();
    } catch (error) {
      toast.error(message(error));
    }
  };

  return (
    <Card title="Work-head overview" subtitle="Record each work head’s overall status and remarks." flush>
      {overviewLoading ? (
        <p className="p-4">Loading work heads…</p>
      ) : overviewError ? (
        <Button className="m-4" onClick={refreshOverview}>
          Could not load work heads. Retry
        </Button>
      ) : (
        <>
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>S. no.</th>
                  <th>Heads</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {heads.map((head) => {
                  const draft = drafts[head.item_id] || {
                    status: normalizeOverviewStatus(head.status),
                    remarks: head.remarks ?? '',
                  };
                  return (
                    <tr key={head.item_id}>
                      <td>{head.template_serial_number}</td>
                      <td className="font-medium">{head.name}</td>
                      <td>
                        <SelectInput
                          aria-label={`Status for ${head.name}`}
                          value={draft.status}
                          onChange={(event) =>
                            updateDraft(head.item_id, 'status', event.target.value)
                          }
                        >
                          {OVERVIEW_STATUSES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </SelectInput>
                      </td>
                      <td>
                        <TextArea
                          aria-label={`Remarks for ${head.name}`}
                          className="w-full min-w-48"
                          rows={2}
                          value={draft.remarks}
                          onChange={(event) =>
                            updateDraft(head.item_id, 'remarks', event.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!heads.length && (
              <p className="p-4 text-[var(--text-2)]">
                Template work heads are not available. Apply the quality template migration.
              </p>
            )}
          </div>
          {heads.length > 0 && (
            <div className="flex justify-end border-t border-[var(--line)] p-4">
              <Button
                variant="primary"
                icon={Save}
                disabled={isLoading || dirtyIds.length === 0}
                onClick={saveAll}
              >
                {isLoading
                  ? 'Saving…'
                  : dirtyIds.length
                    ? `Save all (${dirtyIds.length})`
                    : 'Save all'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function CreateChecklist({ projectId, templates, templateError, onClose, onCreated }) {
  const [workHead, setWorkHead] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [createTemplate, templateState] = useCreateQualityChecklistFromTemplateMutation();
  const [createCustom, customState] = useCreateQualityChecklistMutation();
  const selected = templates.find((template) => template.work_head === workHead);
  const { currentData: preview, isFetching } = useGetQualityChecklistTemplateQuery(workHead, {
    skip: !selected?.has_template,
  });
  const busy = templateState.isLoading || customState.isLoading;
  return (
    <Card
      title="Create project checklist"
      actions={<Button disabled={busy} onClick={onClose}>Cancel</Button>}
    >
      {templateError && (
        <p role="alert" className="text-red-600">
          Could not load templates. Check that the template migration has been applied.
        </p>
      )}
      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const body = { project_id: projectId, description };
            const checklist = selected?.has_template
              ? await createTemplate({ ...body, work_head: workHead }).unwrap()
              : await createCustom({
                  ...body,
                  ...(workHead ? { work_head: workHead } : {}),
                  checklist_name: name.trim() || selected?.label,
                }).unwrap();
            toast.success('Checklist created');
            onCreated(checklist.id);
          } catch (error) {
            toast.error(message(error));
          }
        }}
      >
        <Field label="Work head" htmlFor="quality-work-head">
          <SelectInput
            id="quality-work-head"
            value={workHead}
            onChange={(event) => setWorkHead(event.target.value)}
            disabled={busy}
          >
            <option value="">Custom checklist</option>
            {templates.map((template) => (
              <option key={template.work_head} value={template.work_head}>
                {template.label} ({template.checkpoint_count} checkpoints)
              </option>
            ))}
          </SelectInput>
        </Field>
        {!selected?.has_template && (
          <>
            <p className="text-sm text-[var(--text-2)]">
              {selected
                ? 'The supplied workbook has no detailed sheet for this head. Add your own checkpoints after creating it.'
                : 'Add project-specific checkpoints after creating this checklist.'}
            </p>
            <Field label="Checklist name" htmlFor="quality-checklist-name">
              <TextInput
                id="quality-checklist-name"
                maxLength={255}
                value={name}
                placeholder={selected?.label || 'Checklist name'}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
          </>
        )}
        <Field label="Description / location" htmlFor="quality-checklist-description">
          <TextArea
            id="quality-checklist-description"
            rows={2}
            maxLength={2000}
            value={description}
            placeholder="e.g. First-floor bathroom"
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        {isFetching && <p>Loading template preview…</p>}
        {preview && (
          <details>
            <summary className="cursor-pointer text-sm">
              Preview {preview.checkpoint_count} checkpoints
            </summary>
            <ol className="mt-2 space-y-1 text-sm max-h-64 overflow-auto">
              {preview.checkpoints.map((item) => (
                <li key={`${item.phase}:${item.serial_number}`}>
                  {item.serial_number}. {item.checkpoint_name}
                </li>
              ))}
            </ol>
          </details>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
          {selected?.has_template && <PrintTemplateButton workHead={workHead} />}
          <Button type="submit" variant="primary" icon={Plus} disabled={busy || (!selected && !name.trim())}>
            {busy
              ? 'Creating…'
              : selected?.has_template
                ? 'Create from template'
                : 'Create checklist'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ChecklistDetail({ id, projectId, projectName, onBack }) {
  const { currentData: checklist, isLoading, error, refetch } = useGetQualityChecklistByIdQuery(id);
  const [complete, completeState] = useCompleteQualityChecklistMutation();
  const [exportJson, exportState] = useLazyExportQualityChecklistJsonQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [updateItem, updateState] = useUpdateQualityChecklistItemMutation();

  const items = checklist?.checklist_items || [];

  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (!checklist) return;
    const next = {};
    for (const item of checklist.checklist_items || []) {
      const initialAcceptance =
        item.is_accepted === true ? 'yes' : item.is_accepted === false ? 'no' : '';
      next[item.id] = {
        accepted: initialAcceptance,
        status: item.status,
        remarks: item.remarks || '',
        date: dateInput(item.inspection_date),
      };
    }
    setDrafts(next);
  }, [checklist]);

  const dirtyIds = useMemo(() => {
    return items
      .filter((item) => {
        const d = drafts[item.id];
        if (!d) return false;
        const initialAcceptance =
          item.is_accepted === true ? 'yes' : item.is_accepted === false ? 'no' : '';
        return (
          d.accepted !== initialAcceptance ||
          d.status !== item.status ||
          d.remarks !== (item.remarks || '') ||
          d.date !== dateInput(item.inspection_date)
        );
      })
      .map((item) => item.id);
  }, [items, drafts]);

  const updateDraft = (itemId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  };

  const saveAll = async () => {
    if (!dirtyIds.length) return;
    try {
      await Promise.all(
        dirtyIds.map((itemId) => {
          const d = drafts[itemId];
          return updateItem({
            id: itemId,
            status: d.status,
            is_accepted: d.accepted === 'yes' ? true : d.accepted === 'no' ? false : null,
            remarks: d.remarks,
            inspection_date: d.date ? new Date(`${d.date}T00:00:00`).toISOString() : null,
          }).unwrap();
        }),
      );
      toast.success(
        dirtyIds.length === 1 ? 'Checkpoint saved' : `${dirtyIds.length} checkpoints saved`,
      );
      await refetch();
    } catch (error) {
      toast.error(message(error));
    }
  };

  if (isLoading) return <Card><p role="status">Loading checklist…</p></Card>;
  if (error || !checklist)
    return (
      <Card title="Could not load checklist">
        <div className="flex flex-wrap gap-2">
          <Button icon={ArrowLeft} onClick={onBack}>Project checklists</Button>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </Card>
    );
  if (checklist.project_id !== projectId)
    return (
      <Card>
        <p role="alert">This checklist belongs to a different project.</p>
        <Button className="mt-3" icon={ArrowLeft} onClick={onBack}>Back to project</Button>
      </Card>
    );

  const accepted = items.filter((item) => item.is_accepted === true).length;
  return (
    <>
      <Card title={checklist.checklist_name} subtitle={checklist.description}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusPill status={checklist.status} />
          <p className="text-sm text-[var(--text-2)]">
            {items.length} checkpoints · {accepted} accepted · {Number(checklist.completion_percentage)}% inspected
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={ArrowLeft} onClick={onBack}>Project checklists</Button>
          <PrintChecklistButton checklist={checklist} projectName={projectName} />
          <Button icon={Plus} aria-expanded={showAdd} onClick={() => setShowAdd(!showAdd)}>
            Add checkpoint
          </Button>
          <Button
            icon={Download}
            disabled={exportState.isFetching}
            onClick={async () => {
              try {
                const data = await exportJson(id, false).unwrap();
                const { downloadQualityWorkbook } = await import('./qualityChecklistExcel');
                await downloadQualityWorkbook(data, checklist.checklist_name);
              } catch (error) {
                toast.error(message(error));
              }
            }}
          >
            {exportState.isFetching ? 'Preparing Excel…' : 'Download Excel'}
          </Button>
          <Button
            variant="primary"
            disabled={
              !items.length ||
              accepted !== items.length ||
              completeState.isLoading ||
              checklist.status === 'PASSED'
            }
            onClick={async () => {
              try {
                await complete(id).unwrap();
                toast.success('Checklist passed');
              } catch (error) {
                toast.error(message(error));
              }
            }}
          >
            Mark passed
          </Button>
          <DeleteChecklist checklist={checklist} onDeleted={onBack} />
        </div>
      </Card>
      {showAdd && (
        <AddCheckpoint
          checklistId={id}
          nextSerial={Math.max(0, ...items.map((item) => item.serial_number)) + 1}
          onClose={() => setShowAdd(false)}
        />
      )}
      <Card title="Checkpoints" flush>
        <div className="inos-table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th className="min-w-80">Checkpoint</th>
                <th>Accepted (yes/no)</th>
                <th>Status</th>
                <th>Remarks / Observation</th>
                <th>Inspection date</th>
              </tr>
            </thead>
            <tbody>
              {PHASES.map(([phase, label]) => (
                <Fragment key={phase}>
                  <tr className="bg-[var(--surface-2)]">
                    <th colSpan={6} className="text-left">
                      {label}
                    </th>
                  </tr>
                  {items
                    .filter((item) => item.phase === phase)
                    .sort((a, b) => a.serial_number - b.serial_number)
                    .map((item) => {
                      const draft = drafts[item.id] || {
                        accepted:
                          item.is_accepted === true
                            ? 'yes'
                            : item.is_accepted === false
                              ? 'no'
                              : '',
                        status: item.status,
                        remarks: item.remarks || '',
                        date: dateInput(item.inspection_date),
                      };
                      return (
                        <tr key={item.id}>
                          <td>{item.serial_number}</td>
                          <td>{item.checkpoint_name}</td>
                          <td>
                            <SelectInput
                              aria-label={`Acceptance for checkpoint ${item.serial_number}`}
                              value={draft.accepted}
                              onChange={(event) => {
                                const next = event.target.value;
                                updateDraft(item.id, {
                                  accepted: next,
                                  status:
                                    next === 'yes'
                                      ? 'ACCEPTED'
                                      : next === 'no'
                                        ? 'REJECTED'
                                        : 'NOT_STARTED',
                                });
                              }}
                            >
                              <option value="">Pending</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </SelectInput>
                          </td>
                          <td>
                            <SelectInput
                              aria-label={`Status for checkpoint ${item.serial_number}`}
                              value={draft.status}
                              onChange={(event) => {
                                const next = event.target.value;
                                const patch = { status: next };
                                if (next !== 'COMPLETED') {
                                  patch.accepted =
                                    next === 'ACCEPTED' ? 'yes' : next === 'REJECTED' ? 'no' : '';
                                }
                                updateDraft(item.id, patch);
                              }}
                            >
                              {Object.entries(STATUSES).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </SelectInput>
                          </td>
                          <td>
                            <TextArea
                              className="w-full min-w-52"
                              aria-label={`Remarks for checkpoint ${item.serial_number}`}
                              rows={2}
                              maxLength={2000}
                              value={draft.remarks}
                              onChange={(event) =>
                                updateDraft(item.id, {
                                  remarks: event.target.value,
                                })
                              }
                            />
                          </td>
                          <td>
                            <TextInput
                              aria-label={`Inspection date for checkpoint ${item.serial_number}`}
                              type="date"
                              value={draft.date}
                              onChange={(event) =>
                                updateDraft(item.id, {
                                  date: event.target.value,
                                })
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  {!items.some((item) => item.phase === phase) && (
                    <tr>
                      <td colSpan={6} className="text-sm text-[var(--text-2)]">
                        No checkpoints in this phase.
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 0 && (
          <div className="flex justify-end border-t border-[var(--line)] p-4">
            <Button
              variant="primary"
              icon={Save}
              disabled={updateState.isLoading || dirtyIds.length === 0}
              onClick={saveAll}
            >
              {updateState.isLoading
                ? 'Saving…'
                : dirtyIds.length
                  ? `Save all (${dirtyIds.length})`
                  : 'Save all'}
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}

function AddCheckpoint({ checklistId, nextSerial, onClose }) {
  const [name, setName] = useState('');
  const [phase, setPhase] = useState('BEFORE_EXECUTION');
  const [add, { isLoading }] = useAddQualityChecklistItemMutation();
  return (
    <Card title="Add checkpoint">
      <form
        className="inos-form-grid"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await add({
              checklistId,
              serial_number: nextSerial,
              checkpoint_name: name.trim(),
              phase,
            }).unwrap();
            onClose();
            toast.success('Checkpoint added');
          } catch (error) {
            toast.error(message(error));
          }
        }}
      >
        <Field label="Checkpoint" htmlFor="quality-new-checkpoint">
          <TextInput
            id="quality-new-checkpoint"
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Phase" htmlFor="quality-new-phase">
          <SelectInput
            id="quality-new-phase"
            value={phase}
            onChange={(event) => setPhase(event.target.value)}
          >
            {PHASES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="span-full flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon={Plus} disabled={isLoading || !name.trim()}>
            {isLoading ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
