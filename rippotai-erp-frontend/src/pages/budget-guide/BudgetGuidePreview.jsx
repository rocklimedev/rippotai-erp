import { forwardRef, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, Pencil } from 'lucide-react';
import { Button, Card, PageHeader } from '@/components/inos';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
import { useAuth } from '@/context/AuthContext';
import {
  useGetBudgetGuideQuery,
  useTransferBudgetGuideMutation,
} from '@/api/documents/budget-guides.api';
import { useGetProjectsQuery } from '@/api/projects/project.api';
import {
  PrintDocument,
  DocumentPreview,
  has,
  fmtDate,
  usePdfDownload,
  pdfFileName,
} from '@/components/print-document';
import './budget-guide.css';
import './budget-guide-document.css';

// Specification & Budget Guide — the user's SPECIFICATION & BUDGET GUIDE TEMPLATE.docx on the
// Word family of the print kit: hairline page header, logo cover, overview with the tier table,
// per tier "SPECIFICATION TIER …" + target budget band + cost distribution, its material rate
// schedule, How We Price, What Happens Next. Content mirrors the guide editor field for field.
const TIER_WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];

const Eyebrow = ({ children, style }) => (
  <div className="wd-sbg-eyebrow" style={style}>
    {children}
  </div>
);
const Heading = ({ eyebrow, title, sub }) => (
  <div className="wd-sbg-head">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="wd-sbg-head__title">{title}</h2>
    {has(sub) && <p className="wd-sbg-head__sub">{sub}</p>}
  </div>
);

function buildGuideSections(guide) {
  const calc = guide.calculation || {};
  const plans = calc.plans || [];
  const unit = guide.area_unit;
  const perUnit = unit === 'sq.ft.' ? 'sq. ft.' : unit;
  const sym = guide.currency === 'INR' ? '₹' : `${guide.currency} `;
  const money = (value) =>
    `${sym}${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const range = (low, high, open = false) => `${money(low)} – ${money(high)}${open ? '+' : ''}`;
  const t = (cols, template, items, extra = {}) => ({
    table: {
      skin: 'word',
      className: 'wd-table--open wd-sbg-t',
      allowSplit: true,
      cols,
      template,
      items,
      ...extra,
    },
  });
  const sections = [];

  /* Overview */
  const facts = [
    ['Date', fmtDate(guide.issue_date)],
    ['Project', guide.project?.name],
    ['Location', guide.location],
    ['Prepared by', guide.prepared_by],
    [
      'Built-up area',
      guide.built_up_area == null
        ? ''
        : `${Number(guide.built_up_area).toLocaleString('en-IN')} ${unit}`,
    ],
    ['Indicative rates valid until', fmtDate(calc.rates_valid_until)],
    ['Revision', `${guide.revision}${guide.status === 'draft' ? ' · Draft for review' : ''}`],
  ];
  sections.push({
    unnumbered: true,
    blocks: [
      <div key="ov">
        <Eyebrow style={{ letterSpacing: '4pt', marginBottom: '4mm' }}>
          {(guide.project_type || '(PROJECT TYPE) CONSTRUCTION').toUpperCase()}
        </Eyebrow>
        <h1 className="wd-sbg-title">Specification &amp; Budget Guide</h1>
        {has(guide.title) && <p className="wd-sbg-guide">{guide.title}</p>}
        {has(guide.introduction) && <p className="wd-sbg-p">{guide.introduction}</p>}
        <p className="wd-sbg-p wd-sbg-p--valid">
          This guide is valid for {guide.validity_months} months from the date of issue. Indicative
          rates are subject to revision based on prevailing market conditions.
        </p>
        <p className="wd-sbg-p">
          We are open to working with new vendors who can offer better rates, reliable service, and
          quality that meets our project standards.
        </p>
      </div>,
      t(
        ['Tier', 'Specification', `Indicative budget, per ${perUnit} built-up`],
        '30mm 77.6mm 1fr',
        plans.map((plan, i) => ({
          key: plan.key,
          cells: [
            { text: plan.name, className: i ? 'wd-sbg-strong' : '' },
            plan.specification || 'To be specified',
            range(plan.rate_low, plan.rate_high, plan.upper_open),
          ],
        })),
        { keepWhole: true },
      ),
      <div key="facts" className="wd-sbg-facts">
        {facts
          .filter(([k, v]) => k === 'Date' || has(v))
          .map(([k, v]) => (
            <div key={k}>
              {k}: <span>{v}</span>
            </div>
          ))}
      </div>,
    ],
  });

  plans.forEach((plan, index) => {
    const dist = plan.costing_mode === 'distribution';
    const withAmount = dist && guide.built_up_area != null;
    const blocks = [
      <div key="h">
        <Heading
          eyebrow={`SPECIFICATION TIER ${TIER_WORDS[index] || index + 1}`}
          title={plan.name}
          sub={plan.specification}
        />
        <div className="wd-sbg-target">
          <span className="wd-sbg-target__k">TARGET BUDGET</span>
          <span className="wd-sbg-target__v">
            {range(plan.rate_low, plan.rate_high, plan.upper_open)} per {perUnit}
          </span>
          <span className="wd-sbg-target__n">
            {dist ? 'of built-up area' : 'itemised from quantities and item rates'}
          </span>
        </div>
        <Eyebrow style={{ margin: '6.4mm 0 2.2mm' }}>COST DISTRIBUTION</Eyebrow>
      </div>,
      t(
        [
          'Head of cost',
          'Share',
          dist ? `Per ${perUnit} of built-up area` : 'Item amount',
          ...(withAmount ? ['Amount'] : []),
        ],
        withAmount ? '56mm 22mm 1fr 1fr' : '68.8mm 30mm 1fr',
        [
          ...plan.cost_heads.map((head, h) => ({
            key: h,
            cells: [
              { text: head.name, sub: head.notes },
              dist ? `${head.share_percent}%` : '—',
              dist
                ? range(head.rate_low, head.rate_high)
                : range(head.items_total_low, head.items_total_high),
              ...(withAmount ? [range(head.amount_low, head.amount_high)] : []),
            ],
          })),
          {
            key: 'total',
            variant: 'total',
            cells: [
              'Total',
              dist ? `${plan.share_total}%` : '—',
              dist
                ? range(plan.rate_low, plan.rate_high, plan.upper_open)
                : range(plan.total_low, plan.total_high),
              ...(withAmount ? [range(plan.total_low, plan.total_high, plan.upper_open)] : []),
            ],
          },
        ],
      ),
      ...plan.cost_heads
        .filter((head) => head.items.length)
        .map((head) =>
          t(
            ['Item & specification', 'Qty', 'Unit', 'Rate', 'Amount'],
            '1fr 14mm 16mm 32mm 34mm',
            [
              ...head.items.map((item, i) => ({
                key: i,
                cells: [
                  { text: item.name, sub: [item.specification, item.notes].filter(has).join('\n') },
                  String(item.quantity ?? ''),
                  item.unit,
                  range(item.rate_low, item.rate_high),
                  range(item.amount_low, item.amount_high),
                ],
              })),
              {
                key: 'sub',
                variant: 'total',
                cells: [
                  'Items subtotal',
                  '',
                  '',
                  '',
                  range(head.items_total_low, head.items_total_high),
                ],
              },
            ],
            {
              headNode: (
                <Eyebrow style={{ margin: '6.4mm 0 2.2mm' }}>
                  {`${head.name} — dedicated items`.toUpperCase()}
                </Eyebrow>
              ),
            },
          ),
        ),
    ];
    if (dist && plan.cost_heads.some((head) => head.items.length))
      blocks.push(
        <p key="dn" className="wd-sbg-small">
          Dedicated item subtotals are shown separately. They are not added to the percentage
          distribution.
        </p>,
      );
    sections.push({ unnumbered: true, blocks });
    sections.push({
      unnumbered: true,
      blocks: [
        <Heading key="h" eyebrow={plan.name.toUpperCase()} title="Material Rate Schedule" />,
        plan.materials.length ? (
          t(
            ['Category', 'Brand / Make', 'Indicative rate'],
            '37mm 72.3mm 1fr',
            plan.materials.map((row, i) => ({
              key: i,
              cells: [
                row.category,
                {
                  text: row.brand_make,
                  sub: [row.specification, row.notes].filter(has).join('\n'),
                },
                `${range(row.rate_low, row.rate_high)}${has(row.unit) ? ` per ${row.unit === 'sq.ft.' ? 'sq. ft.' : row.unit}` : ''}${row.fitted ? ', fitted' : ''}`,
              ],
            })),
          )
        ) : (
          <p key="none" className="wd-sbg-p">
            Material schedule to be completed.
          </p>
        ),
      ],
    });
  });

  if ((guide.pricing_notes || []).length)
    sections.push({
      unnumbered: true,
      blocks: [
        <Heading key="h" eyebrow="REFERENCE" title="How We Price" />,
        t(
          ['Head', 'Note'],
          '50mm 1fr',
          guide.pricing_notes.map((note, i) => ({
            key: i,
            cells: [{ text: note.heading, className: 'wd-sbg-green' }, note.text],
          })),
        ),
      ],
    });
  sections.push({
    unnumbered: true,
    blocks: [
      <div key="h" style={{ paddingTop: '13mm' }}>
        <Heading eyebrow="NEXT STEPS" title="What Happens Next" />
      </div>,
      (guide.next_steps || []).length > 0 &&
        t(
          ['Step', ''],
          '50mm 1fr',
          guide.next_steps.map((note, i) => ({
            key: i,
            cells: [
              {
                text: (
                  <>
                    <b className="wd-sbg-stepno">{i + 1}.</b>
                    {note.heading}
                  </>
                ),
                className: 'wd-sbg-green wd-sbg-step',
              },
              { text: note.text, className: 'wd-sbg-small' },
            ],
          })),
          { className: 'wd-table--open wd-sbg-t wd-sbg-steps', keepWhole: true },
        ),
      <div key="q" style={{ marginTop: '14mm' }}>
        <Eyebrow style={{ marginBottom: '2.6mm' }}>HOLDING ANOTHER QUOTATION?</Eyebrow>
        <p className="wd-sbg-p">
          Bring it. We will place our specification sheet beside it and identify, head by head,
          where the two differ. A lower headline rate is usually a different specification rather
          than a better price — and it is more useful to you to see where, than to hear us argue
          about our figure.
        </p>
      </div>,
      {
        keep: (
          <p key="v" className="wd-sbg-closing">
            This guide is valid for {guide.validity_months} months from the date of issue.
            Indicative rates are subject to revision based on prevailing market conditions.
            {guide.rate_validity_days
              ? ` Rates hold for ${guide.rate_validity_days} days from issue.`
              : ''}
          </p>
        ),
      },
    ].filter(Boolean),
  });
  return sections;
}

export const BudgetGuideDocument = forwardRef(function BudgetGuideDocument({ guide }, ref) {
  const sections = useMemo(() => buildGuideSections(guide), [guide]);
  return (
    <PrintDocument
      ref={ref}
      variant="word"
      className="wd-sbg"
      docType="Specification & Budget Guide"
      footerLabel={'\u200b'}
      numbered={false}
      bodyHeight={252}
      title={guide.title}
      wordCover={{
        title: 'SPECIFICATION & BUDGET GUIDE',
        className: 'wd-sbg-cover',
        logoWidth: 39.5,
        logoTop: 117,
      }}
      sections={sections}
    />
  );
});

export default function BudgetGuidePreview() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { user } = useAuth();
  const recordInfo = useRecordInfo('budget-guide', id);
  const canRead = user?.permissions?.includes('budget-guides:read');
  const canCopy =
    canRead &&
    user?.permissions?.includes('budget-guides:create') &&
    user?.permissions?.includes('projects:read');
  const [projectId, setProjectId] = useState('');
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const [transfer, transferring] = useTransferBudgetGuideMutation();
  const projectQuery = useGetProjectsQuery(undefined, { skip: !canCopy });
  const projects = Array.isArray(projectQuery.data)
    ? projectQuery.data
    : projectQuery.data?.items || projectQuery.data?.data || [];
  const { data, isLoading, isError, error, refetch } = useGetBudgetGuideQuery(id, {
    skip: !canRead,
  });
  return (
    <div className="bg-preview-shell">
      <PageHeader
        crumbs={[
          { label: 'Budget Guide', to: '/ledger/budget-guides/all' },
          { label: data?.title || 'Budget Guide' },
        ]}
        title={data?.title || 'Budget Guide'}
        info={recordInfo}
        actions={
          <>
            {user?.permissions?.includes('budget-guides:update') && (
              <Button icon={Pencil} onClick={() => navigate(`/ledger/budget-guides/${id}/edit`)}>
                Edit guide
              </Button>
            )}
            <Button
              variant="primary"
              icon={Download}
              disabled={!data}
              loading={downloading}
              onClick={() =>
                download(
                  pdfFileName(
                    'Budget-Guide',
                    data?.project?.name || data?.title,
                    data?.revision || 1,
                  ),
                  {
                    title: `Budget Guide — ${data?.title || ''}`,
                    label: 'budget guide',
                  },
                )
              }
            >
              Download PDF
            </Button>
          </>
        }
      />
      {canRead && (
        <RecordContext
          type="budget-guide"
          id={id}
          deleteArg={data ? { id, revision: data.revision } : undefined}
        />
      )}
      {data && canCopy && (
        <div className="bg-preview-actions">
          <details>
            <summary>Copy this guide to a project</summary>
            <p>The original remains unchanged; the project gets an independent draft.</p>
            <div className="bg-toolbar">
              <select
                className="inos-input"
                aria-label="Copy destination project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Choose a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                disabled={!projectId}
                loading={transferring.isLoading}
                onClick={async () => {
                  try {
                    const copy = await transfer({
                      id,
                      body: {
                        project_id: projectId,
                        expected_revision: data.revision,
                      },
                    }).unwrap();
                    toast.success('Project copy created');
                    setProjectId('');
                    navigate(
                      `/ledger/budget-guides/${copy.id}${user?.permissions?.includes('budget-guides:update') ? '/edit' : ''}`,
                    );
                  } catch (e) {
                    toast.error(e?.data?.message || 'Could not create project copy');
                  }
                }}
              >
                Create project copy
              </Button>
            </div>
            {projectQuery.isError && (
              <p role="alert">
                Could not load projects. <Button onClick={projectQuery.refetch}>Retry</Button>
              </p>
            )}
          </details>
        </div>
      )}
      {!canRead ? (
        <Card>You need budget guide read permission.</Card>
      ) : isLoading ? (
        <Card>Loading guide…</Card>
      ) : isError ? (
        <Card>
          <p role="alert">
            {error?.data?.message || 'Could not load guide'}{' '}
            <Button onClick={refetch}>Retry</Button>
          </p>
        </Card>
      ) : (
        data && (
          <>
            {!!data.calculation?.warnings?.length && (
              <div className="bg-preview-actions" role="status">
                <Card>
                  {data.calculation.warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </Card>
              </div>
            )}
            <DocumentPreview>
              <BudgetGuideDocument ref={docRef} guide={data} />
            </DocumentPreview>
            <VersionHistory type="budget-guide" id={id} />
          </>
        )
      )}
    </div>
  );
}
