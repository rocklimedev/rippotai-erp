// Client Brief — a filled copy of the user's CLIENT BRIEF TEMPLATE.docx (Word family of the
// print kit, components/print-document/word.jsx): same cover, the same ten numbered sections
// on the same pages, every option list printed in full with the captured choices ticked, and
// blank lines kept where nothing was recorded. Fields INOS captures that the template lacks
// are added in the template's own style next to their closest template field.
import { forwardRef, useMemo } from 'react';
import { resolveSite } from './site-options';
import { ProjectTypeGrid, SiteConditionGrid } from './SiteOptionGrids';
import {
  PrintDocument,
  WSub,
  WIntro,
  WValue,
  WFields,
  WAnswer,
  WChecks,
  WLines,
  WLabelTable,
  coverRows,
  padRows,
  useProjectPeople,
  has,
  fmtDate,
  yesNo,
  listOf,
  bySort,
  inr,
} from '../print-document';

/* ------------------------------------------------------------ option sets (template order) */

const DRAWINGS = [
  ['SANCTIONED_PLAN', 'Sanctioned plan'],
  ['ARCHITECTURAL_DRAWINGS', 'Architectural drawings'],
  ['STRUCTURAL_DRAWINGS', 'Structural drawings'],
  ['MEP_LAYOUT', 'MEP layout'],
  ['COMPLETION_CERTIFICATE', 'Completion certificate'],
  ['SOCIETY_NOC', 'Society NOC'],
  ['PREVIOUS_DESIGNER_FILES', 'Previous designer files'],
  ['NOTHING_AVAILABLE', 'Nothing available'],
];
const LEGACY_DRAWING = {
  ARCHITECTURAL: 'ARCHITECTURAL_DRAWINGS',
  STRUCTURAL: 'STRUCTURAL_DRAWINGS',
  MEP: 'MEP_LAYOUT',
  NONE: 'NOTHING_AVAILABLE',
};
const LEGACY_DRAWING_LABEL = { WORKING: 'Working drawings', AS_BUILT: 'As-built drawings' };

const WORK_TYPES = [
  ['CONSULTANCY', 'Consultancy'],
  ['TURNKEY', 'Turnkey'],
  ['BUILDER_FINANCE', 'Builder Finance'],
  ['PMC_WORK', 'PMC Work'],
];
const SERVICES = [
  ['ARCHITECTURE_DESIGN', 'Architecture Design'],
  ['INTERIOR_DESIGN', 'Interior design'],
  ['EXECUTION', 'Execution'],
  ['MATERIAL_PROCUREMENT', 'Material Procurement'],
  ['LANDSCAPE_DESIGN', 'Landscape Design'],
  ['LABOUR_WORK', 'Labour Work'], // INOS option, not on the printed template
];

// "If material procurement" — the template's four groups. `on` lists the INOS procurement
// categories that tick the line (a broad INOS category ticks every line it covers).
const PROCUREMENT_GROUPS = [
  {
    title: 'Civil, MEP & Structure',
    items: [
      ['Cement', ['CIVIL_BUILDING_MATERIAL']],
      ['Reinforcement Steel', ['CIVIL_BUILDING_MATERIAL']],
      ['Rodi (Aggregate)', ['CIVIL_BUILDING_MATERIAL']],
      ['Pather', ['CIVIL_BUILDING_MATERIAL']],
      ['Dust (Sand)', ['CIVIL_BUILDING_MATERIAL']],
      ['Bricks', ['CIVIL_BUILDING_MATERIAL']],
      ['ACC Blocks', ['CIVIL_BUILDING_MATERIAL']],
      ['Metal Work', ['METAL_WORK']],
      ['Electrical Conduits', ['ELECTRICAL']],
      ['Electrical Wiring', ['ELECTRICAL']],
      ['Electrical Boxes', ['ELECTRICAL']],
      ['Electrical Switch Plates', ['ELECTRICAL']],
      ['Plumbing Pipes', ['PLUMBING']],
      ['AC Piping & Drainage', ['AC_PIPING_DRAINAGE']],
      ['Networking (CAT6 / CAT9)', ['NETWORKING']],
      ['Chemicals & Adhesives', ['CHEMICALS_ADHESIVES']],
    ],
  },
  {
    title: 'Interior (Mill Work / Hardware etc.)',
    items: [
      ['Doors', ['DOORS']],
      ['Chaukhats (Door & Window Frames)', ['CHAUKHATS']],
      ['Hardware', ['HARDWARE']],
      ['Ply & Wood', ['PLY_WOOD']],
      ['Paints and Polishes', ['PAINTS_POLISHES']],
      ['Glass Work — Looking Mirror', []],
      ['Soft Furnishing — Sofas, Curtains, Bed Covers', []],
      ['Artefacts', []],
    ],
  },
  {
    title: 'Facade (FRP / Metal / Surfaces etc.)',
    items: [
      ['FRP', ['FRP']],
      ['Metal', ['FACADE_METAL']],
      ['Micro Concrete', ['MICRO_CONCRETE']],
      ['Tiles', ['FACADE_TILES']],
      ['Windows — Wooden / UPVC / Aluminium', []],
    ],
    parent: 'FACADE_WORK',
  },
  {
    title: 'Material (Tiles / Sanitary / Lights / Appliances)',
    items: [
      ['Tiles (Flooring & Wall)', ['TILES']],
      ['Stone — Marble', ['MARBLE']],
      ['Stone — Granite', ['GRANITE']],
      ['Stone — Kota', []],
      ['Stone — Nano Slabs', []],
      ['Sanitary', ['SANITARY']],
      ['CP Fittings', ['CP_FITTINGS']],
      ['Light Fixtures', []],
      ['Appliances', []],
    ],
    parent: 'STONE',
  },
];

const STYLES = [
  ['CONTEMPORARY', 'Contemporary'],
  ['MINIMAL', 'Minimal'],
  ['CLASSIC_TRADITIONAL', 'Classic / Traditional'],
  ['INDIAN_CONTEMPORARY', 'Indian contemporary'],
  ['INDUSTRIAL', 'Industrial'],
  ['MID_CENTURY', 'Mid-century'],
  ['LUXE_OPULENT', 'Luxe / Opulent'],
  ['WARM_RUSTIC', 'Warm rustic'],
];

const BUDGET_RANGES = [
  ['50L to 1cr', 50e5, 1e7],
  ['1cr to 2cr', 1e7, 2e7],
  ['2cr to 5cr', 2e7, 5e7],
  ['5cr to 8cr', 5e7, 8e7],
  ['8cr to 10cr', 8e7, 1e8],
];

const TIMELINES = [
  ['3-6 MONTHS', /^\s*3\s*[-–to]+\s*6/i],
  ['6-12 MONTHS', /^\s*6\s*[-–to]+\s*12/i],
  ['12-18 MONTHS', /^\s*12\s*[-–to]+\s*18/i],
  ['FLEXIBLE', /flex/i],
];

const RESTRICTIONS = [
  ['societyRwaPermittedWorkTimings', 'Society / RWA permitted work timings'],
  ['nocOrSecurityDepositRequired', 'NOC or security deposit required'],
  ['structuralChangesPermitted', 'Structural changes permitted'],
  ['materialMovementRestrictions', 'Material movement restrictions (lift, staircase, hours)'],
  ['neighbourSensitivities', 'Neighbour sensitivities'],
  ['powerAndWaterAvailability', 'Power and water availability at site'],
  ['accessStorageDebrisDisposal', 'Access, storage and debris disposal'],
  ['toiletFacilityAndLabourStay', 'Toilet facility and stay for labour'],
  ['ongoingWorkByOtherAgencies', 'Ongoing work by other agencies'],
];

const MAINTENANCE = {
  HIGH: 'High — happy to maintain delicate finishes',
  MEDIUM: 'Medium — some upkeep is fine',
  LOW: 'Low — easy-care materials preferred',
};
const UNIT = { SQ_FT: 'sq ft', SQ_M: 'sq m', GAJ: 'gaj' };

const qty = (q) => (has(q) ? String(Number(q) || q).replace(/\.0+$/, '') : '');
const cap = (v) =>
  has(v)
    ? String(v)
        .toLowerCase()
        .split('_')
        .map((p, i) => (i === 0 ? p[0].toUpperCase() + p.slice(1) : p))
        .join('-')
    : '';

/* ------------------------------------------------------------ sections */

export function buildBriefSections(brief) {
  const project = brief.project || {};
  const client = project.client || {};
  const site = resolveSite({
    category: brief.projectCategory,
    projectTypeName: brief.projectType?.name,
    siteType: brief.siteType,
    siteTypeOther: brief.siteTypeOther,
    siteCondition: brief.siteCondition,
    siteConditionOther: brief.siteConditionOther,
  });

  const sections = [];

  /* 01 — Client & contact */
  sections.push({
    title: 'Client & contact',
    blocks: [
      <WFields
        key="f"
        items={[
          { label: 'Client name', value: client.name },
          { label: 'Project name', value: project.name },
          {
            label: 'Contact person',
            value: client.contact_person !== client.name ? client.contact_person : '',
          },
          { label: 'Relationship to client', value: brief.relationshipToClient },
          { label: 'Mobile', value: client.phone },
          { label: 'Referred by / Source', value: brief.referredBySource },
          { label: 'Email', value: client.email },
          { label: 'Date of Brief', value: fmtDate(brief.briefDate) },
        ]}
      />,
      <div key="pt">
        <WSub>Project type &amp; site type</WSub>
        <ProjectTypeGrid site={site} />
      </div>,
      <div key="sc">
        <WSub>Site condition</WSub>
        <SiteConditionGrid site={site} />
      </div>,
    ],
  });

  /* 02 — Site & property details */
  const area = has(brief.siteArea)
    ? `${Number(brief.siteArea).toLocaleString('en-IN')} ${
        brief.siteAreaUnit === 'OTHER' ? brief.siteAreaOtherUnit || '' : UNIT[brief.siteAreaUnit] || ''
      }`.trim()
    : '';
  const docTypes = new Set(listOf(brief.documents, 'documentType'));
  if (has(brief.drawingsAvailable)) docTypes.add(LEGACY_DRAWING[brief.drawingsAvailable] || brief.drawingsAvailable);
  const drawingsOther = [
    ...[...docTypes].map((d) => LEGACY_DRAWING_LABEL[d]).filter(Boolean),
    ...(has(brief.drawingsOther) ? [brief.drawingsOther] : []),
  ].join(', ');
  const files = [
    ...(brief.documents || []).map((d) => d.documentName),
    ...(brief.attachments || []).map((a) => a.name),
  ].filter(has);
  sections.push({
    title: 'Site & property details',
    blocks: [
      <WFields
        key="f"
        labelSize={6.5}
        items={[
          { label: 'Site address', value: brief.siteAddress || project.site_location },
          { label: 'Parking Provision', value: brief.parkingProvision },
          { label: 'Property type', value: brief.projectType?.name || project.project_type?.name },
          { label: 'Ownership Status', value: brief.ownershipStatus },
          { label: 'Site Area (sq ft / gaj)', value: area },
          { label: 'Number Of Floors', value: has(brief.numberOfFloors) ? String(brief.numberOfFloors) : '' },
          { label: 'Facing / Orientation', value: cap(brief.facingOrientation) },
          { label: 'Lift Available', value: yesNo(brief.liftAvailable) },
        ]}
      />,
      <div key="dr">
        <WSub>Drawings and documents available with the client</WSub>
        <WChecks
          cols={3}
          gap={1.6}
          style={{ rowGap: '0.6mm' }}
          items={[
            ...DRAWINGS.map(([v, label]) => ({ label, checked: docTypes.has(v) })),
            { label: 'Other', other: true, value: drawingsOther, checked: has(drawingsOther) },
          ]}
        />
        {files.length > 0 && <WIntro>Files on record: {files.join(' · ')}</WIntro>}
      </div>,
    ],
  });

  /* 03 — Scope of work */
  const works = new Set(listOf(brief.workTypes, 'workType'));
  const services = new Set(listOf(brief.services, 'serviceType'));
  const procurement = (brief.procurementCategories || []).map((p) => p.category);
  const procOther = (brief.procurementCategories || [])
    .filter((p) => p.category === 'OTHER')
    .map((p) => p.otherDescription)
    .filter(has)
    .join(', ');
  const ticked = (on, group) =>
    on.some((c) => procurement.includes(c)) ||
    (group.parent &&
      procurement.includes(group.parent) &&
      !group.items.some(([, o]) => o.some((c) => procurement.includes(c))) &&
      on.length > 0);
  // Only the chosen materials, one line per template group.
  const procLines = [
    ...PROCUREMENT_GROUPS.map((g) => {
      const picked = g.items.filter(([, on]) => ticked(on, g)).map(([label]) => label);
      return picked.length ? `${g.title}: ${picked.join(', ')}` : null;
    }),
    has(procOther) ? `Other: ${procOther}` : null,
    services.has('LANDSCAPE_DESIGN') ? 'Landscape (separate scope — see Scope of Work)' : null,
  ].filter(Boolean);
  sections.push({
    title: 'Scope of work',
    blocks: [
      <div key="tw">
        <WSub size={8}>Type of work</WSub>
        <WChecks
          gap={1.6}
          items={[
            ...WORK_TYPES.map(([v, label]) => ({ label, checked: works.has(v) })),
            ...(has(brief.workTypeOther) || works.has('OTHER')
              ? [{ label: 'Other', other: true, value: brief.workTypeOther, checked: true }]
              : []),
          ]}
        />
      </div>,
      <div key="sv" style={{ marginTop: '5mm' }}>
        <WSub size={8}>Services required</WSub>
        <WChecks
          gap={1.6}
          items={[
            ...SERVICES.map(([v, label]) => ({ label, checked: services.has(v) })),
            ...(has(brief.servicesOther) || services.has('OTHER')
              ? [{ label: 'Other', other: true, value: brief.servicesOther, checked: true }]
              : []),
          ]}
        />
      </div>,
      <div key="pc" className="wd-proc">
        <WSub>Material procurement</WSub>
        <WAnswer value={procLines} style={{ marginBottom: '8mm' }} />
      </div>,
      {
        newPage: true,
        node: (
          <div style={{ paddingTop: '30.5mm' }}>
            <WSub style={{ marginBottom: '6.6mm' }}>Scope boundaries</WSub>
            <WLabelTable
              labelTone="green"
              rows={[
                { label: 'Areas included in scope', value: brief.areasIncludedInScope, minHeight: 59 },
                { label: 'Areas excluded from scope', value: brief.areasExcludedFromScope, minHeight: 71.5 },
                { label: 'Work already done by others', value: brief.workAlreadyDoneByOthers, minHeight: 65.3 },
              ]}
            />
          </div>
        ),
      },
    ],
  });

  /* 04 — Users & lifestyle */
  const occupants = bySort(brief.occupants).filter((r) => has(r.name) || has(r.specificNeedsPreferences));
  sections.push({
    title: 'Users & lifestyle',
    blocks: [
      <WIntro key="i">Everyone who will use the space, and what each of them needs from it.</WIntro>,
      {
        table: {
          skin: 'word',
          cols: ['Name & relation', 'Specific needs or preferences'],
          template: '57mm 1fr',
          items: padRows(
            occupants.map((r, i) => ({
              key: r.id || i,
              cells: [
                [r.name, r.relationship].filter(has).join(' — '),
                r.specificNeedsPreferences,
              ],
            })),
            7,
            2,
          ),
        },
      },
    ],
  });

  /* 05 — Space requirements */
  const spaces = bySort(brief.spaceRequirements).filter(
    (r) => has(r.spaceName) || has(r.requirementDetails),
  );
  sections.push({
    title: 'Space requirements',
    blocks: [
      <WIntro key="i">
        Space by space, in the client’s own words. Anything not recorded here is not part of the brief.
      </WIntro>,
      {
        table: {
          skin: 'word',
          className: 'wd-thead--lg',
          cols: ['Space', 'Requirements'],
          template: '57mm 1fr',
          allowSplit: true,
          items: padRows(
            spaces.map((r, i) => ({
              key: r.id || i,
              cells: [
                {
                  text: r.spaceName,
                  sub: Number(r.quantity) > 1 ? `Quantity: ${qty(r.quantity)}` : '',
                },
                { text: r.requirementDetails, sub: r.notes },
              ],
            })),
            11,
            2,
          ),
        },
      },
    ],
  });

  /* 06 — Design direction & preferences (optional) */
  const styles = new Set((brief.styleDirections || []).map((s) => s.styleDirection));
  const styleOther = (brief.styleDirections || [])
    .filter((s) => s.styleDirection === 'OTHER')
    .map((s) => s.otherDescription)
    .filter(has)
    .join(', ');
  const refs = bySort(brief.references).filter(
    (r) => has(r.title) || has(r.description) || has(r.referenceUrl) || has(r.fileUrl),
  );
  sections.push({
    title: 'Design direction & preferences(optional)',
    blocks: [
      <div key="st">
        <WSub>Style direction</WSub>
        <WChecks
          gap={1.6}
          widths="51.3mm 51.3mm 1fr"
          items={[
            ...STYLES.map(([v, label]) => ({ label, checked: styles.has(v) })),
            { label: 'Other', other: true, value: styleOther, checked: styles.has('OTHER') },
          ]}
        />
      </div>,
      <div key="pr" style={{ marginTop: '1mm' }}>
        <WSub style={{ marginBottom: '16.4mm' }}>Preferences</WSub>
        <WLabelTable
          minHeight={13.75}
          rows={[
            { label: 'Vastu requirements, if any', value: brief.vastuRequirements },
            { label: 'Colours to avoid', value: brief.coloursToAvoid },
            { label: 'Colours Preferred', value: brief.coloursPreferred },
            { label: 'Materials disliked — hard no', value: brief.materialsDislikedHardNo },
            { label: 'Material likes', value: brief.materialsLiked },
            { label: 'Must-have elements', value: brief.mustHaveElements },
            { label: 'Maintenance appetite', value: MAINTENANCE[brief.maintenanceAppetite] },
            {
              label: 'References shared by the client',
              value: refs.length ? (
                <div>
                  {refs.map((r, i) => (
                    <div key={r.id || i} style={{ marginTop: i ? '1.5mm' : 0 }}>
                      {[r.title, r.description].filter(has).join(' — ')}
                      {has(r.referenceUrl) && <span className="wd-muted"> {r.referenceUrl}</span>}
                      {has(r.fileUrl) && (
                        <img
                          src={r.fileUrl}
                          crossOrigin="anonymous"
                          alt={r.title || 'Reference image'}
                          className="wd-refimg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null,
            },
          ]}
        />
      </div>,
    ],
  });

  /* 07 — Budget */
  const budget = Number(brief.initialClientBudget) || 0;
  const money = budget > 0 ? inr(budget) : null;
  sections.push({
    title: 'Budget',
    blocks: [
      <div key="b">
        <WLabelTable
          top={false}
          labelWidth="62mm"
          minHeight={36.5}
          rows={[
            {
              label: (
                <>
                  Budget Range
                  {money && <WValue style={{ marginTop: '1.5mm' }}>{money.exact}</WValue>}
                </>
              ),
              value: BUDGET_RANGES.find(([, lo, hi]) => budget >= lo && budget < hi)?.[0] || '',
            },
            { label: 'Funding stage — self-funded or loan', value: brief.fundingStage, minHeight: 19.9 },
            { label: 'Flexibility discussed', value: brief.budgetFlexibility, minHeight: 19.6 },
          ]}
        />
        <div className="wd-goldrule" style={{ marginTop: '12.9mm' }} />
        <WIntro style={{ marginTop: '3mm' }}>
          Recorded as stated by the client at briefing stage. It is not a quotation and does not bind
          either party until the BOQ is priced and frozen.
        </WIntro>
      </div>,
    ],
  });

  /* 08 — Timeline */
  const tl = brief.expectedTimeline || '';
  const tlHit = TIMELINES.find(([, re]) => re.test(tl));
  const phases = bySort(brief.phases).filter((p) => has(p.phaseName));
  sections.push({
    title: 'Timeline',
    blocks: [
      <div key="t" className="wd-twocol">
        <div>
          <WFields
            cols={1}
            labelSize={6.5}
            gap={7}
            style={{ marginBottom: 0 }}
            items={[
              { label: 'Desired start date', value: fmtDate(brief.desiredStartDate) },
              {
                label: 'Phasing required (Y / N)',
                value: brief.phasingRequired == null ? '' : brief.phasingRequired ? 'Y' : 'N',
              },
              { label: 'Site handover date', value: fmtDate(brief.siteHandoverDate) },
              { label: 'Target completion', value: fmtDate(brief.targetCompletionDate) },
            ]}
          />
        </div>
        <div>
          <span className="wd-field__label" style={{ fontSize: '6.5pt' }}>
            Expected timeline
          </span>
          <WAnswer value={tlHit ? tlHit[0] : tl} style={{ margin: '0 0 5mm' }} />
          <WFields
            cols={1}
            labelSize={6.5}
            style={{ marginBottom: 0 }}
            items={[
              {
                label: 'Reason for the deadline (if any specific event or occasion)',
                value: brief.deadlineReason,
              },
            ]}
          />
        </div>
      </div>,
      <WSub key="ph" style={{ marginTop: '11mm' }}>
        Phasing, if required
      </WSub>,
      {
        table: {
          skin: 'word',
          className: 'wd-table--open',
          cols: ['Phase', 'Start date', 'End date', 'Expected time'],
          template: '1fr 1fr 1fr 1fr',
          allowSplit: true,
          items: padRows(
            phases.map((p, i) => ({
              key: p.id || i,
              cells: [
                { text: p.phaseName, sub: [p.description, p.notes].filter(has).join(' · ') },
                fmtDate(p.startDate),
                fmtDate(p.endDate),
                p.expectedTime,
              ],
            })),
            5,
            4,
          ),
        },
      },
    ],
  });

  /* 09 — Approvals, constraints & site risks */
  const rest = Object.fromEntries(
    (brief.siteRestrictions || []).filter((r) => has(r.details)).map((r) => [r.type, r.details]),
  );
  sections.push({
    title: 'Approvals, constraints & site risks',
    blocks: [
      <WIntro key="i">
        Everything that could stop work at site. Recorded now so it is priced and programmed, not
        discovered later.
      </WIntro>,
      <WLabelTable
        key="t"
        top={false}
        minHeight={12.3}
        labelTone="ink"
        rows={RESTRICTIONS.filter(
          ([k]) => k !== 'ongoingWorkByOtherAgencies' || has(rest[k]),
        ).map(([k, label]) => ({ label, value: rest[k] }))}
      />,
      {
        newPage: true,
        node: (
          <div>
            <WSub rule="none" style={{ fontSize: '6.5pt', marginBottom: '8.8mm' }}>
              Household notes
            </WSub>
            <WLines value={brief.householdNotes} count={6} lineHeight={11.1} />
          </div>
        ),
      },
    ],
  });

  /* 10 — Sign-off */
  sections.push({
    title: 'Sign-off',
    blocks: [
      <div key="s">
        <WIntro style={{ marginTop: '-4mm' }}>
          This brief is the basis of the design. Anything added after sign-off is a change of brief
          and carries its own cost and time implication.
        </WIntro>
        <WSub style={{ marginTop: '-2.6mm', marginBottom: '5.2mm' }}>
          Open points to close before design begins
        </WSub>
        <WLines value={brief.openPointsToClose} count={4} lineHeight={11.4} />
        <div style={{ height: '11.4mm' }} className="wd-goldrule" />
        <div className="wd-twocol wd-twocol--sign" style={{ marginTop: '12mm' }}>
          <WFields
            cols={1}
            labelSize={6.5}
            gap={7}
            items={[
              { label: 'BRIEF TAKEN BY', value: brief.briefTaker?.name },
              { label: 'DATE', value: fmtDate(brief.briefTakenDate) },
            ]}
          />
          {(brief.confirmedBy || has(brief.confirmedDate)) && (
            <WFields
              cols={1}
              labelSize={6.5}
              gap={7}
              items={[
                { label: 'CONFIRMED BY', value: brief.confirmedBy?.name },
                { label: 'DATE', value: fmtDate(brief.confirmedDate) },
              ]}
            />
          )}
        </div>
      </div>,
    ],
  });

  return sections;
}

/* ------------------------------------------------------------ document */

const ClientBriefDocument = forwardRef(function ClientBriefDocument({ brief, capturing }, ref) {
  const sections = useMemo(() => buildBriefSections(brief), [brief]);
  const project = brief.project || {};
  const client = project.client || {};
  const people = useProjectPeople(project.id || brief.projectId);

  return (
    <PrintDocument
      ref={ref}
      capturing={capturing}
      variant="word"
      docType="Client Brief"
      title={project.name || 'Project'}
      wordCover={{
        title: 'CLIENT BRIEF',
        className: 'wd-cover--client-brief',
        rows: coverRows({
          project: project.name,
          address: brief.siteAddress || project.site_location,
          client: client.name,
          architect: brief.principalArchitect || people.architect,
          lead: brief.projectLead || people.lead,
        }),
      }}
      sections={sections}
    />
  );
});

export default ClientBriefDocument;
