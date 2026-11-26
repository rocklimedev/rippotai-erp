// Client Brief — a filled copy of the user's CLIENT BRIEF TEMPLATE.docx (Word family of the
// print kit, components/print-document/word.jsx). Optional fields print with their answers.
// Users & lifestyle and Sign-off keep their template formatting.
import { forwardRef, useMemo } from 'react';
import { resolveSite, projectTypeAnswer, siteConditionAnswer } from './site-options';
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
        omitEmpty
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
      has(projectTypeAnswer(site)) && (
        <div key="pt">
          <WSub>Project type &amp; site type</WSub>
          <ProjectTypeGrid site={site} />
        </div>
      ),
      has(siteConditionAnswer(site)) && (
        <div key="sc">
          <WSub>Site condition</WSub>
          <SiteConditionGrid site={site} />
        </div>
      ),
    ],
  });

  /* 02 — Site & property details */
  const area = has(brief.siteArea)
    ? `${Number(brief.siteArea).toLocaleString('en-IN')} ${
        brief.siteAreaUnit === 'OTHER'
          ? brief.siteAreaOtherUnit || ''
          : UNIT[brief.siteAreaUnit] || ''
      }`.trim()
    : '';
  const docTypes = new Set(listOf(brief.documents, 'documentType'));
  if (has(brief.drawingsAvailable))
    docTypes.add(LEGACY_DRAWING[brief.drawingsAvailable] || brief.drawingsAvailable);
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
        omitEmpty
        key="f"
        labelSize={6.5}
        items={[
          { label: 'Site address', value: brief.siteAddress || project.site_location },
          { label: 'Parking Provision', value: brief.parkingProvision },
          { label: 'Property type', value: brief.projectType?.name || project.project_type?.name },
          { label: 'Ownership Status', value: brief.ownershipStatus },
          { label: 'Site Area (sq ft / gaj)', value: area },
          {
            label: 'Number Of Floors',
            value: has(brief.numberOfFloors) ? String(brief.numberOfFloors) : '',
          },
          { label: 'Facing / Orientation', value: cap(brief.facingOrientation) },
          { label: 'Lift Available', value: yesNo(brief.liftAvailable) },
        ]}
      />,
      (DRAWINGS.some(([type]) => docTypes.has(type)) || has(drawingsOther) || files.length > 0) && (
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
        </div>
      ),
    ],
  });

  /* 03 — Scope of work */
  const works = new Set(listOf(brief.workTypes, 'workType'));
  const services = new Set(listOf(brief.services, 'serviceType'));
  const procurement = (brief.procurementCategories || []).map((p) => p.category);
  const procOther = (brief.procurementCategories || [])
    .filter((p) => p.category === 'OTHER')
    .map((p) => p.otherDescription)
    .filter(has);
  const ticked = (on, group) =>
    on.some((c) => procurement.includes(c)) ||
    (group.parent &&
      procurement.includes(group.parent) &&
      !group.items.some(([, o]) => o.some((c) => procurement.includes(c))) &&
      on.length > 0);
  const procGroups = PROCUREMENT_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.filter(([, on]) => ticked(on, group)).map(([label]) => label),
  })).filter(({ items }) => items.length);
  const hasLandscape = services.has('LANDSCAPE_DESIGN');
  sections.push({
    title: 'Scope of work',
    blocks: [
      (WORK_TYPES.some(([type]) => works.has(type)) ||
        has(brief.workTypeOther) ||
        works.has('OTHER')) && (
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
        </div>
      ),
      (SERVICES.some(([type]) => services.has(type)) ||
        has(brief.servicesOther) ||
        services.has('OTHER')) && (
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
        </div>
      ),
      (procGroups.length > 0 || procOther.length > 0 || hasLandscape) && (
        <div key="pc" className="wd-proc">
          <WSub>Material procurement</WSub>
          {procGroups.length > 0 && (
            <div className="wd-proc__columns">
              {procGroups.map(({ title, items }) => (
                <div key={title}>
                  <strong>{title}</strong>
                  <ul className="wd-proc__items">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {procOther.length > 0 && (
            <div>
              <strong>Other</strong>
              <ul className="wd-proc__items">
                {procOther.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {hasLandscape && (
            <ul className="wd-proc__items">
              <li>Landscape (separate scope — see Scope of Work)</li>
            </ul>
          )}
        </div>
      ),
      [
        brief.areasIncludedInScope,
        brief.areasExcludedFromScope,
        brief.workAlreadyDoneByOthers,
      ].some(has) && (
        <div key="scope-boundaries" style={{ paddingTop: '6mm' }}>
          <WSub style={{ marginBottom: '3mm' }}>Scope boundaries</WSub>
          <WLabelTable
            omitEmpty
            labelTone="green"
            minHeight={10}
            rows={[
              { label: 'Areas included in scope', value: brief.areasIncludedInScope },
              { label: 'Areas excluded from scope', value: brief.areasExcludedFromScope },
              { label: 'Work already done by others', value: brief.workAlreadyDoneByOthers },
            ]}
          />
        </div>
      ),
    ],
  });

  /* 04 — Users & lifestyle */
  const occupants = bySort(brief.occupants).filter(
    (r) => has(r.name) || has(r.specificNeedsPreferences),
  );
  sections.push({
    title: 'Users & lifestyle',
    blocks: [
      <WIntro key="i">
        Everyone who will use the space, and what each of them needs from it.
      </WIntro>,
      {
        table: {
          skin: 'word',
          cols: ['Name & relation', 'Specific needs or preferences'],
          template: '57mm 1fr',
          items: padRows(
            occupants.map((r, i) => ({
              key: r.id || i,
              cells: [[r.name, r.relationship].filter(has).join(' — '), r.specificNeedsPreferences],
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
      spaces.length > 0 && (
        <WIntro key="i">
          Space by space, in the client’s own words. Anything not recorded here is not part of the
          brief.
        </WIntro>
      ),
      spaces.length > 0 && {
        table: {
          skin: 'word',
          className: 'wd-thead--lg',
          cols: ['Space', 'Requirements'],
          template: '57mm 1fr',
          allowSplit: true,
          items: spaces.map((r, i) => ({
            key: r.id || i,
            cells: [
              {
                text: r.spaceName,
                sub: Number(r.quantity) > 1 ? `Quantity: ${qty(r.quantity)}` : '',
              },
              { text: r.requirementDetails, sub: r.notes },
            ],
          })),
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
      (STYLES.some(([style]) => styles.has(style)) || styles.has('OTHER') || has(styleOther)) && (
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
        </div>
      ),
      ([
        brief.vastuRequirements,
        brief.coloursToAvoid,
        brief.coloursPreferred,
        brief.materialsDislikedHardNo,
        brief.materialsLiked,
        brief.mustHaveElements,
        MAINTENANCE[brief.maintenanceAppetite],
      ].some(has) ||
        refs.length > 0) && (
        <div key="pr" style={{ marginTop: '1mm' }}>
          <WSub style={{ marginBottom: '16.4mm' }}>Preferences</WSub>
          <WLabelTable
            omitEmpty
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
        </div>
      ),
    ],
  });

  /* 07 — Budget */
  const budget = Number(brief.initialClientBudget) || 0;
  const money = budget > 0 ? inr(budget) : null;
  sections.push({
    title: 'Budget',
    blocks: [
      (money || has(brief.fundingStage) || has(brief.budgetFlexibility)) && (
        <div key="b">
          <WLabelTable
            omitEmpty
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
                value:
                  BUDGET_RANGES.find(([, lo, hi]) => budget >= lo && budget < hi)?.[0] ??
                  (money ? money.short : ''),
              },
              {
                label: 'Funding stage — self-funded or loan',
                value: brief.fundingStage,
                minHeight: 19.9,
              },
              { label: 'Flexibility discussed', value: brief.budgetFlexibility, minHeight: 19.6 },
            ]}
          />
          <div className="wd-goldrule" style={{ marginTop: '12.9mm' }} />
          <WIntro style={{ marginTop: '3mm' }}>
            Recorded as stated by the client at briefing stage. It is not a quotation and does not
            bind either party until the BOQ is priced and frozen.
          </WIntro>
        </div>
      ),
    ],
  });

  /* 08 — Timeline */
  const tl = brief.expectedTimeline || '';
  const tlHit = TIMELINES.find(([, re]) => re.test(tl));
  const hasTimelineFields =
    [
      brief.desiredStartDate,
      brief.siteHandoverDate,
      brief.targetCompletionDate,
      tl,
      brief.deadlineReason,
    ].some(has) || brief.phasingRequired != null;
  const phases = bySort(brief.phases).filter((p) => has(p.phaseName));
  sections.push({
    title: 'Timeline',
    blocks: [
      hasTimelineFields && (
        <div key="t" className="wd-twocol">
          <div>
            <WFields
              omitEmpty
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
            {has(tl) && (
              <>
                <span className="wd-field__label" style={{ fontSize: '6.5pt' }}>
                  Expected timeline
                </span>
                <WAnswer value={tlHit ? tlHit[0] : tl} style={{ margin: '0 0 5mm' }} />
              </>
            )}
            <WFields
              omitEmpty
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
        </div>
      ),
      phases.length > 0 && (
        <WSub key="ph" style={{ marginTop: '11mm' }}>
          Phasing, if required
        </WSub>
      ),
      phases.length > 0 && {
        table: {
          skin: 'word',
          className: 'wd-table--open',
          cols: ['Phase', 'Start date', 'End date', 'Expected time'],
          template: '1fr 1fr 1fr 1fr',
          allowSplit: true,
          items: phases.map((p, i) => ({
            key: p.id || i,
            cells: [
              { text: p.phaseName, sub: [p.description, p.notes].filter(has).join(' · ') },
              fmtDate(p.startDate),
              fmtDate(p.endDate),
              p.expectedTime,
            ],
          })),
        },
      },
    ],
  });

  /* 09 — Approvals, constraints & site risks */
  const rest = Object.fromEntries(
    (brief.siteRestrictions || []).filter((r) => has(r.details)).map((r) => [r.type, r.details]),
  );
  const restrictionRows = RESTRICTIONS.map(([key, label]) => ({ label, value: rest[key] })).filter(
    ({ value }) => has(value),
  );
  sections.push({
    title: 'Approvals, constraints & site risks',
    blocks: [
      restrictionRows.length > 0 && (
        <WIntro key="i">
          Everything that could stop work at site. Recorded now so it is priced and programmed, not
          discovered later.
        </WIntro>
      ),
      restrictionRows.length > 0 && (
        <WLabelTable key="t" top={false} minHeight={12.3} labelTone="ink" rows={restrictionRows} />
      ),
      has(brief.householdNotes) && {
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

  return sections.map((section, index) => ({ ...section, no: String(index + 1).padStart(2, '0') }));
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
        omitEmpty: true,
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
