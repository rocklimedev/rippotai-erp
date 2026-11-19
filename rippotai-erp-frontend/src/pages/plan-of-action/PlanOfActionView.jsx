import { appConfirm } from '@/lib/app-dialog';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
// Plan of Action — a filled copy of the user's PLAN OF ACTION TEMPLATE.docx (Word family of the
// print kit): logo cover, How the Execution runs (stats + phase overlap chart), PLAN OF ACTION
// phase table, Terms & Conditions; gold footer rule on every page.
import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit3, Trash2, Download, CheckCircle2, FileText } from 'lucide-react';
import { Page, PageHeader, Button, EmptyState } from '@/components/inos';
import {
  PrintDocument,
  DocumentPreview,
  htmlToTerms,
  coverRows,
  useProjectPeople,
  usePdfDownload,
  pdfFileName,
  has,
  titleCase,
  bySort,
} from '@/components/print-document';
import {
  useGetPlanOfActionQuery,
  useDeletePlanOfActionMutation,
  usePublishPlanOfActionMutation,
} from '../../api/documents/plan-of-actions.api';
import { useGetClientByIdQuery } from '../../api/projects/client.api';
import './plan-of-action-document.css';

function durationLabel(min, max) {
  if (!has(min) && !has(max)) return '';
  if (!has(min) || !has(max) || Number(min) === Number(max)) return `${min ?? max} days`;
  return `${min}–${max} days`;
}

function daysOf(p) {
  const nums = [p.min, p.max].filter((n) => has(n)).map(Number);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Bars: use the planner's own Gantt offsets when given, otherwise let each phase start
// when the previous one is about half-way through (indicative overlap).
function bars(phases) {
  const useGantt = phases.some((p) => Number(p.ganttDuration) > 0);
  let cursor = 0;
  const raw = phases.map((p) => {
    if (useGantt)
      return {
        start: Number(p.ganttOffset) || 0,
        dur: Number(p.ganttDuration) || 0,
      };
    const dur = daysOf(p);
    const start = cursor;
    cursor += dur * 0.5;
    return { start, dur };
  });
  const span = Math.max(...raw.map((r) => r.start + r.dur), 1);
  return raw.map((r) =>
    r.dur > 0
      ? {
          left: (r.start / span) * 100,
          width: Math.max(2.5, (r.dur / span) * 100),
        }
      : { left: (r.start / span) * 100, marker: true },
  );
}

/** PHASE OVERLAP — INDICATIVE: the template's bar chart (green bars, snag/handover in gold). */
function Timeline({ phases }) {
  const b = bars(phases);
  return (
    <div className="wd-poa-gantt">
      <div className="wd-poa-label">PHASE OVERLAP — INDICATIVE</div>
      {phases.map((p, i) => (
        <div key={p.id} className="wd-poa-gantt__row">
          <span className="wd-poa-gantt__p">P{i + 1}</span>
          <div className="wd-poa-gantt__track">
            <div
              className={`wd-poa-gantt__bar ${
                b[i].marker ? 'wd-poa-gantt__bar--marker' : ''
              } ${/snag|handover/i.test(p.title) ? 'wd-poa-gantt__bar--gold' : ''}`}
              style={{
                left: `${Math.min(b[i].left, 97)}%`,
                width: b[i].marker ? undefined : `${Math.min(b[i].width, 100 - b[i].left)}%`,
              }}
            >
              {!b[i].marker && <span>{p.title.toUpperCase()}</span>}
            </div>
          </div>
        </div>
      ))}
      <div className="wd-poa-gantt__axis">
        <span>SITE START</span>
        <span>HANDOVER</span>
      </div>
    </div>
  );
}

export const normalizePoaPhases = (poa) =>
  [...(poa?.phases || [])]
    .map((phase) => {
      const link = phase.PlanOfActionPhase || {};
      return {
        id: phase.id,
        title: titleCase(phase.title),
        description: phase.description,
        min: link.duration_min_days,
        max: link.duration_max_days,
        parallel: link.parallel_work_note,
        inclusion: link.inclusion_note,
        details: link.details, // POA-specific details
        ganttOffset: link.gantt_start_offset_days,
        ganttDuration: link.gantt_duration_days,
        sort: link.sort_order ?? phase.sort_order ?? 0,
      };
    })
    .sort((a, b) => a.sort - b.sort);

export function buildPoaSections(poa, phases) {
  const sections = [];
  const total =
    poa.total_duration_label ||
    durationLabel(poa.total_duration_min_days, poa.total_duration_max_days);
  const count = poa.total_phases || phases.length;

  /* How the Execution runs */
  sections.push({
    title: 'How the Execution runs',
    unnumbered: true,
    headClass: 'wd-poa-head',
    blocks: [
      <div key="o">
        {has(poa.execution_description) && (
          <p className="wd-poa-lead">{poa.execution_description}</p>
        )}
        <div className="wd-poa-stats">
          <div>
            <div className="wd-poa-stats__v">
              {has(count) ? String(count).padStart(2, '0') : ''}
            </div>
            <div className="wd-poa-stats__l">Execution phases from services to handover</div>
          </div>
          <div>
            <div className="wd-poa-stats__v">{total}</div>
            <div className="wd-poa-stats__l">
              Indicative site duration with overlaps, subject to Terms
            </div>
          </div>
        </div>
      </div>,
      phases.length > 0 && <Timeline key="tl" phases={phases} />,
    ].filter(Boolean),
  });

  /* PLAN OF ACTION — phase table */
  if (phases.length)
    sections.push({
      title: 'PLAN OF ACTION',
      unnumbered: true,
      headClass: 'wd-poa-head wd-sec--plain',
      blocks: [
        {
          table: {
            skin: 'word',
            className: 'wd-table--open wd-poa-t',
            allowSplit: true,
            cols: ['', 'Phase', 'Detail', 'Timeline'],
            template: '12.3mm 42.3mm 1fr 31.7mm',
            items: phases.map((p, i) => ({
              key: p.id,
              cells: [
                { text: String(i + 1).padStart(2, '0'), className: 'wd-poa-t__no' },
                { text: p.title, className: 'wd-poa-t__phase' },
                {
                  text: [p.description, p.details].filter(has).join('\n\n'),
                  sub: [
                    p.parallel && `PARALLEL — ${p.parallel}`,
                    p.inclusion && `INCLUDES — ${p.inclusion}`,
                  ]
                    .filter(Boolean)
                    .join('\n'),
                  className: 'wd-poa-t__detail',
                },
                { text: durationLabel(p.min, p.max).toUpperCase(), className: 'wd-poa-t__time' },
              ],
            })),
          },
        },
      ],
    });

  /* Team (INOS data the template does not show; kept in the same table style) */
  const team = bySort(poa.team_members || [], 'sort_order').filter((m) =>
    has(m.user?.name || m.name),
  );
  if (team.length)
    sections.push({
      title: 'Your team',
      unnumbered: true,
      newPage: false,
      headClass: 'wd-poa-head wd-poa-head--sub wd-sec--plain',
      blocks: [
        {
          table: {
            skin: 'word',
            className: 'wd-table--open wd-poa-t',
            cols: ['Name', 'Role'],
            template: '54.6mm 1fr',
            items: team.map((m, i) => ({
              key: m.id || i,
              cells: [
                { text: m.user?.name || m.name, className: 'wd-poa-t__phase' },
                [m.role_label, m.is_primary && 'Primary contact'].filter(Boolean).join(' · '),
              ],
            })),
          },
        },
      ],
    });

  /* Terms & Conditions */
  const terms = htmlToTerms(poa.terms_content_snapshot || poa.terms_version?.content_html);
  if (terms.length)
    sections.push({
      title: 'Terms & Conditions',
      unnumbered: true,
      headClass: 'wd-poa-head wd-poa-head--terms',
      blocks: terms.map((t, i) => (
        <div key={i} className="wd-poa-term">
          <span className="wd-poa-term__n">{String(i + 1).padStart(2, '0')}</span>
          <div>
            {t.title && <div className="wd-poa-term__t">{t.title}</div>}
            {t.body && <div className="wd-poa-term__b">{t.body}</div>}
          </div>
        </div>
      )),
    });

  return sections;
}

export function PlanOfActionView() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('preview');
  const recordInfo = useRecordInfo('plan-of-action', id);
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: poa, isFetching, isError } = useGetPlanOfActionQuery(id, { skip: !id });
  const clientId = poa?.project?.client_id;
  const { data: client } = useGetClientByIdQuery(
    { id: clientId },
    { skip: !clientId || !!poa?.project?.client },
  );
  const [deletePlanOfAction, { isLoading: deleting }] = useDeletePlanOfActionMutation();
  const [publishPlanOfAction, { isLoading: publishing }] = usePublishPlanOfActionMutation();

  const phases = useMemo(() => normalizePoaPhases(poa), [poa]);
  const people = useProjectPeople(poa?.project_id || poa?.project?.id);
  const sections = useMemo(() => (poa ? buildPoaSections(poa, phases) : []), [poa, phases]);

  const crumbs = [
    { label: 'CRM', to: '/crm' },
    { label: 'Plans of action', to: '/crm/plan-of-action/all' },
    { label: 'Plan' },
  ];

  const removePlan = async () => {
    if (!(await appConfirm('Delete this Plan of Action? This cannot be undone.'))) return;
    try {
      await deletePlanOfAction(id).unwrap();
      toast.success('Plan of Action deleted');
      nav('/crm/plan-of-action/all');
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || 'Failed to delete');
    }
  };
  const publishPlan = async () => {
    if (!(await appConfirm('Publish this Plan of Action? The client will be able to view it.')))
      return;
    try {
      await publishPlanOfAction(id).unwrap();
      toast.success('Plan of Action published');
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || 'Failed to publish');
    }
  };

  if (isFetching && !poa)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Plan of action" subtitle="Loading…" />
      </Page>
    );
  if (isError || !poa)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Plan of action" />
        <div className="inos-card">
          <EmptyState
            icon={FileText}
            title="Plan of action not found"
            text="It may have been deleted, or you don't have access to it."
          />
        </div>
      </Page>
    );

  const project = poa.project || {};
  const cl = project.client || client || {};
  const projectName = project.name || 'Project';
  const version = poa.version || 1;

  return (
    <Page>
      <PageHeader
        info={recordInfo}
        crumbs={crumbs}
        title={projectName}
        actions={
          <>
            <Button variant="ghost" icon={Trash2} onClick={removePlan} disabled={deleting}>
              Delete
            </Button>
            <Button
              variant="secondary"
              icon={Edit3}
              onClick={() => nav(`/crm/forms/plan-of-action/${id}/edit`)}
            >
              Edit
            </Button>
            {poa.status !== 'published' && (
              <Button
                variant="secondary"
                icon={CheckCircle2}
                onClick={publishPlan}
                loading={publishing}
              >
                Publish
              </Button>
            )}
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() => {
                flushSync(() => setActiveTab('preview'));
                download(pdfFileName('Plan-of-Action', projectName, version), {
                  title: `Plan of Action — ${projectName}`,
                  label: 'plan of action',
                });
              }}
            >
              Download PDF
            </Button>
          </>
        }
      />
      <RecordContext type="plan-of-action" id={id} />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Plan of action views">
          <TabsTrigger value="preview">PREVIEW</TabsTrigger>
          <TabsTrigger value="history">VERSION HISTORY</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" forceMount hidden={activeTab !== 'preview'}>
          <DocumentPreview>
            <PrintDocument
              ref={docRef}
              variant="word"
              className="wd-poa"
              docType="Plan of Action"
              footerLabel={'\u200b'}
              bodyHeight={241}
              numbered={false}
              title={projectName}
              wordCover={{
                title: 'PLAN OF ACTION',
                className: 'wd-poa-cover',
                logoWidth: 70,
                logoTop: 48,
                rowsTop: 236.5,
                rows: coverRows({
                  project: projectName,
                  address: project.site_location,
                  client: cl.name,
                  ...people,
                }),
              }}
              sections={sections}
            />
          </DocumentPreview>
        </TabsContent>
        <TabsContent value="history">
          <VersionHistory type="plan-of-action" id={id} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

export default PlanOfActionView;
