// Projects › Documents: search + project side by side, then the project's
// stages in one line — Brief | Recce | Pre Design | Planning | Design | Tender |
// Procurement | Working | Execution | Handover — each one clickable.
// Procurement = A (vendors & trades) + B (material). Execution shows its
// sub-phases from the Build planner; anything late in the project planner is
// marked Late on its stage so the cause of a delay is visible.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, CalendarClock, FileText, RefreshCw } from 'lucide-react';
import { Button, Card, EmptyState, Pill, SearchInput } from '@/components/inos';
import { useGetProjectPhasesQuery } from '@/api/projects/command-center.api';
import { useGetProjectPlannerOverviewQuery } from '@/api/documents/project-planner.api';
import { PhaseDetailCard, UploadDocumentModal } from '../../pages/CommandCenter';
import { rowState, viewRows } from './plannerModel';
import './project-documents-board.css';

/** The stage line, in flow order; `codes` are the document phases behind it. */
const STAGES = [
  { key: 'brief', label: 'Brief', codes: ['01_BRIEF'] },
  { key: 'recce', label: 'Recce', codes: ['02_RECCE'] },
  {
    key: 'pre',
    label: 'Pre Design',
    codes: ['03_PRE_DESIGN'],
    design: ['PRE-DESIGN', 'PRE DESIGN'],
  },
  { key: 'planning', label: 'Planning', codes: ['04_PLANNING'] },
  {
    key: 'design',
    label: 'Design',
    codes: ['05_DESIGN'],
    design: ['DESIGN', 'MATERIAL SELECTION'],
  },
  { key: 'tender', label: 'Tender', codes: ['06_TENDER'], design: ['TENDER DRAWINGS'] },
  {
    key: 'procurement',
    label: 'Procurement',
    codes: ['A_VENDOR_TRADES', 'B_MATERIAL'],
    procurement: true,
  },
  { key: 'working', label: 'Working', codes: ['07_WORKING'], design: ['WORKING DRAWINGS'] },
  { key: 'execution', label: 'Execution', codes: ['08_EXECUTION'], build: true },
  { key: 'handover', label: 'Handover', codes: ['09_HANDOVER'] },
];

const PART_TITLE = { A_VENDOR_TRADES: 'A · Vendors & trades', B_MATERIAL: 'B · Material' };

const fmt = (d) =>
  d
    ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })
    : '';
const tidy = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bAnd\b/g, 'and');
const real = (s) => (s && String(s).trim().toUpperCase() !== 'NULL' ? s : '');

/** Build-planner phases as execution sub-phases with their state. */
function subPhases(overview) {
  const rows = viewRows(overview, 'Build');
  const out = [];
  rows.forEach((r) => {
    const id = r.phase_id || r.phase?.id;
    let ph = out.find((p) => p.id === id);
    if (!ph) out.push((ph = { id, title: r.phase?.title || 'Other', rows: [] }));
    ph.rows.push({ ...r, st: rowState(r) });
  });
  return out.map((ph) => {
    const keys = ph.rows.map((r) => r.st.key);
    const dates = ph.rows
      .map((r) => r.st.date)
      .filter(Boolean)
      .sort();
    const state = keys.every((k) => k === 'completed')
      ? 'completed'
      : keys.includes('late')
        ? 'late'
        : keys.some((k) => k === 'completed' || k === 'due')
          ? 'due'
          : 'pending';
    return {
      ...ph,
      state,
      from: dates[0],
      to: dates[dates.length - 1],
      late: ph.rows.filter((r) => r.st.key === 'late'),
    };
  });
}

const STATE_LABEL = {
  completed: 'Completed',
  late: 'Late',
  due: 'In progress',
  pending: 'Pending',
};

export default function ProjectDocumentsBoard({ projects = [], projectId }) {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('');
  const [stageKey, setStageKey] = useState(null);
  const [q, setQ] = useState('');
  const [uploadTarget, setUploadTarget] = useState(null);
  const activeProjectId = projectId || selectedProject || projects[0]?.id;
  const {
    data: project,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetProjectPhasesQuery(activeProjectId, {
    skip: !activeProjectId,
  });
  const { data: plannerRes } = useGetProjectPlannerOverviewQuery(activeProjectId, {
    skip: !activeProjectId,
  });
  const overview = plannerRes?.data || plannerRes;
  const phases = useMemo(() => project?.phases || [], [project]);
  const subs = useMemo(() => subPhases(overview), [overview]);

  const stages = useMemo(() => {
    const design = viewRows(overview, 'Design').map((r) => ({ ...r, st: rowState(r) }));
    const proc = viewRows(overview, 'Procurement').map((r) => ({ ...r, st: rowState(r) }));
    return STAGES.map((s) => {
      const parts = s.codes.map((c) => phases.find((p) => p.code === c)).filter(Boolean);
      const done = parts.reduce((n, p) => n + (p.docsDone || 0), 0);
      const total = parts.reduce((n, p) => n + (p.docsTotal || 0), 0);
      const late = s.procurement
        ? proc.filter((r) => r.st.key === 'late')
        : s.build
          ? subs.flatMap((p) => p.late)
          : s.design
            ? design.filter(
                (r) =>
                  r.st.key === 'late' &&
                  s.design.includes(String(r.phase?.title || '').toUpperCase()),
              )
            : [];
      const complete =
        parts.length > 0 && parts.every((p) => String(p.state).toUpperCase() === 'COMPLETE');
      const current = parts.some((p) => p.phaseNumber === project?.currentPhaseSeq);
      return { ...s, parts, done, total, late, complete, current };
    }).filter((s) => s.parts.length);
  }, [phases, overview, project, subs]);

  const nowSub = subs.find((p) => p.state !== 'completed');
  const stage =
    stages.find((s) => s.key === stageKey) || stages.find((s) => s.current) || stages[0];

  const card = (phase, title, filter) => (
    <PhaseDetailCard
      key={`${project.id}:${phase.id}:${filter ? 'q' : ''}`}
      project={project}
      phase={phase}
      documentsOnly
      filter={filter}
      title={title}
      onOpen={{ navigate, uploadDoc: setUploadTarget }}
      onFlash={toast}
    />
  );

  const plannerView = (key) =>
    key === 'procurement' ? 'Procurement' : key === 'execution' ? 'Build' : 'Design';
  const lateBox = (rows, s) =>
    rows.length > 0 && (
      <div className="pdb-late" role="alert">
        <p className="pdb-late__head">
          <AlertTriangle size={16} aria-hidden /> {rows.length} late in {s.label} — this is delaying
          the project
        </p>
        <ul>
          {rows.map((r) => {
            const main = real(r.work_name) || real(r.category_name) || real(r.details);
            const sub =
              (real(r.work_name) || real(r.category_name)) &&
              (real(r.details) || real(r.vendor_name));
            return (
              <li key={r.id}>
                {s.build && r.phase?.title && (
                  <span className="pdb-late__phase">{tidy(r.phase.title)}</span>
                )}
                <strong>{tidy(main)}</strong>
                {sub ? <span> — {tidy(sub)}</span> : null}
                <span className="pdb-late__date">due {fmt(r.st.date)}</span>
              </li>
            );
          })}
        </ul>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            navigate(
              `/projects/planner/create?projectId=${activeProjectId}&view=${plannerView(s.key)}`,
            )
          }
        >
          Open project planner
        </Button>
      </div>
    );

  return (
    <Card
      title="Project documents"
      subtitle="Create or upload documents for each project stage."
      actions={
        activeProjectId && (
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            disabled={isFetching}
            onClick={refetch}
          >
            Refresh
          </Button>
        )
      }
    >
      <div className="pdb-filters">
        <SearchInput value={q} onChange={setQ} placeholder="Search documents" />
        {!projectId && projects.length > 0 && (
          <select
            className="inos-select pdb-project"
            aria-label="Project"
            value={activeProjectId || ''}
            onChange={(event) => {
              setSelectedProject(event.target.value);
              setStageKey(null);
            }}
          >
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {[item.code, item.name || item.project_name].filter(Boolean).join(' · ')}
              </option>
            ))}
          </select>
        )}
      </div>

      {!activeProjectId && (
        <EmptyState
          icon={FileText}
          title="No projects yet"
          text="Create a project to manage its documents."
        />
      )}
      {isLoading && (
        <p className="cc-muted" role="status">
          Loading project stages…
        </p>
      )}
      {isError && (
        <EmptyState
          icon={FileText}
          title="Documents could not be loaded"
          text="Try refreshing the project documents."
          action={<Button onClick={refetch}>Try again</Button>}
        />
      )}

      {project && !isError && (
        <>
          <nav className="pdb-stages" aria-label="Project stages">
            {stages.map((s, i) => (
              <span key={s.key} className="pdb-stage-wrap">
                {i > 0 && (
                  <span className="pdb-sep" aria-hidden>
                    |
                  </span>
                )}
                <button
                  type="button"
                  className={`pdb-stage ${s.key === stage?.key && !q.trim() ? 'is-active' : ''} ${s.complete ? 'is-done' : ''} ${s.late.length ? 'is-late' : ''} ${s.current ? 'is-current' : ''}`}
                  aria-pressed={s.key === stage?.key}
                  onClick={() => {
                    setStageKey(s.key);
                    setQ('');
                  }}
                  title={`${s.label}: ${s.done}/${s.total} documents${s.late.length ? ` · ${s.late.length} late` : ''}`}
                >
                  {s.label}
                  {s.key === 'execution' && s.current && nowSub ? (
                    <em> · {tidy(nowSub.title)}</em>
                  ) : null}
                  {s.late.length > 0 && <span className="pdb-stage__late">Late</span>}
                </button>
              </span>
            ))}
          </nav>

          {q.trim() ? (
            <div className="pdb-search">
              <p className="cc-muted">Documents matching “{q.trim()}” in every stage</p>
              {stages.flatMap((s) =>
                s.parts.map((p) =>
                  card(
                    p,
                    `${s.label}${s.parts.length > 1 ? ` · ${PART_TITLE[p.code] || ''}` : ''}`,
                    q.trim(),
                  ),
                ),
              )}
            </div>
          ) : stage ? (
            <>
              <div className="pdb-stage-head">
                <h3 className="cc-detail-head">{stage.label}</h3>
                <Pill size="sm" tone={stage.complete ? 'ok' : 'brand'}>
                  {stage.done}/{stage.total} documents
                </Pill>
                {stage.late.length > 0 && (
                  <Pill size="sm" tone="bad">
                    {stage.late.length} late
                  </Pill>
                )}
              </div>

              {stage.key === 'execution' && subs.length > 0 && (
                <div className="pdb-subs" aria-label="Execution sub-phases from the Build planner">
                  {subs.map((p) => (
                    <div
                      key={p.id}
                      className={`pdb-sub is-${p.state} ${p === nowSub ? 'is-now' : ''}`}
                    >
                      <span className="pdb-sub__title">{tidy(p.title)}</span>
                      <span className="pdb-sub__meta">
                        <CalendarClock size={12} aria-hidden />{' '}
                        {p.from ? `${fmt(p.from)} – ${fmt(p.to)}` : 'No dates'}
                      </span>
                      <span className="pdb-sub__state">
                        {p === nowSub ? 'Now · ' : ''}
                        {STATE_LABEL[p.state]}
                        {p.late.length ? ` (${p.late.length})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {lateBox(stage.late, stage)}

              {stage.parts.map((p) =>
                card(p, stage.parts.length > 1 ? PART_TITLE[p.code] || p.name : null),
              )}
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="No document stages configured"
              text="Configure the project document phases to start creating and uploading documents."
            />
          )}
        </>
      )}
      {uploadTarget && (
        <UploadDocumentModal
          key={`${uploadTarget.projectId}:${uploadTarget.documentTypeId}`}
          target={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onFlash={toast.error}
          onUploaded={() => {
            setUploadTarget(null);
            toast.success('Document uploaded.');
          }}
        />
      )}
    </Card>
  );
}
