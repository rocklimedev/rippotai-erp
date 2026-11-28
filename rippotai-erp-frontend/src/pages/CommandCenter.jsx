import { DocumentUpload } from './documents/DocumentUpload';
import DrawingUploadPage from './design-studio/DrawingUploadPage';
import EvidenceDrawer from '@/components/command-center/EvidenceDrawer';
import { useDispatch } from 'react-redux';
import './CommandCenter.css';
import { downloadDocument } from '../hooks/shared';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { usePollingInterval, canBackgroundPoll } from '@/hooks/use-polling-interval';
import PhaseGateButton from '@/components/command-center/PhaseGateButton';
import ProcurementPanel from '@/components/command-center/ProcurementPanel';
import ClientCollections from '@/components/command-center/ClientCollections';
import ExecutionTaskList from '@/components/projects/ExecutionTaskList';
import { useGetProjectPlannerOverviewQuery } from '@/api/documents/project-planner.api';
import AuthorityPanel from '@/components/command-center/AuthorityPanel';
import { isSuperAuthority } from '@/components/command-center/authority';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  CircleCheck,
  CloudOff,
  FileText,
  FolderSearch,
  IndianRupee,
  Package,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';

import {
  Page,
  PageHeader,
  Card,
  Button,
  Stats,
  StatTile,
  SearchInput,
  Segmented,
  Tabs,
  Pill,
  EmptyState,
  Progress,
} from '@/components/inos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ------------------------------------------------------------
// LIVE API — every number on screen comes from CommandCenterService
// via command-center.api.js.
// ------------------------------------------------------------
import {
  commandCenterApi,
  useGetCommandCenterKpisQuery,
  useRefreshCommandCenterMutation,
  useGetCommandCenterPortfolioQuery,
  useGetProjectPhaseDetailQuery,
  useGetCommandCenterActionsQuery,
  useGetCommandCenterCommercialQuery,
} from '../api/projects/command-center.api';

// ------------------------------------------------------------
// ROUTES — deep links into the canonical modules (unchanged)
// ------------------------------------------------------------

const ROUTES = {
  projects: '/projects',
  project: (id) => `/projects/${id}`,
  boq: '/ledger/boq/all',
  tasks: '/tasks/all',
  taskProject: (id) => `/tasks/all?project=${encodeURIComponent(id)}`,
  documents: '/projects/documents/all',
  documentsProject: (id) => `/projects/documents/all?project_id=${encodeURIComponent(id)}`,
  procurement: '/procurement',
  calendar: '/calendar',
};

const REFRESH_TAGS = [
  'CommandCenterKpis',
  'CommandCenterPortfolio',
  'CommandCenterProjectPhases',
  'CommandCenterActions',
  'CommandCenterCommercial',
  'CommandCenterGates',
  'ProcurementQuotations',
  'ClientCollections',
];


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const cn = (...classes) => classes.filter(Boolean).join(' ');

const formatINR = (value) => {
  const n = Number(value || 0);
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} L`;
  return `₹ ${n.toLocaleString('en-IN')}`;
};

// Backend enum values may arrive as "AWAITING_GATE", "Awaiting Gate",
// "awaiting-gate"… normalise to one SCREAMING_SNAKE key.
const normalizeKey = (v) =>
  String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

const sentence = (v) => {
  const s = String(v ?? '')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
};

function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function timeAgo(dateLike) {
  if (!dateLike) return '';
  const then = new Date(dateLike).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// Phase state -> pastel tone (drives stepper dots, pills and legend)
const STATE_TONE = {
  COMPLETE: 'ok',
  AWAITING_GATE: 'info',
  IN_PROGRESS: 'brand',
  STALLED: 'peach',
  QC_FAILED: 'bad',
  NOT_STARTED: 'mute',
};
const stateTone = (state) => STATE_TONE[normalizeKey(state)] || 'mute';
const stateLabel = (state) => sentence(normalizeKey(state));

const LEGEND = [
  ['COMPLETE', 'Gate cleared'],
  ['AWAITING_GATE', 'Awaiting approval'],
  ['IN_PROGRESS', 'In progress'],
  ['STALLED', 'Stalled'],
  ['QC_FAILED', 'QC failed'],
  ['NOT_STARTED', 'Not started'],
];

const HEALTH_TONE = {
  DANGER: 'bad',
  GATE: 'info',
  PROGRESS: 'ok',
  COMPLETE: 'brand',
};
const healthTone = (key) => HEALTH_TONE[normalizeKey(key)] || 'ok';

// "01 BRIEF" -> "Brief", "A VENDOR TRADES" -> "A Vendor Trades"
const phaseTitle = (name) => {
  const raw = String(name ?? '')
    .replace(/^\d+\s+/, '')
    .trim();
  if (!raw || raw !== raw.toUpperCase()) return raw || String(name ?? '');
  return raw.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
};
const gateTitle = (code) => sentence(code);


// ------------------------------------------------------------
// SMALL UI PIECES (local to this module)
// ------------------------------------------------------------

function Toast({ message }) {
  if (!message) return null;
  return (
    <div role="status" className="cc-toast">
      {message}
    </div>
  );
}

function LoadingRow({ label = 'Loading…' }) {
  return (
    <div className="cc-loading" role="status">
      <Loader2 className="cc-spin" aria-hidden />
      {label}
    </div>
  );
}

function ErrorRow({ error, onRetry }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="Couldn't load this data"
      text={`The server didn't respond as expected${error?.status ? ` (HTTP ${error.status})` : ''}. Try again in a moment.`}
      action={
        onRetry && (
          <Button size="sm" icon={RefreshCw} onClick={onRetry}>
            Retry
          </Button>
        )
      }
    />
  );
}

/** Clickable list row used across the tab panels. */
function ListRow({ icon: Icon, tone, title, tag, sub, meta, right, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cn('cc-row', onClick && 'cc-row--link')}
      onClick={onClick}
    >
      {Icon && (
        <span
          className={cn('inos-icon-tile inos-icon-tile--sm', tone && `inos-icon-tile--${tone}`)}
        >
          <Icon aria-hidden />
        </span>
      )}
      <span className="cc-row__text">
        <span className="cc-row__title">
          <span className="cc-truncate">{title}</span>
          {tag}
        </span>
        {sub && <span className="cc-row__sub">{sub}</span>}
        {meta && <span className="cc-row__meta">{meta}</span>}
      </span>
      {right}
      {onClick && !right && <ArrowRight className="cc-row__chev" aria-hidden />}
    </Tag>
  );
}

/** Small figure block used inside cards (no nested cards). */
function Figures({ items }) {
  return (
    <div className="cc-figures" style={{ '--cols': items.length }}>
      {items.map(({ label, value, tone }) => (
        <div key={label} className="cc-figure">
          <span className={cn('cc-figure__value tabular', tone && `cc-tone-${tone}`)}>{value}</span>
          <span className="cc-figure__label">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// PROJECT BOARD — expandable rows with a per-project phase stepper
// ------------------------------------------------------------

function PhaseStepper({ phases, activeSeq }) {
  return (
    <div className="cc-stepper" aria-label="Project phase status">
      {phases.map((phase, index) => (
        <span key={phase.id} className="cc-step">
          <span
            className={cn(
              'cc-step__dot',
              `cc-dot--${stateTone(phase.state)}`,
              phase.phaseNumber === activeSeq && 'is-current',
            )}
            title={`${phase.phaseNumber}. ${phaseTitle(phase.name)} — ${stateLabel(phase.state)}${phase.gate?.code ? ` · Gate ${gateTitle(phase.gate.code)}` : ''}`}
          />
          {index < phases.length - 1 && (
            <span
              className={cn('cc-step__line', normalizeKey(phase.state) === 'COMPLETE' && 'is-done')}
            />
          )}
        </span>
      ))}
    </div>
  );
}

function PhaseLegend() {
  return (
    <div className="cc-legend" aria-label="Phase status legend">
      <span className="cc-legend__label">Phase status</span>
      {LEGEND.map(([state, label]) => (
        <Pill key={state} tone={STATE_TONE[state]} size="sm">
          {label}
        </Pill>
      ))}
    </div>
  );
}

export function PhaseDetailCard({
  project,
  phase,
  onOpen,
  onFlash,
  documentsOnly = false,
  filter = '',
  title,
}) {
  const {
    data: detail,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProjectPhaseDetailQuery(
    { projectId: project.id || project.code, phaseId: phase.id },
    { skip: !(project?.id || project?.code) || !phase?.id },
  );
  // Execution is one phase: its list is the Build planner's work.
  const isExecution = phase?.code === '08_EXECUTION';
  const { data: plannerRes } = useGetProjectPlannerOverviewQuery(project?.id, {
    skip: !isExecution || documentsOnly || !project?.id,
  });

  // Search: only this phase's documents whose name matches; hide the phase when none do.
  const term = String(filter || '')
    .trim()
    .toLowerCase();
  const docs = detail
    ? term
      ? detail.docs.filter((d) =>
          String(d.name || '')
            .toLowerCase()
            .includes(term),
        )
      : detail.docs
    : [];
  if (term && (!detail || !docs.length)) return null;

  return (
    <div className="cc-phase-detail">
      {title && <h3 className="cc-detail-head">{title}</h3>}
      {isLoading && <LoadingRow label="Loading documents…" />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {isExecution && !documentsOnly && !term && (
        <ExecutionTaskList overview={plannerRes?.data || plannerRes} projectId={project.id} />
      )}
      {detail && (
        <div className="cc-detail-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <div className="cc-documents-head">
              <p className="cc-detail-head">
                <FileText aria-hidden /> Documents
              </p>
              {!documentsOnly && !isError && (
                <PhaseGateButton
                  key={`${project.id}:${phase.id}`}
                  projectId={project.id}
                  gates={detail.gates}
                  onFlash={onFlash}
                />
              )}
            </div>
            <ul className="cc-checklist">
              {docs.map((d) => {
                const ok = d.status === 'UPLOADED' || d.status === 'approved';
                return (
                  <li key={d.id}>
                    <span className={cn('cc-bullet', ok ? 'cc-dot--ok' : 'cc-dot--mute')} />
                    <span className="cc-checklist__name">
                      <span className="cc-truncate">{d.name}</span>
                      {!d.mandatory && <span className="cc-muted">optional</span>}
                      {!ok && d.evidence?.recordId && d.evidence.source === 'UPLOAD' && (
                        <span className="cc-muted">{sentence(d.evidence.status)}</span>
                      )}
                    </span>
                    {d.evidence?.source === 'UPLOAD' && d.evidence.recordId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onOpen?.viewEvidence?.({
                            targetType: d.targetType,
                            documentTypeId: d.id,
                            name: d.name,
                            projectId: project.id,
                            projectName: project.name,
                            projectCode: project.code,
                            phaseCode: phase.code,
                            phaseName: phaseTitle(phase.name),
                            role: d.role,
                          })
                        }
                      >
                        {d.evidence.status?.toLowerCase() === 'approved'
                          ? 'View'
                          : 'View & approve'}
                      </Button>
                    )}
                    {d.evidence?.source === 'UPLOAD' && d.evidence.recordId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(d.evidence.recordId)}
                      >
                        Download
                      </Button>
                    )}
                    {d.evidence?.source === 'DATABASE' ? (
                      <span className="cc-checklist__side">
                        <span className="cc-muted">
                          {d.evidence.sourceLabel} · {d.evidence.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = d.evidence.actionUrl;
                            if (url)
                              onOpen?.navigate(
                                `${url}${url.includes('?') ? '&' : '?'}project_id=${encodeURIComponent(project.id)}`,
                              );
                          }}
                          disabled={!d.evidence.actionUrl}
                        >
                          {d.evidence.recordId ? 'Open record' : 'Create document'}
                        </Button>
                      </span>
                    ) : d.status === 'MISSING' ? (
                      <Button
                        variant="soft"
                        size="sm"
                        icon={UploadCloud}
                        title={
                          d.targetType === 'DRAWING'
                            ? 'Upload drawings for this checklist item'
                            : undefined
                        }
                        onClick={() =>
                          onOpen?.uploadDoc?.({
                            targetType: d.targetType,
                            phaseCode: phase.code,
                            documentTypeId: d.id,
                            name: d.name,
                            role: d.role,
                            projectId: project.id,
                            projectCode: project.code,
                            projectName: project.name,
                            phaseName: phaseTitle(phase.name),
                          })
                        }
                      >
                        {d.targetType === 'DRAWING'
                          ? 'Upload drawing'
                          : d.evidence?.recordId
                            ? 'Replace upload'
                            : 'Upload'}
                      </Button>
                    ) : (
                      <Pill tone="ok" size="sm">
                        {sentence(d.status)}
                      </Pill>
                    )}
                  </li>
                );
              })}
              {detail.docs.length === 0 && (
                <li className="cc-muted">No documents configured for this phase.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="cc-phase-detail__foot">
        <Button
          variant="ghost"
          size="sm"
          iconRight={ArrowRight}
          onClick={() => onOpen?.navigate(ROUTES.documentsProject(project.id))}
        >
          Open in Documents
        </Button>
      </div>
    </div>
  );
}

function ProjectExecutionBoard({
  rows,
  expanded,
  onToggle,
  onOpenProject,
  canUpdateTasks,
  onOpen,
  onFlash,
  onClearFilters,
}) {
  const [selectedPhases, setSelectedPhases] = useState({});
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FolderSearch}
        title="No projects match this view"
        text="Try another health filter or clear the search to see the whole portfolio."
        action={
          onClearFilters && (
            <Button size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          )
        }
      />
    );
  }
  return (
    <div className="cc-board">
      {rows.map((row) => {
        const isOpen = expanded === row.code;
        const activePhase = row.phases.find((phase) => phase.phaseNumber === row.currentPhaseSeq);
        const selected =
          selectedPhases[row.code] === undefined ? activePhase?.id : selectedPhases[row.code];
        const completed = row.phases.filter(
          (phase) => normalizeKey(phase.state) === 'COMPLETE',
        ).length;
        return (
          <article className={cn('cc-project', isOpen && 'is-open')} key={row.code}>
            <div className="cc-project__head">
              <button
                type="button"
                className="cc-project__toggle"
                aria-expanded={isOpen}
                aria-controls={`cc-project-${row.id}`}
                onClick={() => onToggle(row.code)}
              >
                <span className="cc-project__info">
                  <ChevronDown className="cc-project__chev" aria-hidden />
                  <span style={{ minWidth: 0 }}>
                    <span className="cc-project__name">{row.name}</span>
                    <span className="cc-project__meta">
                      {row.location || 'Location not set'}
                      {row.lastActivity ? ` · ${timeAgo(row.lastActivity)}` : ''}
                      {row.daysIdle > 0 ? ` · ${row.daysIdle}d idle` : ''}
                    </span>
                  </span>
                </span>
                <span className="cc-project__phase">
                  <PhaseStepper phases={row.phases} activeSeq={row.currentPhaseSeq} />
                  <span className="cc-project__phase-label">
                    {activePhase
                      ? `Phase ${activePhase.phaseNumber} of ${row.phases.length} · ${row.executionWork?.label || phaseTitle(activePhase.name)}`
                      : 'Not started'}
                  </span>
                </span>
                <span className="cc-project__pct">
                  <span className="cc-project__pct-top">
                    <strong className="tabular">{row.pct}%</strong>
                    <span className="cc-muted tabular">
                      {completed}/{row.phases.length} phases
                    </span>
                  </span>
                  <Progress value={row.pct} />
                </span>
              </button>
              <div className="cc-project__links">
                <Pill tone={healthTone(row.health?.key)}>{sentence(row.health?.label)}</Pill>
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={ArrowRight}
                  onClick={() => onOpenProject(row.id)}
                >
                  Open
                </Button>
              </div>
            </div>
            {isOpen && (
              <div className="cc-project__detail" id={`cc-project-${row.id}`}>
                {row.phases.map((phase) => (
                  <div className="cc-phase" key={phase.id}>
                    <div className="cc-phase__row">
                      <span
                        className={cn('cc-phase__num tabular', `cc-num--${stateTone(phase.state)}`)}
                      >
                        {String(phase.phaseNumber).padStart(2, '0')}
                      </span>
                      <div className="cc-phase__text">
                        <p className="cc-phase__name">{phaseTitle(phase.name)}</p>
                        <p className="cc-phase__meta">
                          Docs {phase.docsDone}/{phase.docsTotal}
                          {phase.gate?.code ? ` · Gate: ${gateTitle(phase.gate.code)}` : ''}
                        </p>
                      </div>
                      <div className="cc-phase__progress">
                        <Progress
                          value={phase.pct}
                          tone={
                            ['mute', 'brand'].includes(stateTone(phase.state))
                              ? undefined
                              : stateTone(phase.state)
                          }
                        />
                        <span className="tabular">{phase.pct}%</span>
                      </div>
                      <Pill tone={stateTone(phase.state)} size="sm">
                        {stateLabel(phase.state)}
                      </Pill>
                      <Button
                        variant={selected === phase.id ? 'soft' : 'secondary'}
                        size="sm"
                        className="cc-phase__btn"
                        aria-expanded={selected === phase.id}
                        aria-controls={`cc-phase-${row.id}-${phase.id}`}
                        onClick={() =>
                          setSelectedPhases((previous) => ({
                            ...previous,
                            [row.code]: selected === phase.id ? null : phase.id,
                          }))
                        }
                      >
                        {selected === phase.id ? 'Hide details' : 'View details'}
                      </Button>
                    </div>
                    {selected === phase.id && (
                      <div id={`cc-phase-${row.id}-${phase.id}`}>
                        <PhaseDetailCard
                          project={row}
                          phase={phase}
                          canUpdateTasks={canUpdateTasks}
                          onOpen={onOpen}
                          onFlash={onFlash}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// ACTION REQUIRED — GET /command-center/actions
// ------------------------------------------------------------

function ActionRequired({ onOpen }) {
  const { data, isLoading, isError, error, refetch } = useGetCommandCenterActionsQuery(undefined, {
    refetchOnMountOrArgChange: 60,
  });
  const actions = data || [];

  // The service doesn't tag each item with a "kind" yet, so route
  // generically to the project page.
  const routeFor = (item) => ROUTES.project(item.projectId || item.projectCode);

  return (
    <Card
      flush
      title="Action required"
      subtitle="Open mandatory items that are blocking a gate"
      actions={
        !isLoading &&
        !isError &&
        actions.length > 0 && <Pill tone="bad">{actions.length} open</Pill>
      }
    >
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}
      {!isLoading && !isError && actions.length > 0 && (
        <div className="cc-list">
          {actions.map((item, i) => (
            <ListRow
              key={i}
              icon={item.severe ? ShieldAlert : AlertCircle}
              tone={item.severe ? 'bad' : 'warn'}
              title={item.title}
              sub={item.project}
              meta={item.meta}
              onClick={() => onOpen(routeFor(item))}
            />
          ))}
        </div>
      )}
      {!isLoading && !isError && actions.length === 0 && (
        <EmptyState
          icon={CircleCheck}
          title="No blockers right now"
          text="Every mandatory item on the open gates is in place."
        />
      )}
    </Card>
  );
}

// ------------------------------------------------------------
// COMMERCIAL — GET /command-center/commercial
// ------------------------------------------------------------

function CommercialPanel({ onOpen, canViewFinancialValues }) {
  const { data, isLoading, isError, error, refetch } = useGetCommandCenterCommercialQuery(
    undefined,
    { refetchOnMountOrArgChange: 60 },
  );

  return (
    <Card
      flush
      title="Commercial"
      subtitle="BOQ and costing — Phase 5, gate G5"
      actions={
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => onOpen(ROUTES.boq)}>
          Open BOQ
        </Button>
      }
    >
      {isLoading && <LoadingRow />}
      {isError && <ErrorRow error={error} onRetry={refetch} />}

      {data && (
        <>
          {canViewFinancialValues && <Figures
            items={[
              {
                label: 'Total portfolio value',
                value: data.totalValue ? formatINR(data.totalValue) : '—',
              },
              {
                label: 'Commercially approved (G5)',
                value: formatINR(data.approvedValue),
                tone: 'ok',
              },
            ]}
          />}
          <div className="cc-section">
            <p className="cc-detail-head">G5 status across the portfolio</p>
            <div className="cc-g5">
              {[
                ['Not reached', data.notReached, 'mute'],
                ['Costing in progress', data.inProgress, 'info'],
                ['Awaiting approval', data.awaiting, 'warn'],
                ['Approved', data.approved, 'ok'],
              ].map(([label, value, tone]) => (
                <div key={label} className="cc-g5__item">
                  <span className={cn('cc-bullet', `cc-dot--${tone}`)} />
                  <span className="cc-g5__label">{label}</span>
                  <strong className="tabular">{value ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {canViewFinancialValues && <ClientCollections />}
    </Card>
  );
}

// ------------------------------------------------------------
// UPLOAD DOCUMENT MODAL — POST /command-center/projects/:id/documents/upload
// ------------------------------------------------------------

export function UploadDocumentModal({ target, onClose, onUploaded }) {
  const [busy, setBusy] = useState(false);
  if (!target) return null;
  const isDrawing = target.targetType === 'DRAWING';
  const UploadForm = isDrawing ? DrawingUploadPage : DocumentUpload;
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent
        className={`cc-upload-modal ${isDrawing ? 'sm:max-w-6xl' : 'sm:max-w-3xl'} p-0 gap-0 max-h-[90vh] overflow-y-auto`}
      >
        <DialogHeader className="cc-upload-modal__head">
          <DialogTitle className="inos-section-title">
            {isDrawing ? 'Upload drawings' : 'Upload document'}
          </DialogTitle>
        </DialogHeader>
        <div className="cc-upload-modal__body inos-modal-body">
          <UploadForm
            key={`${target.projectId ?? target.projectCode}:${target.documentTypeId}`}
            embedded
            target={target}
            onCancel={onClose}
            onBusyChange={setBusy}
            onUploaded={() => {
              setBusy(false);
              onUploaded(target);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
// ------------------------------------------------------------
// TAB NAVIGATION
// ------------------------------------------------------------

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: BriefcaseBusiness },
  { id: 'actions', label: 'Action required', icon: AlertCircle },
  { id: 'procurement', label: 'Procurement', icon: Package },
  { id: 'commercial', label: 'Commercial', icon: IndianRupee },
];

// Shown only to the super authority (ADMIN / SUPERADMIN); the API enforces it too.
const AUTHORITY_TAB = { id: 'authority', label: 'Authority', icon: ShieldCheck };

function TabNav({ active, onChange, counts, showAuthority }) {
  const tabs = showAuthority ? [AUTHORITY_TAB, ...TABS] : TABS;
  return (
    <div className="cc-tabs">
      <Tabs
        value={active}
        onChange={onChange}
        options={tabs.map((tab) => {
          const count = counts?.[tab.id];
          return {
            value: tab.id,
            label: tab.label,
            icon: tab.icon,
            count: typeof count === 'number' && count > 0 ? count : undefined,
          };
        })}
      />
    </div>
  );
}

const HEALTH_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'progress', label: 'On track' },
  { value: 'gate', label: 'Gate pending' },
  { value: 'danger', label: 'Attention' },
];

// ------------------------------------------------------------
// MAIN PAGE
// ------------------------------------------------------------

export default function CommandCenter() {
  const dispatch = useDispatch();
  const [refreshCache, refreshState] = useRefreshCommandCenterMutation();
  const [live, setLive] = useState(true);
  const [healthFilter, setHealthFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [expanded, setExpanded] = useState(null);
  const { user } = useAuth();
  const canViewFinancialValues = hasPermission(user, 'project-financial-values:read');
  const canUpdateTasks = !!user;
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [uploadTarget, setUploadTarget] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const showAuthority = isSuperAuthority(user);
  // Super authority lands on their own dashboard; ?tab=<id> deep-links any tab.
  const [chosenTab, setActiveTab] = useState(() =>
    new URLSearchParams(window.location.search).get('tab'),
  );
  const activeTab =
    chosenTab && (chosenTab !== 'authority' || showAuthority)
      ? chosenTab
      : showAuthority
        ? 'authority'
        : 'portfolio';
  const pollingInterval = usePollingInterval(60_000, live);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  // ---- KPI strip ----
  const {
    data: kpi = {
      live: 0,
      awaiting: 0,
      stalled: 0,
      failed: 0,
      docsMissing: 0,
      value: 0,
    },
    isFetching: kpiLoading,
    fulfilledTimeStamp: updatedAt,
  } = useGetCommandCenterKpisQuery();

  // ---- Portfolio, filtered (drives the Portfolio tab board) ----
  const {
    data: filteredRows = [],
    isLoading: portfolioLoading,
    isError: portfolioError,
    error: portfolioErrorObj,
    refetch: refetchPortfolio,
  } = useGetCommandCenterPortfolioQuery(
    {
      health: healthFilter === 'all' ? undefined : healthFilter,
      search: debouncedSearch || undefined,
    },
    { skip: activeTab !== 'portfolio', refetchOnMountOrArgChange: 60 },
  );

  // ---- Other tabs, each backed by its own endpoint ----
  useEffect(() => {
    if (!pollingInterval) return;
    const tagsByTab = {
      portfolio: ['CommandCenterPortfolio', 'CommandCenterProjectPhases', 'CommandCenterGates'],
      actions: ['CommandCenterActions'],
      procurement: ['ProcurementQuotations'],
      commercial: ['CommandCenterCommercial', 'ClientCollections'],
    };
    const timer = setInterval(() => {
      if (canBackgroundPoll())
        dispatch(
          commandCenterApi.util.invalidateTags([
            'CommandCenterKpis',
            ...(tagsByTab[activeTab] ?? []),
          ]),
        );
    }, pollingInterval);
    return () => clearInterval(timer);
  }, [pollingInterval, activeTab, dispatch]);

  const handleRescan = async () => {
    if (refreshState.isLoading) return;
    try {
      await refreshCache().unwrap();
    } catch {
      flashToast('Could not refresh records. Try again shortly.');
      return;
    }
    dispatch(commandCenterApi.util.invalidateTags(REFRESH_TAGS));
    flashToast('Refreshing records…');
  };

  const handleUploaded = (target) => {
    setUploadTarget(null);
    flashToast(`${target.name} uploaded to ${target.projectName}.`);
  };

  const tabCounts = useMemo(
    () => ({
      portfolio: kpi.live,
    }),
    [kpi.live],
  );

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const kpiValue = (v) => (kpiLoading && v == null ? '—' : v);

  return (
    <Page className="command-center">
      <PageHeader
        crumbs={[{ label: 'Command Center' }]}
        title="Command Center"
        subtitle="Live health of every project — gates, evidence, site checks and money in one calm view."
        actions={
          <>
            <button
              type="button"
              className={cn('cc-live', live && 'is-live')}
              aria-pressed={live}
              title={
                live
                  ? 'Refreshes every minute while active. Click to pause.'
                  : 'Auto-refresh paused. Click to resume.'
              }
              onClick={() => setLive((value) => !value)}
            >
              <span className="cc-live__dot" aria-hidden />
              {live ? 'Live' : 'Paused'}
              <span className="cc-live__time">
                {updatedLabel ? `Updated ${updatedLabel}` : 'Loading…'}
              </span>
            </button>
            <Button
              icon={RefreshCw}
              onClick={handleRescan}
              disabled={kpiLoading || refreshState.isLoading}
              className={kpiLoading || refreshState.isLoading ? 'cc-refreshing' : undefined}
            >
              {kpiLoading ? 'Refreshing' : 'Rescan'}
            </Button>
            <Button icon={FileText} onClick={() => setEvidenceTarget({})}>
              Documents & drawings
            </Button>
            {user?.permissions?.includes('projects:create') && (
              <Button variant="primary" icon={Plus} onClick={() => navigate('/projects/new')}>
                New project
              </Button>
            )}
          </>
        }
      />

      {/* KPI STRIP */}
      <Stats>
        <StatTile
          label="Live projects"
          value={kpiValue(kpi.live)}
          meta="Active projects"
          icon={<BriefcaseBusiness />}
          active={activeTab === 'portfolio' && healthFilter === 'all'}
          onClick={() => {
            setActiveTab('portfolio');
            setHealthFilter('all');
          }}
        />
        <StatTile
          label="Awaiting sign-off"
          value={kpiValue(kpi.awaiting)}
          meta="Complete, not yet signed"
          icon={<ShieldCheck />}
          tone="warn"
          active={activeTab === 'portfolio' && healthFilter === 'gate'}
          onClick={() => {
            setActiveTab('portfolio');
            setHealthFilter('gate');
          }}
        />
        {canViewFinancialValues && <StatTile
          label="Portfolio value"
          value={kpiLoading && kpi.value == null ? '—' : formatINR(kpi.value)}
          meta="Across active projects"
          icon={<IndianRupee />}
          active={activeTab === 'commercial'}
          onClick={() => setActiveTab('commercial')}
        />}
      </Stats>

      <div className="cc-main">
        {/* TABS */}
        <TabNav
          active={activeTab}
          onChange={setActiveTab}
          counts={tabCounts}
          showAuthority={showAuthority}
        />

        {/* SUPER AUTHORITY TAB */}
        {activeTab === 'authority' && showAuthority && <AuthorityPanel onOpen={navigate} />}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <Card
            flush
            title="Project execution"
            subtitle="Open a project to see its phases, evidence and gate sign-offs."
            actions={
              <Button
                variant="ghost"
                size="sm"
                iconRight={ArrowRight}
                onClick={() => navigate(ROUTES.projects)}
              >
                All projects
              </Button>
            }
            footer={<PhaseLegend />}
          >
            <div className="cc-board-toolbar">
              <SearchInput value={search} onChange={setSearch} placeholder="Search projects" />
              <Segmented value={healthFilter} onChange={setHealthFilter} options={HEALTH_FILTERS} />
            </div>

            {portfolioLoading && <LoadingRow label="Loading portfolio…" />}
            {portfolioError && <ErrorRow error={portfolioErrorObj} onRetry={refetchPortfolio} />}
            {!portfolioLoading && !portfolioError && (
              <ProjectExecutionBoard
                rows={filteredRows}
                expanded={expanded}
                onToggle={(code) => setExpanded(expanded === code ? null : code)}
                onOpenProject={(code) => navigate(ROUTES.project(code))}
                canUpdateTasks={canUpdateTasks}
                onOpen={{ navigate, uploadDoc: setUploadTarget, viewEvidence: setEvidenceTarget }}
                onFlash={flashToast}
                onClearFilters={
                  healthFilter !== 'all' || search
                    ? () => {
                        setHealthFilter('all');
                        setSearch('');
                      }
                    : undefined
                }
              />
            )}
          </Card>
        )}

        {/* ACTION REQUIRED TAB */}
        {activeTab === 'actions' && <ActionRequired onOpen={navigate} />}

        {/* PROCUREMENT TAB */}
        {activeTab === 'procurement' && <ProcurementPanel onOpen={navigate} />}

        {/* COMMERCIAL TAB */}
        {activeTab === 'commercial' && (
          <CommercialPanel onOpen={navigate} canViewFinancialValues={canViewFinancialValues} />
        )}

      </div>

      {uploadTarget && (
        <UploadDocumentModal
          target={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={handleUploaded}
          onFlash={flashToast}
        />
      )}

      {evidenceTarget && (
        <EvidenceDrawer
          key={`${evidenceTarget.projectId || 'browse'}:${evidenceTarget.documentTypeId || 'all'}`}
          target={evidenceTarget}
          onClose={() => setEvidenceTarget(null)}
        />
      )}
      <Toast message={toast} />
    </Page>
  );
}
