import React, { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Shell, Card } from "../../hooks/shared";
import logo from "../../assets/rippotai_logo.png";
import {
  useGetProjectBriefQuery,
  useDeleteProjectBriefMutation,
} from "../../api/brief.api";

// ---------------------------------------------------------------------------
// BRAND
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

const LOGO_SRC = logo;

// ---------------------------------------------------------------------------
// OPTIONS
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

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

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

const toSet = (arr, field) => {
  if (!Array.isArray(arr)) return new Set();

  return new Set(
    arr
      .map((entry) => (typeof entry === "string" ? entry : entry?.[field]))
      .filter(Boolean),
  );
};

// ---------------------------------------------------------------------------
// PRESENTATIONAL COMPONENTS
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
            style={{
              borderTop: `1px solid ${BRAND.line}`,
            }}
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
                      <span
                        style={{
                          color: BRAND.line,
                        }}
                      >
                        —
                      </span>
                    )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// PDF PAGE
// ---------------------------------------------------------------------------

function PdfPage({
  children,
  pageNumber,
  totalPages,
  footerAddress,
  className = "",
}) {
  return (
    <div
      className={`pdf-page ${className}`}
      style={{
        width: "210mm",
        minHeight: "297mm",
        height: "297mm",
        background: BRAND.paper,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
        }}
      >
        {children}
      </div>

      <div
        style={{
          padding: "10px 14mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${BRAND.line}`,
          color: BRAND.muted,
          fontSize: "8px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        <span>Client Brief</span>

        <span>{footerAddress}</span>

        <span>
          {pageNumber} / {totalPages}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION WRAPPER
// ---------------------------------------------------------------------------

function Section({ number, title, children }) {
  return (
    <div
      style={{
        padding: "15mm 14mm 10mm",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <SectionHeader number={number} title={title} />

      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

export function ProjectBriefView() {
  const { id } = useParams();
  const nav = useNavigate();

  const pdfRef = useRef(null);

  const [downloading, setDownloading] = useState(false);

  const {
    data: brief,
    isFetching,
    isError,
  } = useGetProjectBriefQuery(id, {
    skip: !id,
  });

  const [deleteProjectBrief, { isLoading: deleting }] =
    useDeleteProjectBriefMutation();

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  const removeBrief = async () => {
    if (!window.confirm("Delete this project brief? This cannot be undone.")) {
      return;
    }

    try {
      await deleteProjectBrief(id).unwrap();

      toast.success("Project brief deleted");

      nav("/documents/all");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  // -------------------------------------------------------------------------
  // DOWNLOAD PDF
  // -------------------------------------------------------------------------

  const downloadPdf = async () => {
    if (!pdfRef.current || downloading) return;

    try {
      setDownloading(true);
      toast.loading("Preparing Client Brief PDF...", { id: "brief-pdf" });

      // Let the browser finish rendering (fonts, images).
      await new Promise((resolve) => setTimeout(resolve, 150));

      const pageEls = Array.from(pdfRef.current.querySelectorAll(".pdf-page"));

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (i > 0) pdf.addPage();

        // Each canvas is exactly one A4 page — fill it edge to edge.
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      const filenameProject =
        project?.name
          ?.replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase() || "project";

      const filename = `client-brief-${filenameProject}-v${brief?.version || 1}.pdf`;

      pdf.save(filename);

      toast.success("Client Brief downloaded successfully", {
        id: "brief-pdf",
      });
    } catch (error) {
      console.error("Client brief PDF generation failed:", error);
      toast.error("Failed to generate Client Brief PDF", { id: "brief-pdf" });
    } finally {
      setDownloading(false);
    }
  };

  // -------------------------------------------------------------------------
  // NORMALIZE COLLECTIONS
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // LOADING
  // -------------------------------------------------------------------------

  if (isFetching) {
    return (
      <Shell title="Client Brief">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  // -------------------------------------------------------------------------
  // ERROR
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // DATA
  //
  // `project` comes back from the API as a nested object that carries its
  // own `client` and `project_type` relations (see brief.project.client /
  // brief.project.project_type). There is no `client_name`, `type`,
  // `principal_architect` or `project_lead` field directly on `project` —
  // those must be read from the nested relations below.
  // -------------------------------------------------------------------------

  const project = brief.project || {};
  const client = project.client || {};
  const projectType = project.project_type || {};

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

  const TOTAL_PAGES = 11;

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------

  return (
    <Shell
      title="Client Brief"
      subtitle={`${project.name || "Project"} • v${brief.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          {/* BACK */}
          <button
            onClick={() => nav("/documents/all")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 hover:bg-[#F7F5EF] transition"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {/* EDIT */}
          <button
            onClick={() => nav(`/documents/brief/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 hover:bg-[#F7F5EF] transition"
          >
            <Edit3 size={14} />
            Edit
          </button>

          {/* DOWNLOAD */}
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="h-10 px-4 rounded-lg border border-[#1B4332] bg-[#1B4332] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#143226] transition disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}

            {downloading ? "Generating..." : "Download PDF"}
          </button>

          {/* DELETE */}
          <button
            onClick={removeBrief}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 hover:bg-[#FEF5F1] transition disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      }
    >
      {/* ================================================================= */}
      {/* PDF DOCUMENT */}
      {/* ================================================================= */}

      <div
        ref={pdfRef}
        className="client-brief-document"
        style={{
          width: "210mm",
          margin: "0 auto",
          background: "#F5F3EE",
        }}
      >
        {/* =============================================================== */}
        {/* PAGE 1 — COVER */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={1}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <div
            style={{
              height: "100%",
              padding: "25mm 14mm 12mm",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <img
              src={LOGO_SRC}
              alt="Rippotai"
              crossOrigin="anonymous"
              style={{
                width: "25mm",
                height: "25mm",
                objectFit: "contain",
                marginBottom: "6mm",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <div
              style={{
                fontSize: "18px",
                letterSpacing: "0.25em",
                fontWeight: 500,
                color: BRAND.green,
              }}
            >
              RIPPŌTAI
            </div>

            <div
              style={{
                fontSize: "13px",
                letterSpacing: "0.1em",
                marginTop: "3mm",
                color: BRAND.green,
              }}
            >
              CLIENT BRIEF
            </div>

            <div style={{ height: "35mm" }} />

            <div
              style={{
                width: "100%",
                textAlign: "left",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  paddingBottom: "4mm",
                  borderBottom: `1px solid ${BRAND.line}`,
                  marginBottom: "4mm",
                }}
              >
                <CoverField label="Project" value={project.name} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8mm",
                  paddingBottom: "4mm",
                  borderBottom: `1px solid ${BRAND.line}`,
                  marginBottom: "4mm",
                }}
              >
                <CoverField
                  label="Address"
                  value={project.site_location || brief.siteAddress}
                />

                {/* Client name lives on project.client.name, not
                    project.client_name — the API returns the client as a
                    nested relation. */}
                <CoverField label="Client" value={client.name} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8mm",
                  paddingBottom: "4mm",
                  borderBottom: `2px solid ${BRAND.gold}`,
                }}
              >
                {/* project.principal_architect / project.project_lead do
                    not exist on the API payload. The nested client relation
                    does carry a contact person and phone, which is real,
                    tied data — use that instead of undefined fields. */}
                <CoverField
                  label="Client Contact"
                  value={client.contact_person}
                />

                <CoverField label="Client Phone" value={client.phone} />
              </div>
            </div>
          </div>
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 2 — CLIENT & CONTACT */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={2}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="01" title="Client & contact">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 mb-10">
              <Field label="Client Name" value={client.name} />

              {/* These three were previously read off brief.contactPerson /
                  brief.mobile / brief.email, none of which exist on the
                  brief payload — the real values live on project.client. */}
              <Field label="Contact Person" value={client.contact_person} />

              <Field label="Mobile" value={client.phone} />

              <Field label="Email" value={client.email} />

              <Field label="Project Name" value={project.name} />

              <Field
                label="Relationship To Client"
                value={brief.relationshipToClient}
              />

              <Field
                label="Referred By / Source"
                value={brief.referredBySource}
              />

              <Field
                label="Date Of Brief"
                value={formatDate(brief.briefDate)}
              />

              <Field label="Client Address" value={client.address} />
            </div>

            {/*
              project.type does not exist on the API payload — the fixed
              tick-box list here maps to brief.projectType (the enum stored
              against the brief itself). project.project_type is a separate,
              free-text project category relation, shown alongside it below
              rather than force-matched into the tick-box options.
            */}
            <CheckGroup
              label="Project Type — tick one"
              options={PROJECT_TYPE_OPTIONS}
              activeSet={new Set([brief.projectType].filter(Boolean))}
              otherValue={brief.projectTypeOther}
            />

            {projectType.name && (
              <p
                className="text-xs mt-3"
                style={{
                  color: BRAND.muted,
                }}
              >
                System project category: {projectType.name}
              </p>
            )}
          </Section>
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 3 — SITE */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={3}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="02" title="Site & property details">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 mb-10">
              <Field label="Site Address" value={brief.siteAddress} />

              <Field label="Property Type" value={brief.propertyType} />

              <Field
                label="Site Area"
                value={
                  brief.siteArea
                    ? `${brief.siteArea} ${formatUnit(
                        brief.siteAreaUnit,
                        brief.siteAreaOtherUnit,
                      )}`
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

              <Field
                label="Lift Available"
                value={yesNo(brief.liftAvailable)}
              />
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
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 4 — SCOPE */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={4}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="03" title="Scope of work">
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
                  style={{
                    color: BRAND.muted,
                  }}
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
                  style={{
                    color: BRAND.muted,
                  }}
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
                style={{
                  color: BRAND.muted,
                }}
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
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 5 — SPACE REQUIREMENTS */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={5}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="04" title="Space requirements">
            <p
              className="text-sm mb-6"
              style={{
                color: BRAND.muted,
              }}
            >
              Space by space, in the client's own words. Anything not recorded
              here is not part of the brief.
            </p>

            <DataTable
              emptyLabel="No space requirements recorded."
              columns={[
                {
                  key: "spaceName",
                  header: "Space",
                  width: "22%",
                },
                {
                  key: "requirementDetails",
                  header: "Requirement Details",
                  width: "38%",
                },
                {
                  key: "quantity",
                  header: "Quantity",
                  width: "15%",
                },
                {
                  key: "notes",
                  header: "Notes",
                  width: "25%",
                },
              ]}
              rows={spaceRequirements}
            />
          </Section>
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 6 — DESIGN */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={6}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="05" title="Design direction & preferences">
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

                <TextBlock
                  label="Materials Liked"
                  value={brief.materialsLiked}
                />

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
                  style={{
                    color: BRAND.muted,
                  }}
                >
                  References Shared By The Client
                </span>

                <ul className="space-y-2">
                  {references.map((ref) => (
                    <li
                      key={ref.id}
                      className="text-sm"
                      style={{
                        color: BRAND.ink,
                      }}
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
                          style={{
                            color: BRAND.greenSoft,
                          }}
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
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 7 — BUDGET */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={7}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="06" title="Budget">
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 mb-6">
              <Field
                label="Initial Client Budget"
                value={
                  brief.initialClientBudget
                    ? `${brief.budgetCurrency || ""} ${
                        brief.initialClientBudget
                      }`
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

            <p
              className="text-xs"
              style={{
                color: BRAND.muted,
              }}
            >
              Recorded as stated by the client at briefing stage. It is not a
              quotation and does not bind either party until the BOQ is priced
              and frozen.
            </p>
          </Section>
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 8 — TIMELINE */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={8}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="07" title="Timeline">
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
                  style={{
                    color: BRAND.muted,
                  }}
                >
                  Phasing, If Required
                </span>

                <DataTable
                  emptyLabel="No phases recorded."
                  columns={[
                    {
                      key: "phaseName",
                      header: "Phase",
                      width: "25%",
                    },
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
                    {
                      key: "notes",
                      header: "Notes",
                      width: "20%",
                    },
                  ]}
                  rows={phases}
                />
              </div>
            )}
          </Section>
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 9 — APPROVALS */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={9}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="08" title="Approvals, constraints & site risks">
            <p
              className="text-sm mb-6"
              style={{
                color: BRAND.muted,
              }}
            >
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
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 10 — USERS */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={10}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="09" title="Users & lifestyle">
            <p
              className="text-sm mb-6"
              style={{
                color: BRAND.muted,
              }}
            >
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
        </PdfPage>

        {/* =============================================================== */}
        {/* PAGE 11 — SIGN OFF */}
        {/* =============================================================== */}

        <PdfPage
          pageNumber={11}
          totalPages={TOTAL_PAGES}
          footerAddress={addressLine}
        >
          <Section number="10" title="Sign-off">
            <p
              className="text-sm mb-6"
              style={{
                color: BRAND.muted,
              }}
            >
              This brief is the basis of the design. Anything added after
              sign-off is a change of brief and carries its own cost and time
              implication.
            </p>

            <div className="mb-12">
              <TextBlock
                label="Open Points To Close Before Design Begins"
                value={brief.openPointsToClose}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-16">
              {/* RIPPOTAI */}
              <div>
                <div
                  className="text-[11px] uppercase tracking-wide mb-6"
                  style={{
                    color: BRAND.muted,
                  }}
                >
                  Brief Taken By
                </div>

                <div
                  className="pt-8 mb-2"
                  style={{
                    borderTop: `1px solid ${BRAND.line}`,
                  }}
                />

                <div
                  className="text-sm"
                  style={{
                    color: BRAND.ink,
                  }}
                >
                  {brief.briefTaker?.name || "—"}
                </div>

                <div
                  className="text-sm"
                  style={{
                    color: BRAND.ink,
                  }}
                >
                  {formatDate(brief.briefTakenDate) || "—"}
                </div>
              </div>

              {/* CLIENT */}
              <div>
                <div
                  className="text-[11px] uppercase tracking-wide mb-6"
                  style={{
                    color: BRAND.muted,
                  }}
                >
                  Confirmed By The Client
                </div>

                <div
                  className="pt-8 mb-2"
                  style={{
                    borderTop: `1px solid ${BRAND.line}`,
                  }}
                />

                <div
                  className="text-sm"
                  style={{
                    color: BRAND.ink,
                  }}
                >
                  {brief.confirmedByUserId || client.name || "—"}
                </div>

                <div
                  className="text-sm"
                  style={{
                    color: BRAND.ink,
                  }}
                >
                  {formatDate(brief.confirmedDate) || "—"}
                </div>
              </div>
            </div>
          </Section>
        </PdfPage>
      </div>

      {/* ================================================================= */}
      {/* DOCUMENT CSS */}
      {/* ================================================================= */}

      <style>{`
        /*
         * The actual PDF is constructed from fixed A4 pages.
         * Keep these rules here rather than using browser print.
         */

        .client-brief-document {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .pdf-page {
          page-break-after: always;
          break-after: page;
        }

        .pdf-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .client-brief-document table {
          border-collapse: collapse;
        }

        .client-brief-document a {
          text-decoration: underline;
        }

        /*
         * Prevent individual rows from being split.
         */
        .client-brief-document tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /*
         * Prevent common blocks from being split.
         */
        .client-brief-document .mb-6,
        .client-brief-document .mb-10,
        .client-brief-document .mb-12 {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /*
         * During normal application usage the document has a subtle
         * paper-like presentation.
         */
        .client-brief-document {
          box-shadow:
            0 12px 40px rgba(27, 67, 50, 0.08);
        }

        /*
         * html2canvas should always see white pages.
         */
        .client-brief-document,
        .client-brief-document .pdf-page {
          background-color: #ffffff;
        }

        /*
         * Responsive preview.
         * The generated PDF remains A4.
         */
        @media screen and (max-width: 900px) {
          .client-brief-document {
            transform-origin: top center;
          }
        }
      `}</style>
    </Shell>
  );
}
