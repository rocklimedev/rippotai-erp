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
} from "../../api/documents/brief.api";

// ---------------------------------------------------------------------------
// BRAND (matches CLIENT BRIEF VF)
// ---------------------------------------------------------------------------

const BRAND = {
  green: "#0F3D2E",
  greenSoft: "#3C6E58",
  gold: "#D4AF5F",
  ink: "#2A2A2A",
  muted: "#8A8F8B",
  line: "#DADDD8",
  paper: "#FFFFFF",
};

const LOGO_SRC = logo;

// ---------------------------------------------------------------------------
// OPTION LISTS
// ---------------------------------------------------------------------------

const SITE_TYPE_OPTIONS = [
  { value: "BUILDER_FLOOR", label: "Builder Floor" },
  { value: "FLOOR", label: "Builder Floor" },
  { value: "BUNGALOW", label: "Bungalow" },
  { value: "KOTHI", label: "Bungalow" },
  { value: "FLAT", label: "Flat" },
  { value: "VILLA", label: "Villa" },
  { value: "FARMHOUSE", label: "Farmhouse" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "OFFICE", label: "Office" },
  { value: "RETAIL_SHOWROOM", label: "Retail Showroom" },
  { value: "HOTEL", label: "Hotel" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "BANQUETS", label: "Banquets" },
  { value: "BAR_AND_LOUNGE", label: "Bar And Lounge" },
  { value: "CAFE", label: "Café" },
  { value: "RESORT", label: "Resort" },
  { value: "QSR_AND_CLOUD_KITCHEN", label: "QSR And Cloud Kitchen" },
  { value: "CAMPUS_ADDITION", label: "Campus Addition" },
  { value: "EDUCATION", label: "Education" },
  { value: "RELIGIOUS", label: "Religious" },
  { value: "RESIDENTIAL_INSTITUTIONAL", label: "Residential Institutional" },
  { value: "SPORTS", label: "Sports" },
  { value: "RAW", label: "Bare Plot" },
];

const SITE_CONDITION_OPTIONS = [
  { value: "BARE_PLOT", label: "Bare Plot" },
  { value: "COLD_SHELL", label: "Cold Shell" },
  { value: "WARM_SHELL", label: "Warm Shell" },
  { value: "EXISTING_OCCUPIED", label: "Existing Occupied" },
  { value: "OCCUPIED", label: "Existing Occupied" },
  { value: "EXISTING_VACANT", label: "Existing Vacant" },
  { value: "UNOCCUPIED", label: "Existing Vacant" },
  { value: "EXISTING_OPERATIONAL", label: "Existing Operational" },
  { value: "REBRANDING", label: "Rebranding" },
  { value: "EXISTING_BUILDING_VACANT", label: "Existing Building — Vacant" },
  {
    value: "EXISTING_BUILDING_OPERATIONAL",
    label: "Existing Building — Operational",
  },
  { value: "FIT_OUT_REQUIRED", label: "Fit Out Required" },
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
  { value: "NONE", label: "Nothing available" },
];

const WORK_TYPE_OPTIONS = [
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "TURNKEY", label: "Turnkey" },
  { value: "BUILDER_FINANCE", label: "Builder Finance" },
  { value: "PMC_WORK", label: "PMC Work" },
];

const SERVICE_OPTIONS = [
  { value: "ARCHITECTURE_DESIGN", label: "Architecture Design" },
  { value: "INTERIOR_DESIGN", label: "Interior design" },
  { value: "EXECUTION", label: "Execution" },
  { value: "LABOUR_WORK", label: "Labour Work" },
  { value: "MATERIAL_PROCUREMENT", label: "Material Procurement" },
  { value: "LANDSCAPE_DESIGN", label: "Landscape Design" },
];

const PROCUREMENT_GROUPS = [
  {
    title: "1  Civil, MEP & Structure",
    items: [
      { value: "CEMENT", label: "Cement" },
      { value: "REINFORCEMENT_STEEL", label: "Reinforcement Steel" },
      { value: "RODI", label: "Rodi (Aggregate)" },
      { value: "PATHER", label: "Pather" },
      { value: "DUST_SAND", label: "Dust (Sand)" },
      { value: "BRICKS", label: "Bricks" },
      { value: "ACC_BLOCKS", label: "ACC Blocks" },
      { value: "METAL_WORK", label: "Metal Work" },
      { value: "ELECTRICAL_CONDUITS", label: "Electrical Conduits" },
      { value: "ELECTRICAL_WIRING", label: "Electrical Wiring" },
      { value: "ELECTRICAL_BOXES", label: "Electrical Boxes" },
      { value: "ELECTRICAL_SWITCH_PLATES", label: "Electrical Switch Plates" },
      { value: "PLUMBING_PIPES", label: "Plumbing Pipes" },
      { value: "AC_PIPING_DRAINAGE", label: "AC Piping & Drainage" },
      { value: "NETWORKING", label: "Networking (CAT6 / CAT9)" },
      { value: "CHEMICALS_ADHESIVES", label: "Chemicals & Adhesives" },
      { value: "CIVIL_BUILDING_MATERIAL", label: "Civil – Building Material" },
      { value: "ELECTRICAL", label: "Electrical" },
      { value: "PLUMBING", label: "Plumbing" },
    ],
  },
  {
    title: "2  Interior (Mill Work / Hardware etc.)",
    items: [
      { value: "DOORS", label: "Doors" },
      { value: "CHAUKHATS", label: "Chaukhats (Door & Window Frames)" },
      { value: "HARDWARE", label: "Hardware" },
      { value: "PLY_WOOD", label: "Ply & Wood" },
      { value: "PAINTS_POLISHES", label: "Paints and Polishes" },
      { value: "GLASS_WORK", label: "Glass Work — Looking Mirror" },
      {
        value: "SOFT_FURNISHING",
        label: "Soft Furnishing — Sofas, Curtains, Bed Covers",
      },
      { value: "ARTEFACTS", label: "Artefacts" },
    ],
  },
  {
    title: "3  Facade (FRP / Metal / Surfaces etc.)",
    items: [
      { value: "FRP", label: "FRP" },
      { value: "FACADE_METAL", label: "Metal" },
      { value: "MICRO_CONCRETE", label: "Micro Concrete" },
      { value: "FACADE_TILES", label: "Tiles" },
      { value: "WINDOWS", label: "Windows — Wooden / UPVC / Aluminium" },
    ],
  },
  {
    title: "4  Material (Tiles / Sanitary / Lights / Appliances)",
    items: [
      { value: "TILES", label: "Tiles (Flooring & Wall)" },
      { value: "STONE_MARBLE", label: "Stone — Marble" },
      { value: "STONE_GRANITE", label: "Stone — Granite" },
      { value: "STONE_KOTA", label: "Stone — Kota" },
      { value: "STONE_NANO_SLABS", label: "Stone — Nano Slabs" },
      { value: "SANITARY", label: "Sanitary" },
      { value: "CP_FITTINGS", label: "CP Fittings" },
      { value: "LIGHT_FIXTURES", label: "Light Fixtures" },
      { value: "APPLIANCES", label: "Appliances" },
      { value: "STONE", label: "Stone" },
      { value: "MARBLE", label: "Stone — Marble" },
      { value: "GRANITE", label: "Stone — Granite" },
    ],
  },
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

const BUDGET_RANGE_OPTIONS = [
  { value: "50L_TO_1CR", label: "50L to 1cr" },
  { value: "1CR_TO_2CR", label: "1cr to 2cr" },
  { value: "2CR_TO_5CR", label: "2cr to 5cr" },
  { value: "5CR_TO_8CR", label: "5cr to 8cr" },
  { value: "8CR_TO_10CR", label: "8cr to 10cr" },
];

const TIMELINE_OPTIONS = [
  { value: "3_6_MONTHS", label: "3-6 months" },
  { value: "THREE_TO_SIX_MONTHS", label: "3-6 months" },
  { value: "6_12_MONTHS", label: "6-12 months" },
  { value: "SIX_TO_TWELVE_MONTHS", label: "6-12 months" },
  { value: "12_18_MONTHS", label: "12-18 months" },
  { value: "TWELVE_TO_EIGHTEEN_MONTHS", label: "12-18 months" },
  { value: "FLEXIBLE", label: "Flexible" },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

const humanize = (v) =>
  String(v || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const labelOf = (options, value) =>
  options.find((o) => o.value === value)?.label || humanize(value);

const str = (v) => {
  if (isEmpty(v)) return "";
  if (typeof v === "object" && v !== null && "name" in v)
    return String(v.name || "");
  return String(v);
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : "");

const formatNumber = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "");
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
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
      return otherUnit || "";
    default:
      return unit ? humanize(unit) : "";
  }
};

const formatBudget = (amount, currency) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (!currency || currency === "INR") {
    if (n >= 1e7) return `₹ ${+(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹ ${+(n / 1e5).toFixed(2)} L`;
    return `₹ ${n.toLocaleString("en-IN")}`;
  }
  return `${currency} ${n.toLocaleString()}`;
};

const toValues = (input, field) => {
  if (isEmpty(input)) return [];
  const arr = Array.isArray(input) ? input : [input];
  return arr
    .map((e) => (typeof e === "string" ? e : field ? e?.[field] : null))
    .filter(Boolean);
};

const byOrder = (list) =>
  [...(list || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const chunk = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

// ---------------------------------------------------------------------------
// PRESENTATIONAL COMPONENTS (VF-aligned)
// ---------------------------------------------------------------------------

const labelStyle = {
  color: BRAND.muted,
  fontSize: "9px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 500,
};

function CoverField({ label, value, accent }) {
  return (
    <div
      style={{
        paddingBottom: "3.5mm",
        borderBottom: `${accent ? 1.5 : 1}px solid ${accent ? BRAND.gold : BRAND.line}`,
      }}
    >
      <div style={{ ...labelStyle, marginBottom: "2mm" }}>{label}</div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: BRAND.ink,
          lineHeight: 1.35,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function SectionHeader({ number, title }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: "8mm",
      }}
    >
      {number && (
        <div
          style={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "50%",
            background: BRAND.green,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {number}
        </div>
      )}
      <h2
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: BRAND.green,
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: BRAND.line }} />
    </div>
  );
}

function SubLabel({ children }) {
  return (
    <div
      style={{
        ...labelStyle,
        marginBottom: "3.5mm",
        color: BRAND.greenSoft,
        borderBottom: `1px solid ${BRAND.gold}`,
        paddingBottom: "1.5mm",
        display: "inline-block",
        minWidth: "40mm",
      }}
    >
      {children}
    </div>
  );
}

function FieldGrid({ items, columns = 2 }) {
  const shown = items.filter(([, v]) => !isEmpty(v));
  if (shown.length === 0) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        columnGap: "12mm",
        rowGap: "5.5mm",
        marginBottom: "8mm",
      }}
    >
      {shown.map(([label, value]) => (
        <div key={label}>
          <div style={{ ...labelStyle, marginBottom: "1.5mm" }}>{label}</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: BRAND.ink,
              whiteSpace: "pre-line",
              lineHeight: 1.45,
              wordBreak: "break-word",
            }}
          >
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function TextBlocks({ items }) {
  const shown = items.filter(([, v]) => !isEmpty(v));
  if (shown.length === 0) return null;
  return (
    <div style={{ marginBottom: "8mm" }}>
      {shown.map(([label, value]) => (
        <div key={label || String(value)} style={{ marginBottom: "5mm" }}>
          {label ? (
            <div style={{ ...labelStyle, marginBottom: "2mm" }}>{label}</div>
          ) : null}
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              color: BRAND.ink,
              whiteSpace: "pre-line",
              wordBreak: "break-word",
            }}
          >
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckOption({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span
        style={{
          width: 14,
          height: 14,
          flexShrink: 0,
          borderRadius: 3,
          background: BRAND.gold,
          border: `1px solid ${BRAND.gold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span style={{ fontSize: 12.5, color: BRAND.ink, lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

function CheckGroup({ label, labels, columns }) {
  const shown = labels.filter(Boolean);
  if (shown.length === 0) return null;

  return (
    <div style={{ marginBottom: "7mm" }}>
      {label && <SubLabel>{label}</SubLabel>}

      <div
        style={
          columns
            ? {
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                columnGap: "8mm",
                rowGap: "2.8mm",
              }
            : {
                display: "flex",
                flexWrap: "wrap",
                columnGap: "9mm",
                rowGap: "2.8mm",
              }
        }
      >
        {shown.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function DataTable({ columns, rows }) {
  const cols = columns.filter((c) => rows.some((r) => !isEmpty(c.get(r))));
  if (rows.length === 0 || cols.length === 0) return null;
  const totalWeight = cols.reduce((s, c) => s + c.weight, 0);
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 12.5,
        tableLayout: "fixed",
      }}
    >
      <thead>
        <tr>
          {cols.map((c) => (
            <th
              key={c.header}
              style={{
                ...labelStyle,
                textAlign: "left",
                fontWeight: 500,
                padding: "0 8px 7px 0",
                width: `${(c.weight / totalWeight) * 100}%`,
                borderBottom: `1px solid ${BRAND.line}`,
              }}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id || i} style={{ borderTop: `1px solid ${BRAND.line}` }}>
            {cols.map((c) => (
              <td
                key={c.header}
                style={{
                  padding: "8px 8px 8px 0",
                  verticalAlign: "top",
                  color: BRAND.ink,
                  lineHeight: 1.4,
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                }}
              >
                {String(c.get(r) ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Intro({ children }) {
  return (
    <p
      style={{
        margin: "0 0 6mm",
        fontSize: 11.5,
        lineHeight: 1.5,
        color: BRAND.muted,
      }}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// PAGE + SECTION
// ---------------------------------------------------------------------------

function PdfPage({ children }) {
  return (
    <div
      className="pdf-page"
      style={{
        width: "210mm",
        height: "297mm",
        background: BRAND.paper,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          'Lato, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        color: BRAND.ink,
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {children}
      </div>
      <div
        style={{
          padding: "0 14mm 8mm",
          color: BRAND.muted,
          fontSize: 7,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
      >
        Client Brief
      </div>
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <div
      style={{
        padding: "14mm 14mm 6mm",
        boxSizing: "border-box",
        height: "100%",
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
  } = useGetProjectBriefQuery(id, { skip: !id });

  const [deleteProjectBrief, { isLoading: deleting }] =
    useDeleteProjectBriefMutation();

  const project = brief?.project || {};
  const client = project.client || {};

  const pages = useMemo(() => {
    if (!brief) return [];

    const out = [];
    let n = 0;
    const num = () => String(++n).padStart(2, "0");
    const add = (key, node) => out.push(<PdfPage key={key}>{node}</PdfPage>);

    const address = str(project.site_location) || str(brief.siteAddress);

    // -------------------------------------------------------------- COVER
    const principal = str(project.principal_architect);
    const lead = str(project.project_lead);

    add(
      "cover",
      <div
        style={{
          height: "100%",
          padding: "48mm 14mm 8mm",
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
            width: "32mm",
            height: "32mm",
            objectFit: "contain",
            marginBottom: "3mm",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div
          style={{
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: "0.06em",
            color: BRAND.green,
          }}
        >
          RIPPŌTAI
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 300,
            letterSpacing: "0.32em",
            marginTop: "8mm",
            color: BRAND.greenSoft,
          }}
        >
          CLIENT BRIEF
        </div>

        <div
          style={{
            width: "100%",
            textAlign: "left",
            marginTop: "auto",
            display: "grid",
            rowGap: "5.5mm",
          }}
        >
          {!isEmpty(project.name) && (
            <CoverField label="Project" value={project.name} />
          )}
          {(address || client.name) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "10mm",
              }}
            >
              {address ? (
                <CoverField label="Address" value={address} />
              ) : (
                <div />
              )}
              {client.name ? (
                <CoverField label="Client" value={client.name} />
              ) : (
                <div />
              )}
            </div>
          )}
          {(principal || lead) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "10mm",
              }}
            >
              {principal ? (
                <CoverField
                  label="Principle Architect"
                  value={principal}
                  accent
                />
              ) : (
                <div />
              )}
              {lead ? (
                <CoverField label="Project Lead" value={lead} />
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>,
    );

    // --------------------------------------------------- 01 CLIENT & CONTACT
    const projectTypeName = str(brief.projectType) || str(project.project_type);
    const siteTypeLabels = [
      ...toValues(brief.siteType).map((v) => labelOf(SITE_TYPE_OPTIONS, v)),
      brief.siteTypeOther ? `Other: ${brief.siteTypeOther}` : "",
    ];
    const conditionLabels = [
      ...toValues(brief.siteCondition).map((v) =>
        labelOf(SITE_CONDITION_OPTIONS, v),
      ),
      brief.siteConditionOther ? `Other: ${brief.siteConditionOther}` : "",
    ];

    add(
      "client",
      <Section number={num()} title="Client & contact">
        <FieldGrid
          items={[
            ["Client name", client.name],
            ["Project name", project.name],
            ["Contact person", client.contact_person],
            ["Relationship to client", brief.relationshipToClient],
            ["Mobile", client.phone],
            ["Referred by / Source", brief.referredBySource],
            ["Email", client.email],
            ["Date of Brief", formatDate(brief.briefDate)],
          ]}
        />
        <CheckGroup
          label="Project type"
          labels={[
            projectTypeName,
            brief.projectTypeOther ? `Other: ${brief.projectTypeOther}` : "",
          ]}
        />
        <CheckGroup label="Site type" labels={siteTypeLabels} columns={3} />
        <CheckGroup
          label="Site condition"
          labels={conditionLabels}
          columns={3}
        />
      </Section>,
    );

    // ----------------------------------------------- 02 SITE & PROPERTY
    const drawingLabels = [
      ...toValues(brief.drawingsAvailable, "documentType").map((v) =>
        labelOf(DRAWINGS_OPTIONS, v),
      ),
      brief.drawingsOther ? `Other: ${brief.drawingsOther}` : "",
    ];
    const siteFields = [
      ["Site address", brief.siteAddress || address],
      ["Parking Provision", brief.parkingProvision],
      ["Property type", brief.propertyType],
      ["Ownership Status", brief.ownershipStatus],
      [
        "Site Area",
        !isEmpty(brief.siteArea)
          ? `${formatNumber(brief.siteArea)} ${formatUnit(
              brief.siteAreaUnit,
              brief.siteAreaOtherUnit,
            )}`.trim()
          : "",
      ],
      ["Number Of Floors", brief.numberOfFloors],
      ["Facing / Orientation", humanize(brief.facingOrientation)],
      ["Lift Available", yesNo(brief.liftAvailable)],
    ];

    if (
      siteFields.some(([, v]) => !isEmpty(v)) ||
      drawingLabels.some(Boolean)
    ) {
      add(
        "site",
        <Section number={num()} title="Site & property details">
          <FieldGrid items={siteFields} />
          <CheckGroup
            label="Drawings and documents available with the client"
            labels={drawingLabels}
            columns={2}
          />
        </Section>,
      );
    }

    // ------------------------------------------------------ 03 SCOPE
    const workLabels = [
      ...toValues(brief.workTypes, "workType").map((v) =>
        labelOf(WORK_TYPE_OPTIONS, v),
      ),
      brief.workTypeOther ? `Other: ${brief.workTypeOther}` : "",
    ];
    const serviceValues = toValues(brief.services, "serviceType");
    const serviceLabels = [
      ...serviceValues.map((v) => labelOf(SERVICE_OPTIONS, v)),
      brief.servicesOther ? `Other: ${brief.servicesOther}` : "",
    ];
    const boundaries = [
      ["Areas included in scope", brief.areasIncludedInScope || "NIL"],
      ["Areas excluded from scope", brief.areasExcludedFromScope || "NIL"],
      ["Work already done by others", brief.workAlreadyDoneByOthers || "NIL"],
    ];

    const scopeNumber = num();
    add(
      "scope",
      <Section number={scopeNumber} title="Scope of work">
        <CheckGroup label="Type of work" labels={workLabels} />
        <CheckGroup
          label="Services required"
          labels={serviceLabels}
          columns={2}
        />
        <SubLabel>Scope boundaries</SubLabel>
        <TextBlocks items={boundaries} />
      </Section>,
    );

    // Material procurement
    const chosen = new Set(toValues(brief.procurementCategories, "category"));
    const known = new Set(
      PROCUREMENT_GROUPS.flatMap((g) => g.items.map((i) => i.value)),
    );
    const groups = PROCUREMENT_GROUPS.map((g) => ({
      title: g.title,
      labels: g.items.filter((i) => chosen.has(i.value)).map((i) => i.label),
    }));
    const leftovers = [...chosen].filter((v) => !known.has(v)).map(humanize);
    if (leftovers.length) groups.push({ title: "Other", labels: leftovers });
    const procurementGroups = groups.filter((g) => g.labels.length);

    if (procurementGroups.length) {
      chunk(procurementGroups, 2).forEach((pageGroups, pi) => {
        add(
          `procurement-${pi}`,
          <Section
            number={scopeNumber}
            title={
              pi === 0
                ? "Scope of work — material procurement"
                : "Material procurement (continued)"
            }
          >
            {pageGroups.map((g) => (
              <CheckGroup
                key={g.title}
                label={g.title}
                labels={g.labels}
                columns={2}
              />
            ))}
          </Section>,
        );
      });
    }

    // -------------------------------------------- 04 USERS & LIFESTYLE
    const occupants = byOrder(brief.occupants);
    if (occupants.length) {
      const usersNumber = num();
      chunk(occupants, 8).forEach((rows, i) =>
        add(
          `users-${i}`,
          <Section
            number={usersNumber}
            title={i ? "Users & lifestyle (continued)" : "Users & lifestyle"}
          >
            {i === 0 && (
              <Intro>
                Everyone who will use the space, and what each of them needs
                from it.
              </Intro>
            )}
            <DataTable
              rows={rows}
              columns={[
                {
                  header: "Name & relation",
                  weight: 35,
                  get: (r) =>
                    [r.name, r.relationship && humanize(r.relationship)]
                      .filter(Boolean)
                      .join(" · "),
                },
                {
                  header: "Specific needs or preferences",
                  weight: 65,
                  get: (r) => r.specificNeedsPreferences,
                },
              ]}
            />
          </Section>,
        ),
      );
    }

    // ------------------------------------------- 05 SPACE REQUIREMENTS
    const spaces = byOrder(brief.spaceRequirements);
    if (spaces.length) {
      const spaceNumber = num();
      chunk(spaces, 7).forEach((rows, i) =>
        add(
          `space-${i}`,
          <Section
            number={spaceNumber}
            title={i ? "Space requirements (continued)" : "Space requirements"}
          >
            {i === 0 && (
              <Intro>
                Space by space, in the client’s own words. Anything not recorded
                here is not part of the brief.
              </Intro>
            )}
            <DataTable
              rows={rows}
              columns={[
                { header: "Space", weight: 22, get: (r) => r.spaceName },
                {
                  header: "Requirement details",
                  weight: 40,
                  get: (r) => r.requirementDetails,
                },
                { header: "Quantity", weight: 12, get: (r) => r.quantity },
                { header: "Notes", weight: 26, get: (r) => r.notes },
              ]}
            />
          </Section>,
        ),
      );
    }

    // ---------------------------------------- 06 DESIGN DIRECTION
    const styleLabels = (brief.styleDirections || [])
      .map((s) => {
        const v = typeof s === "string" ? s : s?.styleDirection;
        if (v === "OTHER")
          return s?.otherDescription ? `Other: ${s.otherDescription}` : "Other";
        return v ? labelOf(STYLE_OPTIONS, v) : "";
      })
      .filter(Boolean);
    const prefs = [
      ["Vastu requirements, if any", brief.vastuRequirements],
      ["Colours to avoid", brief.coloursToAvoid],
      ["Colours preferred", brief.coloursPreferred],
      ["Materials disliked — hard no", brief.materialsDislikedHardNo],
      ["Material likes", brief.materialsLiked],
      ["Must-have elements", brief.mustHaveElements],
    ];
    const references = byOrder(brief.references);

    if (
      styleLabels.length ||
      prefs.some(([, v]) => !isEmpty(v)) ||
      references.length
    ) {
      add(
        "design",
        <Section number={num()} title="Design direction & preferences">
          <CheckGroup
            label="Style direction"
            labels={styleLabels}
            columns={3}
          />
          {prefs.some(([, v]) => !isEmpty(v)) && (
            <>
              <SubLabel>Preferences</SubLabel>
              <FieldGrid items={prefs} />
            </>
          )}
          {references.length > 0 && (
            <div>
              <SubLabel>References shared by the client</SubLabel>
              {references.map((r) => (
                <div
                  key={r.id}
                  style={{
                    fontSize: 12.5,
                    color: BRAND.ink,
                    marginBottom: 5,
                    lineHeight: 1.45,
                    wordBreak: "break-word",
                  }}
                >
                  {r.title && (
                    <strong style={{ fontWeight: 600 }}>{r.title}: </strong>
                  )}
                  {r.description}
                  {r.referenceUrl && (
                    <span
                      style={{
                        color: BRAND.greenSoft,
                        textDecoration: "underline",
                        marginLeft: 6,
                      }}
                    >
                      {r.referenceUrl}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>,
      );
    }

    // ------------------------------------------------------ 07 BUDGET
    const rangeLabels = toValues(brief.budgetRange).map((v) =>
      labelOf(BUDGET_RANGE_OPTIONS, v),
    );
    const statedBudget = formatBudget(
      brief.initialClientBudget,
      brief.budgetCurrency,
    );
    const budgetFields = [
      ["Budget stated by client", statedBudget],
      [
        "Funding stage — self-funded or loan",
        brief.fundingStage ? humanize(brief.fundingStage) : "",
      ],
      ["Flexibility discussed", brief.budgetFlexibility],
    ];

    if (rangeLabels.length || budgetFields.some(([, v]) => !isEmpty(v))) {
      add(
        "budget",
        <Section number={num()} title="Budget">
          <CheckGroup label="Budget range" labels={rangeLabels} />
          <FieldGrid items={budgetFields} />
          <p
            style={{
              margin: "4mm 0 0",
              fontSize: 10.5,
              lineHeight: 1.5,
              color: BRAND.muted,
            }}
          >
            Recorded as stated by the client at briefing stage. It is not a
            quotation and does not bind either party until the BOQ is priced and
            frozen.
          </p>
        </Section>,
      );
    }

    // ---------------------------------------------------- 08 TIMELINE
    const timelineLabels = toValues(brief.expectedTimeline).map((v) =>
      labelOf(TIMELINE_OPTIONS, v),
    );
    const phases = byOrder(brief.phases);
    const timelineFields = [
      ["Desired start date", formatDate(brief.desiredStartDate)],
      ["Phasing required", yesNo(brief.phasingRequired)],
      ["Reason for the deadline", brief.deadlineReason],
    ];

    if (
      timelineLabels.length ||
      phases.length ||
      timelineFields.some(([, v]) => !isEmpty(v))
    ) {
      add(
        "timeline",
        <Section number={num()} title="Timeline">
          <FieldGrid items={timelineFields} />
          <CheckGroup label="Expected timeline" labels={timelineLabels} />
          {brief.phasingRequired && phases.length > 0 && (
            <div>
              <SubLabel>Phasing</SubLabel>
              <DataTable
                rows={phases}
                columns={[
                  { header: "Phase", weight: 32, get: (r) => r.phaseName },
                  {
                    header: "Start date",
                    weight: 22,
                    get: (r) => formatDate(r.startDate),
                  },
                  {
                    header: "End date",
                    weight: 22,
                    get: (r) => formatDate(r.endDate),
                  },
                  {
                    header: "Expected time",
                    weight: 24,
                    get: (r) => r.expectedTime,
                  },
                ]}
              />
            </div>
          )}
        </Section>,
      );
    }

    // --------------------------------------------------- 09 APPROVALS
    const risks = [
      [
        "Society / RWA permitted work timings",
        brief.societyRwaPermittedWorkTimings,
      ],
      ["NOC or security deposit required", brief.nocOrSecurityDepositRequired],
      ["Structural changes permitted", brief.structuralChangesPermitted],
      [
        "Material movement restrictions (lift, staircase, hours)",
        brief.materialMovementRestrictions,
      ],
      ["Neighbour sensitivities", brief.neighbourSensitivities],
      ["Power and water availability at site", brief.powerAndWaterAvailability],
      [
        "Access, storage and debris disposal",
        brief.accessStorageDebrisDisposal,
      ],
      [
        "Toilet facility and stay for labour",
        brief.toiletFacilityAndStayForLabour,
      ],
      ["Ongoing work by other agencies", brief.ongoingWorkByOtherAgencies],
    ];
    if (risks.some(([, v]) => !isEmpty(v))) {
      add(
        "approvals",
        <Section number={num()} title="Approvals, constraints & site risks">
          <Intro>
            Everything that could stop work at site. Recorded now so it is
            priced and programmed, not discovered later.
          </Intro>
          <FieldGrid items={risks} columns={1} />
        </Section>,
      );
    }

    // ---------------------------------------------- HOUSEHOLD NOTES
    if (!isEmpty(brief.householdNotes)) {
      add(
        "household",
        <Section title="Household notes">
          <TextBlocks items={[["", brief.householdNotes]]} />
        </Section>,
      );
    }

    // ------------------------------------------------------ SIGN-OFF
    add(
      "signoff",
      <Section number={num()} title="Sign-off">
        <Intro>
          This brief is the basis of the design. Anything added after sign-off
          is a change of brief and carries its own cost and time implication.
        </Intro>
        <TextBlocks
          items={[
            [
              "Open points to close before design begins",
              brief.openPointsToClose,
            ],
          ]}
        />
        <div style={{ marginTop: "10mm" }}>
          <FieldGrid
            items={[
              ["Brief taken by", brief.briefTaker?.name],
              ["Date", formatDate(brief.briefTakenDate)],
            ]}
          />
        </div>
      </Section>,
    );

    return out;
  }, [brief, project, client]);

  // ---------------------------------------------------------------- DELETE

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

  // ---------------------------------------------------------- DOWNLOAD PDF
  // High-fidelity capture — no clipping, no aggressive compression
  const downloadPdf = async () => {
    if (!pdfRef.current || downloading) return;
    setDownloading(true);
    toast.loading("Preparing Client Brief PDF...", { id: "brief-pdf" });

    try {
      const slug =
        (project.name || "project")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase() || "project";
      const fileName = `client-brief-${slug}-v${brief?.version || 1}`;

      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      document.body.appendChild(iframe);

      // copy fonts + app styles so Lato / Poppins carry over
      const styles = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style'),
      )
        .map((n) => n.outerHTML)
        .join("");

      const doc = iframe.contentDocument;
      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>${fileName}</title>${styles}
      <style>
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .pdf-page {
          box-shadow: none !important;
          margin: 0 !important;
          height: 296.5mm !important;   /* avoids a blank trailing page */
          break-after: page;
          page-break-after: always;
        }
        .pdf-page:last-child { break-after: auto; page-break-after: auto; }
      </style></head>
      <body>${pdfRef.current.innerHTML}</body></html>`);
      doc.close();

      // wait for fonts + images inside the iframe
      if (doc.fonts?.ready) await doc.fonts.ready;
      await Promise.all(
        Array.from(doc.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((r) => {
                img.onload = img.onerror = r;
              }),
        ),
      );
      await new Promise((r) => setTimeout(r, 200));

      iframe.contentWindow.onafterprint = () => iframe.remove();
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      toast.success("Choose “Save as PDF” in the print dialog", {
        id: "brief-pdf",
      });
    } catch (error) {
      console.error("Client brief PDF generation failed:", error);
      toast.error("Failed to generate Client Brief PDF", { id: "brief-pdf" });
    } finally {
      setDownloading(false);
    }
  };

  // ---------------------------------------------------------------- STATES

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

  // -------------------------------------------------------------------- UI

  return (
    <Shell
      title="Client Brief"
      subtitle={`${project.name || "Project"} • v${brief.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/crm/brief/all")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 hover:bg-[#F7F5EF] transition"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            onClick={() => nav(`/crm/brief/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 hover:bg-[#F7F5EF] transition"
          >
            <Edit3 size={14} />
            Edit
          </button>

          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="h-10 px-4 rounded-lg border border-[#0F3D2E] bg-[#0F3D2E] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#143226] transition disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {downloading ? "Generating..." : "Download PDF"}
          </button>

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
      <div
        ref={pdfRef}
        style={{
          width: "210mm",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "8mm",
        }}
      >
        {pages}
      </div>

      <style>{`
        .pdf-page {
          box-shadow: 0 12px 40px rgba(15, 61, 46, 0.08);
        }
        .pdf-page * {
          box-sizing: border-box;
        }
        .pdf-page table {
          border-collapse: collapse;
        }
      `}</style>
    </Shell>
  );
}
