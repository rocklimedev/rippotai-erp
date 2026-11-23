import { appConfirm } from '@/lib/app-dialog';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
// Scope of Work — a filled copy of the user's SCOPE OF WORK TEMPLATE.docx (Word family of the
// print kit): cover, 01 Project details, 02 Work Type, scope summary, 03 Area-wise scope matrix,
// 04 Acceptance. Project type / site / services / procurement come from the project's brief.
import { useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit3, Trash2, Download, FileText } from 'lucide-react';
import { Page, PageHeader, Button, EmptyState } from '@/components/inos';
import {
  PrintDocument,
  DocumentPreview,
  usePdfDownload,
  pdfFileName,
  has,
  fmtDate,
  WSub,
  WValue,
  WFields,
  WAnswer,
  WChecks,
  WLines,
  WSign,
  coverRows,
  padRows,
  projectPeople,
} from '@/components/print-document';
import { resolveSite } from '@/components/brief-document/site-options';
import { ProjectTypeGrid, SiteConditionGrid } from '@/components/brief-document/SiteOptionGrids';
import { useGetLatestProjectBriefQuery } from '../../api/documents/brief.api';
import './scope-of-work-document.css';
import {
  useGetScopeOfWorkByIdQuery,
  useDeleteScopeOfWorkMutation,
} from '../../api/documents/scope-of-work.api';

// 02 Work Type — template order (two columns).
const WORK_TYPES = [
  ['CONSULTANCY', 'Consultancy'],
  ['TURNKEY', 'Turnkey'],
  ['BUILDER_FINANCE', 'Builder Finance'],
  ['PMC', 'PMC Work'],
];
const SERVICES = [
  ['ARCHITECTURE_DESIGN', 'Architecture Design'],
  ['INTERIOR_DESIGN', 'Interior design'],
  ['EXECUTION', 'Execution'],
  ['LABOUR_WORK', 'Labour Work'],
  ['LANDSCAPE_DESIGN', 'Landscape Design'],
  ['MATERIAL_PROCUREMENT', 'Material Procurement'],
];

// MATERIAL PROCUREMENT — the template's two columns. [label, INOS procurement category, level, gapBefore]
const PROC_ARCH = [
  ['Civil – Building Material', 'CIVIL_BUILDING_MATERIAL'],
  ['Cement', null, 1],
  ['Reinforcement', null, 1],
  ['Rodi', null, 1],
  ['Dust', null, 1],
  ['Pathar', null, 1],
  ['Metal Work', 'METAL_WORK'],
  ['AC piping & drainage', 'AC_PIPING_DRAINAGE'],
  ['Electrical', 'ELECTRICAL'],
  ['Plumbing', 'PLUMBING'],
  ['Networking', 'NETWORKING'],
  ['Tiles', 'TILES', 0, true],
  ['Sanitary', 'SANITARY'],
  ['CP fittings', 'CP_FITTINGS'],
  ['Chemicals & Adhesives', 'CHEMICALS_ADHESIVES'],
  ['Stone', 'STONE', 0, true],
  ['Marble', 'MARBLE', 1],
  ['Granite', 'GRANITE', 1],
  ['Kota', null, 1],
  ['Doors', 'DOORS'],
  ['Windows', null],
  ['Chaukhats', 'CHAUKHATS'],
  ['Hardware', 'HARDWARE'],
  ['Glass', null],
  ['Ply & Wood', 'PLY_WOOD'],
  ['Paints and Polishes', 'PAINTS_POLISHES'],
  ['Façade Work', 'FACADE_WORK'],
  ['FRP', 'FRP', 1],
  ['Metal', 'FACADE_METAL', 1],
  ['Micro concrete', 'MICRO_CONCRETE', 1],
  ['Tiles', 'FACADE_TILES', 1],
  ['Landscape & paving', null],
];
const PROC_INT = [
  ['Civil – Building Material (Rodi, Pather etc)', 'CIVIL_BUILDING_MATERIAL'],
  ['Metal Work', 'METAL_WORK'],
  ['AC piping & drainage', 'AC_PIPING_DRAINAGE'],
  ['Electrical', 'ELECTRICAL'],
  ['Plumbing', 'PLUMBING'],
  ['Networking', 'NETWORKING'],
  ['Tiles', 'TILES', 0, true],
  ['Sanitary', 'SANITARY'],
  ['CP fittings', 'CP_FITTINGS'],
  ['Chemicals & Adhesives', 'CHEMICALS_ADHESIVES'],
  ['Stone', 'STONE', 0, true],
  ['Marble', 'MARBLE', 1],
  ['Granite', 'GRANITE', 1],
  ['Doors', 'DOORS'],
  ['Chaukhats', 'CHAUKHATS'],
  ['Hardware', 'HARDWARE'],
  ['Ply & Wood', 'PLY_WOOD'],
  ['Paints and Polishes', 'PAINTS_POLISHES'],
  ['Façade Work', 'FACADE_WORK'],
  ['FRP', 'FRP', 1],
  ['Metal', 'FACADE_METAL', 1],
  ['Micro concrete', 'MICRO_CONCRETE', 1],
  ['Tiles', 'FACADE_TILES', 1],
];

const sortSpace = (a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0);

/**
 * sow: the scope of work. brief: the project's latest Client Brief (project type, site, services
 * and material procurement are captured there; the SOW template repeats them).
 */
export function buildSowSections(sow, brief) {
  const project = sow.project || {};
  const client = project.client || {};
  // Canonical project site area (autofill), converted to sq ft for the document.
  const areaSqft = has(project.total_area_sqft)
    ? project.total_area_sqft
    : has(project.site_area) && { SQ_FT: 1, GAJ: 9 }[project.site_area_unit || 'SQ_FT']
      ? Number(project.site_area) * { SQ_FT: 1, GAJ: 9 }[project.site_area_unit || 'SQ_FT']
      : has(brief?.siteArea) && { SQ_FT: 1, GAJ: 9 }[brief.siteAreaUnit || 'SQ_FT']
        ? Number(brief.siteArea) * { SQ_FT: 1, GAJ: 9 }[brief.siteAreaUnit || 'SQ_FT']
        : null;
  const site = resolveSite({
    category: brief?.projectCategory,
    projectTypeName: brief?.projectType?.name || project.project_type?.name,
    siteType: brief?.siteType,
    siteTypeOther: brief?.siteTypeOther,
    siteCondition: brief?.siteCondition,
    siteConditionOther: brief?.siteConditionOther,
  });
  const services = new Set((brief?.services || []).map((x) => x.serviceType));
  const procurement = new Set((brief?.procurementCategories || []).map((x) => x.category));
  const procOther = (brief?.procurementCategories || [])
    .filter((x) => x.category === 'OTHER')
    .map((x) => x.otherDescription)
    .filter(has)
    .join(', ');
  // Brief procurement is not split architecture / interior: tick it in the column of the design
  // service the client asked for (interior when interior design is in scope).
  const procCol =
    services.has('INTERIOR_DESIGN') && !services.has('ARCHITECTURE_DESIGN') ? 'int' : 'arch';
  // Only the chosen materials, under the design column the client asked for.
  const procPicked = (rows, col) =>
    rows
      .filter(([, cat]) => !!cat && procCol === col && procurement.has(cat))
      .map(([label]) => label);
  const procLines = [
    ...[
      ['Architecture', procPicked(PROC_ARCH, 'arch')],
      ['Interior', procPicked(PROC_INT, 'int')],
    ]
      .filter(([, list]) => list.length)
      .map(([head, list]) => `${head}: ${list.join(', ')}`),
    has(procOther) ? `Other: ${procOther}` : null,
  ].filter(Boolean);

  const sections = [];

  /* 01 — Project details */
  sections.push({
    title: 'Project details',
    blocks: [
      <WFields
        key="f"
        cols={2}
        style={{ gridTemplateColumns: '81.8mm 1fr' }}
        items={[
          { label: 'Project name', value: project.name },
          { label: 'Client name', value: client.name },
          { label: 'Site address', value: project.site_location || brief?.siteAddress },
          {
            label: 'Total area (sq ft)',
            value: has(areaSqft) ? Number(areaSqft).toLocaleString('en-IN') : '',
          },
          { label: 'Prepared by', value: sow.preparedByUser?.name },
          { label: 'Date', value: fmtDate(sow.createdAt) },
          { label: 'Reviewed by', value: sow.reviewedByUser?.name },
          { label: 'Version', value: has(sow.version) ? String(sow.version) : '' },
        ]}
      />,
      <div key="pt">
        <WSub style={{ marginTop: '17mm' }}>Project type &amp; site type</WSub>
        <ProjectTypeGrid site={site} />
      </div>,
      <div key="sc">
        <WSub>Site condition</WSub>
        <SiteConditionGrid site={site} itemGap={3.6} />
      </div>,
    ],
  });

  /* 02 — Work Type */
  sections.push({
    title: 'Work Type',
    headClass: 'wd-sec--plain',
    blocks: [
      <div key="wt" className="wd-sow-sage">
        <WChecks
          widths="80.8mm 1fr"
          gap={2.6}
          style={{ rowGap: '7.2mm', marginBottom: '26mm' }}
          items={WORK_TYPES.map(([v, label]) => ({ label, checked: sow.projectMode === v }))}
        />
        <WSub>Services required</WSub>
        <WChecks
          gap={2.6}
          style={{ rowGap: '5.7mm' }}
          items={[
            ...SERVICES.map(([v, label]) => ({ label, checked: services.has(v) })),
            ...(has(brief?.servicesOther)
              ? [{ label: 'Other', other: true, value: brief.servicesOther, checked: true }]
              : []),
          ]}
        />
      </div>,
      <div key="pc" className="wd-sow-sage">
        <WSub style={{ marginTop: '5.6mm' }}>Material procurement</WSub>
        <WAnswer value={procLines} style={{ marginBottom: '8mm' }} />
      </div>,
    ],
  });

  /* Scope summary + specific exclusions (unnumbered page of section 02 in the template) */
  const items = (sow.items || []).filter(
    (i) => i.scopeCategory && (has(i.scopeOfWork) || i.isExcluded || has(i.notes)),
  );
  const spaces = new Map();
  items.forEach((i) => {
    const sp = i.projectSpace || { id: 'general', name: 'General', sortOrder: 1e9 };
    if (!spaces.has(sp.id)) spaces.set(sp.id, { space: sp, inc: [], exc: [] });
    (i.isExcluded ? spaces.get(sp.id).exc : spaces.get(sp.id).inc).push(i.scopeCategory);
  });
  const catSort = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  const names = (list) =>
    [...new Map(list.map((c) => [c.id, c])).values()].sort(catSort).map((c) => c.name);
  const summaryRows = [...spaces.values()]
    .sort((a, b) => sortSpace(a.space, b.space))
    .map(({ space, inc, exc }) => ({
      key: space.id,
      cells: [
        space.name,
        {
          text: names(inc).join(', '),
          sub: exc.length ? `Not included: ${names(exc).join(', ')}` : '',
        },
      ],
    }));
  sections.push({
    title: null,
    unnumbered: true,
    newPage: true,
    blocks: [
      <div key="ss">
        <WSub className="wd-sow-sub--grey">Scope summary</WSub>
        {has(sow.scopeSummary) && (
          <WValue style={{ margin: '-4mm 0 4mm' }}>{sow.scopeSummary}</WValue>
        )}
      </div>,
      {
        table: {
          skin: 'word',
          className: 'wd-table--open wd-sow-sum',
          allowSplit: true,
          cols: ['Space', 'Scope of work'],
          template: '45.9mm 1fr',
          items: padRows(summaryRows, 8, 2),
        },
      },
      <div key="ex" style={{ marginTop: '20mm' }}>
        <WSub className="wd-sow-sub--grey" style={{ fontSize: '8pt' }}>
          Specific exclusions agreed
        </WSub>
        <WLines
          value={sow.specificExclusions}
          count={3}
          lineHeight={14.6}
          charsPerLine={100}
          style={{ marginTop: '-6mm' }}
        />
      </div>,
    ],
  });

  /* 03 — Area-wise scope matrix */
  const cats = new Map();
  items.forEach((i) => {
    const c = i.scopeCategory;
    if (!cats.has(c.id)) cats.set(c.id, { cat: c, items: [] });
    cats.get(c.id).items.push(i);
  });
  const catList = [...cats.values()].sort((a, b) => catSort(a.cat, b.cat));
  sections.push({
    title: 'Area-wise scope matrix',
    headClass: 'wd-sec--plain',
    blocks: catList.map(({ cat, items: list }, ci) => ({
      table: {
        skin: 'word',
        className: 'wd-table--open wd-sow-mx',
        allowSplit: true,
        headNode: (
          <div className="wd-sow-mx__cat" style={ci ? { marginTop: '14mm' } : undefined}>
            {cat.name}
          </div>
        ),
        contLabel: cat.name,
        cols: ['Space', 'Scope of work'],
        template: '45.9mm 1fr',
        items: [...list]
          .sort(
            (a, b) =>
              sortSpace(a.projectSpace, b.projectSpace) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
          )
          .map((i) => ({
            key: i.id,
            cells: [
              { text: i.projectSpace?.name || 'General', className: 'wd-sow-mx__space' },
              {
                text: (
                  <>
                    {i.scopeOfWork}
                    {i.isExcluded && <b> · Not included</b>}
                  </>
                ),
                sub: i.notes,
              },
            ],
          })),
      },
    })),
  });

  /* 04 — Acceptance */
  sections.push({
    title: 'Acceptance',
    headClass: 'wd-sec--plain',
    blocks: [
      <div key="acc" className="wd-sow-acc">
        <div>
          <WSub rule="none" className="wd-sow-notes">
            Notes
          </WSub>
          <WLines
            value={sow.notes}
            count={3}
            lineHeight={13}
            charsPerLine={100}
            style={{ marginTop: '-2mm' }}
          />
        </div>
        <div className="wd-sow-acc__sign">
          <WSign
            label="For Rippotai"
            lines={[
              'Authorised Signatory',
              { label: 'Name -', value: sow.reviewedByUser?.name || sow.preparedByUser?.name },
              { label: 'Date -', value: '' },
            ]}
          />
          <WSign
            label="Accepted by the client"
            lines={[
              'Client Signature',
              { label: 'Name -', value: sow.clientSignatureName || sow.acceptedByUser?.name },
              { label: 'Date -', value: fmtDate(sow.clientSignatureDate || sow.acceptedAt) },
            ]}
          />
        </div>
      </div>,
    ],
  });
  return sections;
}

export function ScopeOfWorkView() {
  const { id } = useParams();
  const recordInfo = useRecordInfo('scope-of-work', id);
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: sow, isFetching, isError } = useGetScopeOfWorkByIdQuery(id, { skip: !id });
  const [deleteScopeOfWork, { isLoading: deleting }] = useDeleteScopeOfWorkMutation();
  const { data: briefRes } = useGetLatestProjectBriefQuery(sow?.projectId, {
    skip: !sow?.projectId,
  });
  const brief = briefRes?.data ?? briefRes ?? null;
  const sections = useMemo(() => (sow ? buildSowSections(sow, brief) : []), [sow, brief]);

  const crumbs = [
    { label: 'CRM', to: '/crm' },
    { label: 'Scopes of work', to: '/crm/scope-of-work/all' },
    { label: 'Scope' },
  ];

  const remove = async () => {
    if (!(await appConfirm('Delete this scope of work? This cannot be undone.'))) return;
    try {
      await deleteScopeOfWork(id).unwrap();
      toast.success('Scope of work deleted');
      nav('/crm/scope-of-work/all');
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || 'Failed to delete');
    }
  };

  if (isFetching && !sow)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Scope of work" subtitle="Loading…" />
      </Page>
    );
  if (isError || !sow)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Scope of work" />
        <div className="inos-card">
          <EmptyState
            icon={FileText}
            title="Scope of work not found"
            text="It may have been deleted, or you don't have access to it."
          />
        </div>
      </Page>
    );

  const project = sow.project || {};
  const client = project.client || {};
  const projectName = project.name || 'Project';
  const version = sow.version || 1;

  return (
    <Page>
      <PageHeader
        info={recordInfo}
        crumbs={crumbs}
        title={projectName}
        actions={
          <>
            <Button variant="ghost" icon={Trash2} onClick={remove} disabled={deleting}>
              Delete
            </Button>
            <Button
              variant="secondary"
              icon={Edit3}
              onClick={() => nav(`/crm/forms/scope-of-work/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() =>
                download(pdfFileName('Scope-of-Work', projectName, version), {
                  title: `Scope of Work — ${projectName}`,
                  label: 'scope of work',
                })
              }
            >
              Download PDF
            </Button>
          </>
        }
      />
      <RecordContext type="scope-of-work" id={id} />
      <DocumentPreview>
        <PrintDocument
          ref={docRef}
          variant="word"
          className="wd-sow"
          docType="Scope of Work"
          footerLabel="SCOPE OF WORK"
          title={projectName}
          wordCover={{
            title: 'SCOPE OF WORK',
            className: 'wd-cover--stacked',
            logoWidth: 44,
            logoTop: 57,
            rowsTop: 240,
            rows: coverRows({
              project: projectName,
              address: project.site_location,
              client: client.name,
              ...projectPeople(project.team_members),
            }).map((row, i) => (i === 2 ? row.map((f) => ({ ...f, gold: true })) : row)),
          }}
          sections={sections}
        />
      </DocumentPreview>
      <VersionHistory type="scope-of-work" id={id} />
    </Page>
  );
}

export default ScopeOfWorkView;
