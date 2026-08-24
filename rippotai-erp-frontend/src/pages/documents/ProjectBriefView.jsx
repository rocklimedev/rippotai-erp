import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Printer } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetProjectBriefQuery,
  useDeleteProjectBriefMutation,
} from "../../api/brief.api";

// ---------------------------------------------------------------------------
// Brand tokens — same palette used across the Rippotai document templates
// (deep forest green wordmark, gold rule/accent, warm hairline dividers).
// ---------------------------------------------------------------------------
const BRAND = {
  green: "#1B4332",
  greenSoft: "#3C6E58",
  gold: "#C9A227",
  goldSoft: "#DCC17E",
  ink: "#2A2A2A",
  muted: "#7A7A72",
  line: "#E4E0D3",
  paper: "#FFFFFF",
};

// Swap this for the real asset once it's available.
const LOGO_SRC = "/assets/branding/rippotai-mark.png";

// ---------------------------------------------------------------------------
// Option lists mirroring every tick-box group printed on the Client Brief
// template. Codes are assumed to match the enum values the API returns for
// each collection (workTypes[].workType, services[].serviceType, etc.) —
// adjust the `value`s here if the backend enums differ.
// ---------------------------------------------------------------------------
const PROJECT_TYPE_OPTIONS = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INSTITUTIONAL", label: "Institutional" },
  { value: "RETAIL_SHOWROOM", label: "Retail / Showroom" },
  { value: "HOSPITALITY", label: "Hospitality" },
];

const SITE_TYPE_OPTIONS = [
  { value: "FLAT", label: "Flat" },
  { value: "FLOOR", label: "Floor" },
  { value: "KOTHI", label: "Kothi" },
  { value: "RAW", label: "Raw" },
];

const SITE_CONDITION_OPTIONS = [
  { value: "OCCUPIED", label: "Occupied" },
  { value: "UNOCCUPIED", label: "Unoccupied" },
];

const DRAWINGS_OPTIONS = [
  { value: "SANCTIONED_PLAN", label: "Sanctioned plan" },
  { value: "ARCHITECTURAL_DRAWINGS", label: "Architectural drawings" },
  { value: "STRUCTURAL_DRAWINGS", label: "Structural drawings" },
  { value: "MEP_LAYOUT", label: "MEP layout" },
  { value: "COMPLETION_CERTIFICATE", label: "Completion certificate" },
  { value: "SOCIETY_NOC", label: "Society NOC" },
  { value: "PREVIOUS_DESIGNER_FILES", label: "Previous designer files" },
  { value: "NOTHING_AVAILABLE", label: "Nothing available" },
];

const WORK_TYPE_OPTIONS = [
  { value: "TURNKEY", label: "Turnkey" },
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "BUILDER_FINANCE", label: "Builder Finance" },
  { value: "PMC_WORK", label: "PMC Work" },
];

const SERVICE_OPTIONS = [
  { value: "ARCHITECTURE_DESIGN", label: "Architecture Design" },
  { value: "INTERIOR_DESIGN", label: "Interior design" },
  { value: "EXECUTION", label: "Execution" },
  { value: "LABOUR_WORK", label: "Labour Work" },
  { value: "LANDSCAPE_DESIGN", label: "Landscape Design" },
  { value: "MATERIAL_PROCUREMENT", label: "Material Procurement" },
];

const PROCUREMENT_OPTIONS = [
  {
    value: "CIVIL_BUILDING_MATERIAL",
    label: "Civil – Building Material (Rodi, Pather etc)",
  },
  { value: "METAL_WORK", label: "Metal Work" },
  { value: "AC_PIPING_DRAINAGE", label: "AC piping & drainage" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "NETWORKING", label: "Networking" },
  { value: "TILES", label: "Tiles" },
  { value: "SANITARY", label: "Sanitary" },
  { value: "CP_FITTINGS", label: "CP fittings" },
  { value: "CHEMICALS_ADHESIVES", label: "Chemicals & Adhesives" },
  { value: "STONE", label: "Stone" },
  { value: "MARBLE", label: "Marble" },
  { value: "GRANITE", label: "Granite" },
  { value: "DOORS", label: "Doors" },
  { value: "CHAUKHATS", label: "Chaukhats" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "PLY_WOOD", label: "Ply & Wood" },
  { value: "PAINTS_POLISHES", label: "Paints and Polishes" },
];

// Façade work is printed as its own mini tick-list under material
// procurement. Assumed to share the same `category` enum namespace with a
// distinct set of codes — adjust if the backend uses a separate field.
const FACADE_OPTIONS = [
  { value: "FRP", label: "FRP" },
  { value: "FACADE_METAL", label: "Metal" },
  { value: "MICRO_CONCRETE", label: "Micro concrete" },
  { value: "FACADE_TILES", label: "Tiles" },
];

const STYLE_OPTIONS = [
  { value: "CONTEMPORARY", label: "Contemporary" },
  { value: "MINIMAL", label: "Minimal" },
  { value: "CLASSIC_TRADITIONAL", label: "Classic / Traditional" },
  { value: "INDIAN_CONTEMPORARY", label: "Indian contemporary" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "MID_CENTURY", label: "Mid-century" },
  { value: "LUXE_OPULENT", label: "Luxe / Opulent" },
  { value: "WARM_RUSTIC", label: "Warm rustic" },
];

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

const yesNo = (value) => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
};

const formatUnit = (unit, otherUnit) => {
  switch (unit) {
    case "SQ_FT":
      return "sq ft";
    case "SQ_M":
      return "sq m";
    case "GAJ":
      return "gaj";
    case "OTHER":
      return otherUnit || "unit";
    default:
      return unit || "";
  }
};

// Collections like workTypes / services / procurementCategories arrive as an
// array of records with one enum field each — flatten them into a Set so the
// tick-box groups can do a simple `.has()` check. Tolerant of the field
// already being a plain string array.
const toSet = (arr, field) => {
  if (!Array.isArray(arr)) return new Set();
  return new Set(
    arr
      .map((entry) => (typeof entry === "string" ? entry : entry?.[field]))
      .filter(Boolean),
  );
};

// ---------------------------------------------------------------------------
// Shared presentational primitives
// ---------------------------------------------------------------------------

function CoverField({ label, value }) {
  return (
    <div>
      <div
        className="text-[10px] tracking-[0.14em] uppercase inline-block mr-1"
        style={{ color: BRAND.muted }}
      >
        {label}:
      </div>
      <span className="text-[13px] font-semibold" style={{ color: BRAND.ink }}>
        {value || ""}
      </span>
    </div>
  );
}

function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div
        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: BRAND.green }}
      >
        {number}
      </div>
      <h2
        className="text-lg font-semibold tracking-tight"
        style={{ color: BRAND.green }}
      >
        {title}
      </h2>
      <div className="flex-1 h-px" style={{ backgroundColor: BRAND.line }} />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span
        className="text-[11px] uppercase tracking-wide block mb-1"
        style={{ color: BRAND.muted }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium whitespace-pre-line"
        style={{ color: BRAND.ink }}
      >
        {value || <span style={{ color: BRAND.line }}>—</span>}
      </span>
    </div>
  );
}

function TextBlock({ label, value }) {
  return (
    <div className="mb-6 last:mb-0">
      <span
        className="text-[11px] uppercase tracking-wide block mb-2"
        style={{ color: BRAND.muted }}
      >
        {label}
      </span>
      <p
        className="text-sm leading-relaxed whitespace-pre-line"
        style={{ color: BRAND.ink }}
      >
        {value || <span style={{ color: BRAND.line }}>—</span>}
      </p>
    </div>
  );
}

function CheckOption({ label, checked }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0"
        style={{
          borderColor: checked ? BRAND.gold : "#C9C4B4",
          backgroundColor: checked ? BRAND.gold : "transparent",
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-sm" style={{ color: BRAND.ink }}>
        {label}
      </span>
    </div>
  );
}

function CheckGroup({
  label,
  options,
  activeSet,
  otherValue,
  otherLabel = "Other",
}) {
  return (
    <div>
      {label && (
        <span
          className="text-[11px] uppercase tracking-wide block mb-3"
          style={{ color: BRAND.muted }}
        >
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {options.map((opt) => (
          <CheckOption
            key={opt.value}
            label={opt.label}
            checked={activeSet.has(opt.value)}
          />
        ))}
        {otherValue !== undefined && (
          <CheckOption
            label={`${otherLabel}${otherValue ? `: ${otherValue}` : ""}`}
            checked={!!otherValue}
          />
        )}
      </div>
    </div>
  );
}

function DataTable({ columns, rows, emptyLabel = "None recorded." }) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: BRAND.muted }}>
        {emptyLabel}
      </p>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr
          className="text-left text-[10px] uppercase tracking-wide"
          style={{ color: BRAND.muted }}
        >
          {columns.map((col) => (
            <th
              key={col.key}
              className="py-2 pr-4 font-medium"
              style={{ width: col.width }}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={row.id || idx}
            style={{ borderTop: `1px solid ${BRAND.line}` }}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className="py-3 pr-4 align-top"
                style={{ color: BRAND.ink }}
              >
                {col.render
                  ? col.render(row)
                  : row[col.key] || (
                      <span style={{ color: BRAND.line }}>—</span>
                    )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PageFooter({ address }) {
  return (
    <div
      className="px-14 py-4 flex justify-between text-[10px] uppercase tracking-[0.12em]"
      style={{ color: BRAND.muted, borderTop: `1px solid ${BRAND.line}` }}
    >
      <span>Client Brief</span>
      <span>{address}</span>
    </div>
  );
}

function Section({ number, title, address, children }) {
  return (
    <>
      <div
        className="px-14 py-12"
        style={{ borderTop: `1px solid ${BRAND.line}` }}
      >
        <SectionHeader number={number} title={title} />
        {children}
      </div>
      <PageFooter address={address} />
    </>
  );
}

// ---------------------------------------------------------------------------

export function ProjectBriefView() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    data: brief,
    isFetching,
    isError,
  } = useGetProjectBriefQuery(id, { skip: !id });

  const [deleteProjectBrief, { isLoading: deleting }] =
    useDeleteProjectBriefMutation();

  const removeBrief = async () => {
    if (!window.confirm("Delete this project brief? This cannot be undone."))
      return;
    try {
      await deleteProjectBrief(id).unwrap();
      toast.success("Project brief deleted");
      nav("/documents/all");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  const printReport = () => window.print();

  const sets = useMemo(
    () => ({
      workTypes: toSet(brief?.workTypes, "workType"),
      services: toSet(brief?.services, "serviceType"),
      procurement: toSet(brief?.procurementCategories, "category"),
      drawings: toSet(brief?.drawingsAvailable, "documentType"),
      styles: toSet(brief?.styleDirections, "styleDirection"),
    }),
    [brief],
  );

  if (isFetching) {
    return (
      <Shell title="Client Brief">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  if (isError || !brief) {
    return (
      <Shell title="Client Brief">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Client brief not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  const project = brief.project || {};
  const addressLine = [project.name, project.site_location || brief.siteAddress]
    .filter(Boolean)
    .join(", ");
  const spaceRequirements = [...(brief.spaceRequirements || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const phases = [...(brief.phases || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const occupants = [...(brief.occupants || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const references = [...(brief.references || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const otherStyle = (brief.styleDirections || []).find(
    (s) => s.styleDirection === "OTHER",
  );

  return (
    <Shell
      title="Client Brief"
      subtitle={`${project.name || "Project"} • v${brief.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/documents/all")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => nav(`/documents/brief/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={printReport}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={removeBrief}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      }
    >
      <div
        className="max-w-4xl mx-auto shadow-sm print:shadow-none"
        style={{
          backgroundColor: BRAND.paper,
          border: `1px solid ${BRAND.line}`,
        }}
      >
        {/* ================= COVER PAGE ================= */}
        <div className="px-14 pt-20 pb-10 flex flex-col items-center text-center">
          <img
            src={LOGO_SRC}
            alt="Rippotai"
            className="w-24 h-24 object-contain mb-6"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div
            className="w-24 h-24 rounded-full mb-6 items-center justify-center text-2xl font-semibold text-white"
            style={{ backgroundColor: BRAND.green, display: "none" }}
          >
            R
          </div>

          <div
            className="text-2xl tracking-[0.25em] font-medium"
            style={{ color: BRAND.green }}
          >
            RIPPŌTAI
          </div>
          <div
            className="text-lg tracking-[0.1em] mt-3"
            style={{ color: BRAND.green }}
          >
            CLIENT BRIEF
          </div>

          <div className="h-24" />

          <div className="w-full text-left space-y-4 mt-auto">
            <div
              className="pb-3"
              style={{ borderBottom: `1px solid ${BRAND.line}` }}
            >
              <CoverField label="Project" value={project.name} />
            </div>
            <div
              className="grid grid-cols-2 gap-x-8 pb-3"
              style={{ borderBottom: `1px solid ${BRAND.line}` }}
            >
              <CoverField
                label="Address"
                value={project.site_location || brief.siteAddress}
              />
              <CoverField label="Client" value={project.client_name} />
            </div>
            <div
              className="grid grid-cols-2 gap-x-8 pb-3"
              style={{ borderBottom: `2px solid ${BRAND.gold}` }}
            >
              <CoverField
                label="Principle Architect"
                value={project.principal_architect}
              />
              <CoverField label="Project Lead" value={project.project_lead} />
            </div>
          </div>
        </div>
        <PageFooter address={addressLine} />

        {/* ================= 01 CLIENT & CONTACT ================= */}
        <Section number="01" title="Client & contact" address={addressLine}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 mb-10">
            <Field label="Client Name" value={project.client_name} />
            <Field label="Contact Person" value={brief.contactPerson} />
            <Field label="Mobile" value={brief.mobile} />
            <Field label="Email" value={brief.email} />
            <Field label="Project Name" value={project.name} />
            <Field
              label="Relationship To Client"
              value={brief.relationshipToClient}
            />
            <Field
              label="Referred By / Source"
              value={brief.referredBySource}
            />
            <Field label="Date Of Brief" value={formatDate(brief.briefDate)} />
          </div>

          <CheckGroup
            label="Project Type — tick one"
            options={PROJECT_TYPE_OPTIONS}
            activeSet={
              new Set([brief.projectType || project.type].filter(Boolean))
            }
            otherValue={brief.projectTypeOther}
          />
        </Section>

        {/* ================= 02 SITE & PROPERTY DETAILS ================= */}
        <Section
          number="02"
          title="Site & property details"
          address={addressLine}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 mb-10">
            <Field label="Site Address" value={brief.siteAddress} />
            <Field label="Property Type" value={brief.propertyType} />
            <Field
              label="Site Area"
              value={
                brief.siteArea
                  ? `${brief.siteArea} ${formatUnit(brief.siteAreaUnit, brief.siteAreaOtherUnit)}`
                  : ""
              }
            />
            <Field
              label="Facing / Orientation"
              value={brief.facingOrientation}
            />
            <Field label="Parking Provision" value={brief.parkingProvision} />
            <Field label="Ownership Status" value={brief.ownershipStatus} />
            <Field label="Number Of Floors" value={brief.numberOfFloors} />
            <Field label="Lift Available" value={yesNo(brief.liftAvailable)} />
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 mb-10">
            <CheckGroup
              label="Site Type"
              options={SITE_TYPE_OPTIONS}
              activeSet={new Set([brief.siteType].filter(Boolean))}
              otherValue={brief.siteTypeOther}
            />
            <CheckGroup
              label="Site Condition"
              options={SITE_CONDITION_OPTIONS}
              activeSet={new Set([brief.siteCondition].filter(Boolean))}
            />
          </div>

          <CheckGroup
            label="Drawings And Documents Available With The Client"
            options={DRAWINGS_OPTIONS}
            activeSet={sets.drawings}
            otherValue={brief.drawingsOther}
          />
        </Section>

        {/* ================= 03 SCOPE OF WORK ================= */}
        <Section number="03" title="Scope of work" address={addressLine}>
          <div className="mb-10">
            <CheckGroup
              label="Type Of Work"
              options={WORK_TYPE_OPTIONS}
              activeSet={sets.workTypes}
              otherValue={brief.workTypeOther}
            />
          </div>

          <div className="mb-10">
            <CheckGroup
              label="Services Required"
              options={SERVICE_OPTIONS}
              activeSet={sets.services}
              otherValue={brief.servicesOther}
            />
          </div>

          {sets.services.has("MATERIAL_PROCUREMENT") && (
            <div className="mb-10">
              <span
                className="text-[11px] uppercase tracking-wide block mb-3"
                style={{ color: BRAND.muted }}
              >
                If Material Procurement
              </span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
                {PROCUREMENT_OPTIONS.map((opt) => (
                  <CheckOption
                    key={opt.value}
                    label={opt.label}
                    checked={sets.procurement.has(opt.value)}
                  />
                ))}
              </div>
              <span
                className="text-[11px] uppercase tracking-wide block mb-3"
                style={{ color: BRAND.muted }}
              >
                Façade Work
              </span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {FACADE_OPTIONS.map((opt) => (
                  <CheckOption
                    key={opt.value}
                    label={opt.label}
                    checked={sets.procurement.has(opt.value)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <span
              className="text-[11px] uppercase tracking-wide block mb-4"
              style={{ color: BRAND.muted }}
            >
              Scope Boundaries
            </span>
            <TextBlock
              label="Areas Included In Scope"
              value={brief.areasIncludedInScope}
            />
            <TextBlock
              label="Areas Excluded From Scope"
              value={brief.areasExcludedFromScope}
            />
            <TextBlock
              label="Work Already Done By Others"
              value={brief.workAlreadyDoneByOthers}
            />
          </div>
        </Section>

        {/* ================= 04 SPACE REQUIREMENTS ================= */}
        <Section number="04" title="Space requirements" address={addressLine}>
          <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
            Space by space, in the client's own words. Anything not recorded
            here is not part of the brief.
          </p>
          <DataTable
            emptyLabel="No space requirements recorded."
            columns={[
              { key: "spaceName", header: "Space", width: "22%" },
              {
                key: "requirementDetails",
                header: "Requirement Details",
                width: "38%",
              },
              { key: "quantity", header: "Quantity", width: "15%" },
              { key: "notes", header: "Notes", width: "25%" },
            ]}
            rows={spaceRequirements}
          />
        </Section>

        {/* ================= 05 DESIGN DIRECTION & PREFERENCES ================= */}
        <Section
          number="05"
          title="Design direction & preferences"
          address={addressLine}
        >
          <div className="mb-10">
            <CheckGroup
              label="Style Direction — tick all that apply"
              options={STYLE_OPTIONS}
              activeSet={sets.styles}
              otherValue={otherStyle?.otherDescription}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-10">
            <div>
              <TextBlock
                label="Vastu Requirements, If Any"
                value={brief.vastuRequirements}
              />
              <TextBlock
                label="Colours To Avoid"
                value={brief.coloursToAvoid}
              />
              <TextBlock label="Materials Liked" value={brief.materialsLiked} />
              <TextBlock
                label="Materials Disliked — Hard No"
                value={brief.materialsDislikedHardNo}
              />
            </div>
            <div>
              <TextBlock
                label="Must-have Elements"
                value={brief.mustHaveElements}
              />
              <TextBlock
                label="Colours Preferred"
                value={brief.coloursPreferred}
              />
              <Field
                label="Maintenance Appetite"
                value={brief.maintenanceAppetite}
              />
            </div>
          </div>

          {references.length > 0 && (
            <div className="mt-8">
              <span
                className="text-[11px] uppercase tracking-wide block mb-3"
                style={{ color: BRAND.muted }}
              >
                References Shared By The Client
              </span>
              <ul className="space-y-2">
                {references.map((ref) => (
                  <li
                    key={ref.id}
                    className="text-sm"
                    style={{ color: BRAND.ink }}
                  >
                    {ref.title && (
                      <span className="font-medium">{ref.title}: </span>
                    )}
                    {ref.description}
                    {ref.referenceUrl && (
                      <a
                        href={ref.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 underline"
                        style={{ color: BRAND.greenSoft }}
                      >
                        link
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* ================= 06 BUDGET ================= */}
        <Section number="06" title="Budget" address={addressLine}>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 mb-6">
            <Field
              label="Initial Client Budget"
              value={
                brief.initialClientBudget
                  ? `${brief.budgetCurrency || ""} ${brief.initialClientBudget}`
                  : ""
              }
            />
            <Field
              label="Budget Includes / Excludes GST"
              value={brief.budgetGstStatus?.replace(/_/g, " ")}
            />
            <Field
              label="Funding Stage"
              value={brief.fundingStage?.replace(/_/g, " ")}
            />
            <Field
              label="Flexibility Discussed"
              value={brief.budgetFlexibility}
            />
          </div>
          <p className="text-xs" style={{ color: BRAND.muted }}>
            Recorded as stated by the client at briefing stage. It is not a
            quotation and does not bind either party until the BOQ is priced and
            frozen.
          </p>
        </Section>

        {/* ================= 07 TIMELINE ================= */}
        <Section number="07" title="Timeline" address={addressLine}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-6 mb-10">
            <Field
              label="Desired Start Date"
              value={formatDate(brief.desiredStartDate)}
            />
            <Field
              label="Date Fixed Or Preferred"
              value={brief.startDateStatus}
            />
            <Field
              label="Site Handover Date"
              value={formatDate(brief.siteHandoverDate)}
            />
            <Field
              label="Target Completion"
              value={formatDate(brief.targetCompletionDate)}
            />
            <Field
              label="Reason For The Deadline"
              value={brief.deadlineReason}
            />
            <Field
              label="Phasing Required"
              value={yesNo(brief.phasingRequired)}
            />
          </div>

          {brief.phasingRequired && (
            <div>
              <span
                className="text-[11px] uppercase tracking-wide block mb-3"
                style={{ color: BRAND.muted }}
              >
                Phasing, If Required
              </span>
              <DataTable
                emptyLabel="No phases recorded."
                columns={[
                  { key: "phaseName", header: "Phase", width: "25%" },
                  {
                    key: "startDate",
                    header: "Start Date",
                    width: "20%",
                    render: (r) => formatDate(r.startDate),
                  },
                  {
                    key: "endDate",
                    header: "End Date",
                    width: "20%",
                    render: (r) => formatDate(r.endDate),
                  },
                  {
                    key: "expectedTime",
                    header: "Expected Time",
                    width: "15%",
                  },
                  { key: "notes", header: "Notes", width: "20%" },
                ]}
                rows={phases}
              />
            </div>
          )}
        </Section>

        {/* ================= 08 APPROVALS, CONSTRAINTS & SITE RISKS ================= */}
        <Section
          number="08"
          title="Approvals, constraints & site risks"
          address={addressLine}
        >
          <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
            Everything that could stop work at site. Recorded now so it is
            priced and programmed, not discovered later.
          </p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            <Field
              label="Society / RWA Permitted Work Timings"
              value={brief.societyRwaPermittedWorkTimings}
            />
            <Field
              label="NOC Or Security Deposit Required"
              value={brief.nocOrSecurityDepositRequired}
            />
            <Field
              label="Structural Changes Permitted"
              value={brief.structuralChangesPermitted}
            />
            <Field
              label="Material Movement Restrictions"
              value={brief.materialMovementRestrictions}
            />
            <Field
              label="Neighbour Sensitivities"
              value={brief.neighbourSensitivities}
            />
            <Field
              label="Power And Water Availability At Site"
              value={brief.powerAndWaterAvailability}
            />
            <Field
              label="Access, Storage And Debris Disposal"
              value={brief.accessStorageDebrisDisposal}
            />
            <Field
              label="Any Ongoing Work By Other Agencies"
              value={brief.ongoingWorkByOtherAgencies}
            />
          </div>
        </Section>

        {/* ================= 09 USERS & LIFESTYLE ================= */}
        <Section number="09" title="Users & lifestyle" address={addressLine}>
          <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
            Everyone who will use the space, and what each of them needs from
            it.
          </p>
          <DataTable
            emptyLabel="No occupants recorded."
            columns={[
              {
                key: "name",
                header: "Name & Relation",
                width: "35%",
                render: (r) =>
                  [r.name, r.relationship].filter(Boolean).join(" · "),
              },
              {
                key: "specificNeedsPreferences",
                header: "Specific Needs Or Preferences",
                width: "65%",
              },
            ]}
            rows={occupants}
          />
          <div className="mt-6">
            <TextBlock label="Household Notes" value={brief.householdNotes} />
          </div>
        </Section>

        {/* ================= 10 SIGN-OFF ================= */}
        <Section number="10" title="Sign-off" address={addressLine}>
          <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
            This brief is the basis of the design. Anything added after sign-off
            is a change of brief and carries its own cost and time implication.
          </p>
          <div className="mb-12">
            <TextBlock
              label="Open Points To Close Before Design Begins"
              value={brief.openPointsToClose}
            />
          </div>

          <div className="grid grid-cols-2 gap-x-16">
            <div>
              <div
                className="text-[11px] uppercase tracking-wide mb-6"
                style={{ color: BRAND.muted }}
              >
                Brief Taken By
              </div>
              <div
                className="pt-8 mb-2"
                style={{ borderTop: `1px solid ${BRAND.line}` }}
              />
              <div className="text-sm" style={{ color: BRAND.ink }}>
                Name · {brief.briefTakenBy || "—"}
              </div>
              <div className="text-sm" style={{ color: BRAND.ink }}>
                Date · {formatDate(brief.briefTakenDate) || "—"}
              </div>
            </div>

            <div>
              <div
                className="text-[11px] uppercase tracking-wide mb-6"
                style={{ color: BRAND.muted }}
              >
                Confirmed By The Client
              </div>
              <div
                className="pt-8 mb-2"
                style={{ borderTop: `1px solid ${BRAND.line}` }}
              />
              <div className="text-sm" style={{ color: BRAND.ink }}>
                Name · {brief.confirmedByUserId || "—"}
              </div>
              <div className="text-sm" style={{ color: BRAND.ink }}>
                Date · {formatDate(brief.confirmedDate) || "—"}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </Shell>
  );
}
