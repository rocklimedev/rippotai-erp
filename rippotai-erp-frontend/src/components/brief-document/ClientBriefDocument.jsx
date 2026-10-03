// Client Brief — the document we hand to the client.
// Built on the shared print kit (components/print-document): fixed Rippotai cover, then only
// the information that was actually captured, as plain text and small pills (no tick boxes).
import React, { forwardRef, useMemo } from "react";
import {
  PrintDocument, KV, kvHas, TextItem, Figure, Note, SignOff,
  has, fmtDate, yesNo, listOf, bySort, labelOf as labelIn,
} from "../print-document";

/* Labels for stored values */

const LABELS = {
  workType: { TURNKEY: "Turnkey", CONSULTANCY: "Consultancy", BUILDER_FINANCE: "Builder finance", PMC_WORK: "Project management (PMC)" },
  service: {
    ARCHITECTURE_DESIGN: "Architecture design",
    INTERIOR_DESIGN: "Interior design",
    EXECUTION: "Execution",
    LABOUR_WORK: "Labour work",
    LANDSCAPE_DESIGN: "Landscape design",
    MATERIAL_PROCUREMENT: "Material procurement",
  },
  procurement: {
    CIVIL_BUILDING_MATERIAL: "Civil & building material",
    METAL_WORK: "Metal work",
    AC_PIPING_DRAINAGE: "AC piping & drainage",
    ELECTRICAL: "Electrical",
    PLUMBING: "Plumbing",
    NETWORKING: "Networking",
    TILES: "Tiles",
    SANITARY: "Sanitary ware",
    CP_FITTINGS: "CP fittings",
    CHEMICALS_ADHESIVES: "Chemicals & adhesives",
    STONE: "Stone",
    MARBLE: "Marble",
    GRANITE: "Granite",
    DOORS: "Doors",
    CHAUKHATS: "Chaukhats",
    HARDWARE: "Hardware",
    PLY_WOOD: "Ply & wood",
    PAINTS_POLISHES: "Paints & polishes",
    FACADE_WORK: "Façade work",
    FRP: "FRP",
    FACADE_METAL: "Façade metal",
    MICRO_CONCRETE: "Micro concrete",
    FACADE_TILES: "Façade tiles",
  },
  style: {
    CONTEMPORARY: "Contemporary",
    MINIMAL: "Minimal",
    CLASSIC_TRADITIONAL: "Classic / traditional",
    INDIAN_CONTEMPORARY: "Indian contemporary",
    INDUSTRIAL: "Industrial",
    MID_CENTURY: "Mid-century",
    LUXE_OPULENT: "Luxe / opulent",
    WARM_RUSTIC: "Warm rustic",
  },
  siteType: { FLAT: "Flat", FLOOR: "Builder floor", KOTHI: "Kothi", RAW: "Raw / shell" },
  siteCondition: { OCCUPIED: "Occupied", UNOCCUPIED: "Unoccupied" },
  drawings: {
    ARCHITECTURAL: "Architectural drawings",
    STRUCTURAL: "Structural drawings",
    MEP: "MEP drawings",
    WORKING: "Working drawings",
    AS_BUILT: "As-built drawings",
    NONE: "None available",
    SANCTIONED_PLAN: "Sanctioned plan",
    ARCHITECTURAL_DRAWINGS: "Architectural drawings",
    STRUCTURAL_DRAWINGS: "Structural drawings",
    MEP_LAYOUT: "MEP layout",
    COMPLETION_CERTIFICATE: "Completion certificate",
    SOCIETY_NOC: "Society NOC",
    PREVIOUS_DESIGNER_FILES: "Previous designer files",
    NOTHING_AVAILABLE: "Nothing available",
  },
  unit: { SQ_FT: "sq ft", SQ_M: "sq m", GAJ: "gaj" },
  maintenance: {
    HIGH: "High — happy to maintain delicate finishes",
    MEDIUM: "Medium — some upkeep is fine",
    LOW: "Low — easy-care materials preferred",
  },
  restriction: {
    societyRwaPermittedWorkTimings: "Permitted work timings",
    nocOrSecurityDepositRequired: "NOC / security deposit",
    structuralChangesPermitted: "Structural changes",
    materialMovementRestrictions: "Material movement",
    neighbourSensitivities: "Neighbours",
    powerAndWaterAvailability: "Power & water",
    accessStorageDebrisDisposal: "Access, storage & debris",
    ongoingWorkByOtherAgencies: "Other agencies on site",
  },
};

const labelOf = (group, v) => labelIn(LABELS[group], v);

const facing = (v) =>
  has(v)
    ? String(v)
        .toLowerCase()
        .split("_")
        .map((p, i) => (i === 0 ? p[0].toUpperCase() + p.slice(1) : p))
        .join("-")
    : "";

const qty = (q) => (has(q) ? String(Number(q) || q).replace(/\.0+$/, "") : "");

/* =====================================================================
   Content
   ===================================================================== */

export function buildBriefSections(brief) {
  const project = brief.project || {};
  const client = project.client || {};
  const sections = [];

  // 1 — Client & project
  {
    const items = [
      { label: "Client", value: client.name, strong: true },
      { label: "Contact person", value: client.contact_person !== client.name ? client.contact_person : "" },
      { label: "Mobile", value: client.phone },
      { label: "Email", value: client.email },
      { label: "Correspondence address", value: client.address },
      { label: "Relationship to the project", value: brief.relationshipToClient },
      { label: "Project type", value: brief.projectType?.name || project.project_type?.name },
      { label: "Referred by", value: brief.referredBySource },
      { label: "Date of brief", value: fmtDate(brief.briefDate) },
    ];
    if (kvHas(items)) sections.push({ title: "Client & project", blocks: [<KV key="kv" items={items} />] });
  }

  // 2 — Site & property
  {
    const area = has(brief.siteArea)
      ? `${Number(brief.siteArea).toLocaleString("en-IN")} ${
          brief.siteAreaUnit === "OTHER" ? brief.siteAreaOtherUnit || "" : labelOf("unit", brief.siteAreaUnit)
        }`.trim()
      : "";
    const drawings = [
      ...listOf(brief.documents, "documentType").map((d) => labelOf("drawings", d)),
      ...(has(brief.drawingsAvailable) && brief.drawingsAvailable !== "OTHER" ? [labelOf("drawings", brief.drawingsAvailable)] : []),
    ];
    const items = [
      { label: "Site address", value: brief.siteAddress || project.site_location, wide: true },
      { label: "Property", value: labelOf("siteType", brief.siteType) },
      { label: "Current condition", value: labelOf("siteCondition", brief.siteCondition) },
      { label: "Site area", value: area },
      { label: "Facing", value: facing(brief.facingOrientation) },
      { label: "Floors", value: has(brief.numberOfFloors) ? String(brief.numberOfFloors) : "" },
      { label: "Lift", value: yesNo(brief.liftAvailable) },
      { label: "Parking", value: brief.parkingProvision },
      { label: "Ownership", value: brief.ownershipStatus },
      { label: "Drawings available", value: [...new Set(drawings)] },
      { label: "About the drawings", value: brief.drawingsOther, wide: true },
    ];
    if (kvHas(items)) sections.push({ title: "Site & property", blocks: [<KV key="kv" items={items} />] });
  }

  // 3 — Scope of work
  {
    const work = [...listOf(brief.workTypes, "workType").filter((w) => w !== "OTHER").map((w) => labelOf("workType", w)), ...(has(brief.workTypeOther) ? [brief.workTypeOther] : [])];
    const services = [...listOf(brief.services, "serviceType").filter((w) => w !== "OTHER").map((s) => labelOf("service", s)), ...(has(brief.servicesOther) ? [brief.servicesOther] : [])];
    const procurement = (brief.procurementCategories || [])
      .map((p) => (p.category === "OTHER" ? p.otherDescription : labelOf("procurement", p.category)))
      .filter(Boolean);
    const blocks = [];
    const kv = [
      { label: "Engagement", value: work },
      { label: "Services", value: services },
      { label: "Materials we will procure", value: procurement, wide: true },
    ];
    if (kvHas(kv)) blocks.push(<KV key="kv" items={kv} />);
    if (has(brief.areasIncludedInScope)) blocks.push({ text: { label: "Included in scope", value: brief.areasIncludedInScope } });
    if (has(brief.areasExcludedFromScope)) blocks.push({ text: { label: "Not included", value: brief.areasExcludedFromScope } });
    if (has(brief.workAlreadyDoneByOthers)) blocks.push({ text: { label: "Already done by others", value: brief.workAlreadyDoneByOthers } });
    if (blocks.length) sections.push({ title: "Scope of work", blocks });
  }

  // 4 — Spaces
  {
    const rows = bySort(brief.spaceRequirements).filter((r) => has(r.spaceName) || has(r.requirementDetails));
    if (rows.length)
      sections.push({
        title: "Spaces",
        intro: "Each space the client asked for, in their own words.",
        rows: {
          cols: ["Space", "What it needs", "#Qty"],
          template: "34% 1fr 14mm",
          items: rows.map((r, i) => ({ key: r.id || i, cells: [{ text: r.spaceName, sub: r.notes }, r.requirementDetails, qty(r.quantity)] })),
        },
      });
  }

  // 5 — People
  {
    const rows = bySort(brief.occupants).filter((r) => has(r.name) || has(r.specificNeedsPreferences));
    const blocks = [];
    if (has(brief.householdNotes)) blocks.push(<TextItem key="hn" label="Household notes" value={brief.householdNotes} />);
    if (rows.length || blocks.length)
      sections.push({
        title: "Who will use the space",
        rows: rows.length
          ? {
              cols: ["Who", "What matters to them"],
              template: "34% 1fr",
              items: rows.map((r, i) => ({ key: r.id || i, cells: [{ text: r.name, sub: r.relationship }, r.specificNeedsPreferences] })),
            }
          : null,
        blocks,
      });
  }

  // 6 — Design direction
  {
    const styles = (brief.styleDirections || [])
      .map((s) => (s.styleDirection === "OTHER" ? s.otherDescription : labelOf("style", s.styleDirection)))
      .filter(Boolean);
    const blocks = [];
    const kv = [
      { label: "Style direction", value: styles, wide: true },
      { label: "Colours we'll lean on", value: brief.coloursPreferred },
      { label: "Colours to avoid", value: brief.coloursToAvoid },
      { label: "Materials the client likes", value: brief.materialsLiked },
      { label: "Materials to avoid", value: brief.materialsDislikedHardNo },
      { label: "Maintenance appetite", value: labelOf("maintenance", brief.maintenanceAppetite) },
    ];
    if (kvHas(kv)) blocks.push(<KV key="kv" items={kv} />);
    if (has(brief.mustHaveElements)) blocks.push({ text: { label: "Must-haves", value: brief.mustHaveElements } });
    if (has(brief.vastuRequirements)) blocks.push({ text: { label: "Vastu", value: brief.vastuRequirements } });
    const refs = bySort(brief.references).filter((r) => has(r.title) || has(r.description) || has(r.referenceUrl));
    if (refs.length)
      blocks.push(
        <div key="refs">
          <span className="pd-label">References shared</span>
          {refs.map((r, i) => (
            <p key={r.id || i} className="pd-text" style={{ marginTop: i ? "1.5mm" : 0 }}>
              {has(r.title) && <b>{r.title}. </b>}
              {r.description}
              {has(r.referenceUrl) && <span style={{ color: "var(--pd-green-2)" }}> {r.referenceUrl}</span>}
            </p>
          ))}
        </div>,
      );
    if (blocks.length) sections.push({ title: "Design direction", blocks });
  }

  // 7 — Budget
  {
    const blocks = [];
    if (Number(brief.initialClientBudget) > 0)
      blocks.push(<Figure key="fig" label="Initial budget shared by the client" value={Number(brief.initialClientBudget)} />);
    if (has(brief.budgetFlexibility)) blocks.push(<TextItem key="flex" label="Flexibility" value={brief.budgetFlexibility} />);
    if (blocks.length) {
      blocks.push(
        <Note key="note">
          This is the budget as stated at briefing. It is not a quotation; costs are confirmed once the BOQ is priced and approved.
        </Note>,
      );
      sections.push({ title: "Budget", blocks });
    }
  }

  // 8 — Timeline
  {
    const blocks = [];
    const kv = [
      { label: "Site handover", value: fmtDate(brief.siteHandoverDate) },
      { label: "Desired start", value: fmtDate(brief.desiredStartDate) },
      { label: "Target completion", value: fmtDate(brief.targetCompletionDate) },
    ];
    if (kvHas(kv)) blocks.push(<KV key="kv" items={kv} cols={3} />);
    if (has(brief.deadlineReason)) blocks.push(<TextItem key="why" label="Why this date matters" value={brief.deadlineReason} />);
    const phases = brief.phasingRequired ? bySort(brief.phases).filter((p) => has(p.phaseName)) : [];
    if (phases.length)
      blocks.push({
        table: {
          label: `Work will run in ${phases.length} phases`,
          cols: ["Phase", "What happens", "#When"],
          template: "30% 1fr 40mm",
          items: phases.map((p, i) => ({
            key: p.id || i,
            cells: [
              { text: p.phaseName, sub: p.expectedTime },
              { text: p.description, sub: p.notes, strong: false },
              [fmtDate(p.startDate), fmtDate(p.endDate) && `to ${fmtDate(p.endDate)}`].filter(Boolean).join("\n"),
            ],
          })),
        },
      });
    if (blocks.length) sections.push({ title: "Timeline", blocks });
  }

  // 9 — Site rules
  {
    const rows = bySort(brief.siteRestrictions).filter((r) => has(r.details));
    if (rows.length)
      sections.push({
        title: "Site rules to plan around",
        intro: "Agreed now so they are priced and programmed, not discovered on site.",
        rows: {
          cols: ["Topic", "Detail"],
          template: "34% 1fr",
          items: rows.map((r, i) => ({ key: r.id || i, cells: [labelOf("restriction", r.type), r.details] })),
        },
      });
  }

  // 10 — Next steps & sign-off (always, kept together)
  sections.push({
    title: "Next steps & sign-off",
    blocks: [
      <SignOff
        key="sign"
        before={
          has(brief.openPointsToClose) && (
            <div style={{ marginBottom: "6mm" }}>
              <TextItem label="Open points to close before design begins" value={brief.openPointsToClose} />
            </div>
          )
        }
        note="This brief is the basis for design. Changes after sign-off are treated as a change of brief and may affect cost and time."
        left={{
          name: brief.briefTaker?.name || "Rippotai Architecture",
          role: `For Rippotai Architecture${has(brief.briefTakenDate) ? ` · ${fmtDate(brief.briefTakenDate)}` : ""}`,
        }}
        right={{
          name: brief.confirmedBy?.name || client.name || "Client",
          role: `Client${has(brief.confirmedDate) ? ` · ${fmtDate(brief.confirmedDate)}` : " · Date"}`,
        }}
      />,
    ],
  });

  return sections;
}

/* =====================================================================
   Document
   ===================================================================== */

const ClientBriefDocument = forwardRef(function ClientBriefDocument({ brief, capturing }, ref) {
  const sections = useMemo(() => buildBriefSections(brief), [brief]);
  const project = brief.project || {};
  const client = project.client || {};
  const site = brief.siteAddress || project.site_location || "";
  const version = brief.version || 1;
  const date = fmtDate(brief.briefDate || brief.createdAt);

  return (
    <PrintDocument
      ref={ref}
      capturing={capturing}
      docType="Client Brief"
      title={project.name || "Project"}
      subtitle="What we heard, and what we will design for."
      coverDetails={[
        { label: "Prepared for", value: client.name, sub: client.phone },
        { label: "Project", value: project.name },
        { label: "Site", value: site },
        { label: "Reference", value: project.project_code || project.code },
        { label: "Date", value: date, sub: `Version ${version}` },
        { label: "Prepared by", value: brief.briefTaker?.name || "Rippotai Architecture", sub: brief.briefTaker?.name ? "Rippotai Architecture" : "" },
      ]}
      preparedFor={client.name || project.name}
      date={date}
      version={version}
      sections={sections}
    />
  );
});

export default ClientBriefDocument;
