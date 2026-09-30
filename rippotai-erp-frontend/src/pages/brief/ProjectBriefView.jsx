import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Download, Loader2 } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";
import logo from "../../assets/rippotai_logo.png";
import {
  useGetProjectBriefQuery,
  useDeleteProjectBriefMutation,
} from "../../api/documents/brief.api";

// ---------------------------------------------------------------------------
// BRAND (CLIENT BRIEF VF)
// ---------------------------------------------------------------------------

const BRAND = {
  green: "#0F3D2E",
  greenSoft: "#3C6E58",
  gold: "#D4AF5F",
  ink: "#2A2A2A",
  muted: "#8A8F8B",
  faint: "#B9C4BD", // cover labels + footer
  line: "#DADDD8",
  box: "#B4BAB4", // empty checkbox border
  paper: "#FFFFFF",
};

const MARGIN = "19.4mm"; // side margin used on the VF
const LOGO_SRC = logo;

// ---------------------------------------------------------------------------
// FORM DEFINITIONS (exactly the options printed on the VF, in VF order)
// Each option: [label, value | [values...]]  (extra values = legacy aliases)
// ---------------------------------------------------------------------------

const SITE_TYPE_TREE = [
  {
    title: "Residential",
    items: [
      ["Builder Floor", ["BUILDER_FLOOR", "FLOOR"]],
      ["Bungalow", ["BUNGALOW", "KOTHI"]],
      ["Flat", "FLAT"],
      ["Villa", "VILLA"],
      ["Farmhouse", "FARMHOUSE"],
      ["Penthouse", "PENTHOUSE"],
    ],
  },
  {
    title: "Commercial",
    items: [
      ["Office", "OFFICE"],
      ["Retail Showroom", "RETAIL_SHOWROOM"],
    ],
    sub: {
      title: "Hospitality",
      items: [
        ["Hotel", "HOTEL"],
        ["Restaurant", "RESTAURANT"],
        ["Banquets", "BANQUETS"],
        ["Bar And Lounge", "BAR_AND_LOUNGE"],
        ["Café", "CAFE"],
        ["Resort", "RESORT"],
        ["QSR And Cloud Kitchen", "QSR_AND_CLOUD_KITCHEN"],
      ],
    },
  },
  {
    title: "Institutional",
    items: [
      ["Campus Addition", "CAMPUS_ADDITION"],
      ["Education", "EDUCATION"],
      ["Religious", "RELIGIOUS"],
      ["Residential Institutional", "RESIDENTIAL_INSTITUTIONAL"],
      ["Sports", "SPORTS"],
    ],
  },
];

const SITE_CONDITION_TREE = [
  {
    key: "residential",
    title: "Residential",
    items: [
      ["Bare Plot", "BARE_PLOT"],
      ["Cold Shell", "COLD_SHELL"],
      ["Warm Shell", "WARM_SHELL"],
      ["Existing Occupied", ["EXISTING_OCCUPIED", "OCCUPIED"]],
      ["Existing Vacant", ["EXISTING_VACANT", "UNOCCUPIED"]],
    ],
  },
  {
    key: "commercial",
    title: "Commercial",
    items: [
      ["Bare Plot", "BARE_PLOT"],
      ["Cold Shell", "COLD_SHELL"],
      ["Warm Shell", "WARM_SHELL"],
      ["Existing Operational", "EXISTING_OPERATIONAL"],
      ["Existing Vacant", ["EXISTING_VACANT", "UNOCCUPIED"]],
      ["Rebranding", "REBRANDING"],
    ],
  },
  {
    key: "institutional",
    title: "Institutional",
    items: [
      ["Bare Plot", "BARE_PLOT"],
      ["Existing Building — Vacant", "EXISTING_BUILDING_VACANT"],
      ["Existing Building — Operational", "EXISTING_BUILDING_OPERATIONAL"],
      ["Fit Out Required", "FIT_OUT_REQUIRED"],
    ],
  },
];

const DRAWINGS = [
  ["Sanctioned plan", "SANCTIONED_PLAN"],
  ["Architectural drawings", "ARCHITECTURAL_DRAWINGS"],
  ["Structural drawings", "STRUCTURAL_DRAWINGS"],
  ["MEP layout", "MEP_LAYOUT"],
  ["Completion certificate", "COMPLETION_CERTIFICATE"],
  ["Society NOC", "SOCIETY_NOC"],
  ["Previous designer files", "PREVIOUS_DESIGNER_FILES"],
  ["Nothing available", ["NOTHING_AVAILABLE", "NONE"]],
];

const WORK_TYPES = [
  ["Consultancy", "CONSULTANCY"],
  ["Turnkey", "TURNKEY"],
  ["Builder Finance", "BUILDER_FINANCE"],
  ["PMC Work", "PMC_WORK"],
];

const SERVICES = [
  ["Architecture Design", "ARCHITECTURE_DESIGN"],
  ["Interior design", "INTERIOR_DESIGN"],
  ["Execution", "EXECUTION"],
  ["Material Procurement", "MATERIAL_PROCUREMENT"],
  ["Landscape Design", "LANDSCAPE_DESIGN"],
];

const PROCUREMENT_GROUPS = [
  {
    title: "1  Civil, MEP & Structure",
    items: [
      ["Cement", "CEMENT"],
      ["Reinforcement Steel", "REINFORCEMENT_STEEL"],
      ["Rodi (Aggregate)", "RODI"],
      ["Pather", "PATHER"],
      ["Dust (Sand)", "DUST_SAND"],
      ["Bricks", "BRICKS"],
      ["ACC Blocks", "ACC_BLOCKS"],
      ["Metal Work", "METAL_WORK"],
      ["Electrical Conduits", "ELECTRICAL_CONDUITS"],
      ["Electrical Wiring", "ELECTRICAL_WIRING"],
      ["Electrical Boxes", "ELECTRICAL_BOXES"],
      ["Electrical Switch Plates", "ELECTRICAL_SWITCH_PLATES"],
      ["Plumbing Pipes", "PLUMBING_PIPES"],
      ["AC Piping & Drainage", "AC_PIPING_DRAINAGE"],
      ["Networking (CAT6 / CAT9)", "NETWORKING"],
      ["Chemicals & Adhesives", "CHEMICALS_ADHESIVES"],
    ],
  },
  {
    title: "2  Interior (Mill Work / Hardware etc.)",
    items: [
      ["Doors", "DOORS"],
      ["Chaukhats (Door & Window Frames)", "CHAUKHATS"],
      ["Hardware", "HARDWARE"],
      ["Ply & Wood", "PLY_WOOD"],
      ["Paints and Polishes", "PAINTS_POLISHES"],
      ["Glass Work — Looking Mirror", "GLASS_WORK"],
      ["Soft Furnishing — Sofas, Curtains, Bed Covers", "SOFT_FURNISHING"],
      ["Artefacts", "ARTEFACTS"],
    ],
  },
  {
    title: "3  Facade (FRP / Metal / Surfaces etc.)",
    items: [
      ["FRP", "FRP"],
      ["Metal", "FACADE_METAL"],
      ["Micro Concrete", "MICRO_CONCRETE"],
      ["Tiles", "FACADE_TILES"],
      ["Windows — Wooden / UPVC / Aluminium", "WINDOWS"],
    ],
  },
  {
    title: "4  Material (Tiles / Sanitary / Lights / Appliances)",
    items: [
      ["Tiles (Flooring & Wall)", "TILES"],
      ["Stone — Marble", ["STONE_MARBLE", "MARBLE"]],
      ["Stone — Granite", ["STONE_GRANITE", "GRANITE"]],
      ["Stone — Kota", "STONE_KOTA"],
      ["Stone — Nano Slabs", "STONE_NANO_SLABS"],
      ["Sanitary", "SANITARY"],
      ["CP Fittings", "CP_FITTINGS"],
      ["Light Fixtures", "LIGHT_FIXTURES"],
      ["Appliances", "APPLIANCES"],
    ],
  },
];

const STYLES = [
  ["Contemporary", "CONTEMPORARY"],
  ["Minimal", "MINIMAL"],
  ["Classic / Traditional", "CLASSIC_TRADITIONAL"],
  ["Indian contemporary", "INDIAN_CONTEMPORARY"],
  ["Industrial", "INDUSTRIAL"],
  ["Mid-century", "MID_CENTURY"],
  ["Luxe / Opulent", "LUXE_OPULENT"],
  ["Warm rustic", "WARM_RUSTIC"],
];

const BUDGET_RANGES = [
  ["50L to 1cr", "50L_TO_1CR"],
  ["1cr to 2cr", "1CR_TO_2CR"],
  ["2cr to 5cr", "2CR_TO_5CR"],
  ["5cr to 8cr", "5CR_TO_8CR"],
  ["8cr to 10cr", "8CR_TO_10CR"],
];

const TIMELINES = [
  ["3-6 MONTHS", ["3_6_MONTHS", "THREE_TO_SIX_MONTHS"]],
  ["6-12 MONTHS", ["6_12_MONTHS", "SIX_TO_TWELVE_MONTHS"]],
  ["12-18 MONTHS", ["12_18_MONTHS", "TWELVE_TO_EIGHTEEN_MONTHS"]],
  ["FLEXIBLE", "FLEXIBLE"],
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

// first page holds `first` rows, the rest `rest`; optionally force a 2nd page
const paged = (list, first, rest, forceSecond = false) => {
  const tail = chunk(list.slice(first), rest);
  if (forceSecond && !tail.length) tail.push([]);
  return [list.slice(0, first), ...tail];
};

const padTo = (rows, n) => [
  ...rows,
  ...Array.from({ length: Math.max(0, n - rows.length) }, () => ({})),
];

// [label, value|values] + selected Set -> { label, checked }
const mk = (items, sel) =>
  items.map(([label, v]) => ({
    label,
    checked: [].concat(v).some((x) => sel.has(x)),
  }));

const knownOf = (items) => new Set(items.flatMap(([, v]) => [].concat(v)));

// ---------------------------------------------------------------------------
// PRESENTATIONAL COMPONENTS (VF)
// ---------------------------------------------------------------------------

const labelStyle = {
  color: BRAND.muted,
  fontSize: "9px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 500,
};

const coverLabel = {
  color: BRAND.faint,
  fontSize: "7.5px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 400,
};

const coverValue = {
  fontSize: 13,
  fontWeight: 600,
  color: BRAND.ink,
  lineHeight: 1.3,
  wordBreak: "break-word",
};

function SectionHeader({ number, title, optional }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "3mm",
        paddingBottom: "7mm",
        marginBottom: "9mm",
        borderBottom: "1px solid #222",
      }}
    >
      {number && (
        <span style={{ color: BRAND.gold, fontSize: 12 }}>{number}</span>
      )}
      <h2
        style={{ margin: 0, fontSize: 20, fontWeight: 300, color: BRAND.ink }}
      >
        {title}
        {optional && <span style={{ fontSize: 12 }}> (optional)</span>}
      </h2>
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
        display: "block",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

// Labelled field with a writing line underneath — always printed, like the VF
function FieldGrid({ items, columns = 2 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        columnGap: "4.6mm",
        rowGap: "8mm",
        marginBottom: "8mm",
      }}
    >
      {items.map(([label, value]) => (
        <div key={label}>
          <div
            style={{
              color: BRAND.ink,
              fontSize: 8,
              fontWeight: 600,
              marginBottom: "1.5mm",
            }}
          >
            {label}
          </div>
          <div
            style={{
              minHeight: "6.5mm",
              fontSize: 13,
              fontWeight: 500,
              color: BRAND.ink,
              whiteSpace: "pre-line",
              lineHeight: 1.45,
              wordBreak: "break-word",
              borderBottom: `1px solid ${BRAND.line}`,
              paddingBottom: "1mm",
            }}
          >
            {isEmpty(value) ? "" : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function TextBlocks({ items }) {
  return (
    <div style={{ marginBottom: "8mm" }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ marginBottom: "5mm" }}>
          <div style={{ ...labelStyle, marginBottom: "2mm" }}>{label}</div>
          <div
            style={{
              minHeight: "8mm",
              fontSize: 13,
              lineHeight: 1.55,
              color: BRAND.ink,
              whiteSpace: "pre-line",
              wordBreak: "break-word",
              borderBottom: `1px solid ${BRAND.line}`,
              paddingBottom: "1mm",
            }}
          >
            {isEmpty(value) ? "" : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Box({ checked }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        flexShrink: 0,
        borderRadius: 0,
        background: checked ? BRAND.gold : BRAND.paper,
        border: `1px solid ${checked ? BRAND.gold : BRAND.box}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
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
  );
}

function CheckOption({ label, checked, bold, upper }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <Box checked={checked} />
      <span
        style={{
          fontSize: upper ? 10 : 9,
          fontWeight: bold ? 600 : 400,
          letterSpacing: upper ? "0.06em" : undefined,
          color: BRAND.ink,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// "☐ Other ________"
function OtherOption({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
      <Box checked={!!text} />
      <span style={{ fontSize: 12.5, color: BRAND.ink, lineHeight: 1.3 }}>
        Other
      </span>
      <span
        style={{
          flex: 1,
          minWidth: "24mm",
          borderBottom: `1px solid ${BRAND.box}`,
          fontSize: 12.5,
          lineHeight: 1.2,
          color: BRAND.ink,
          paddingBottom: 1,
          wordBreak: "break-word",
        }}
      >
        {text || "\u00A0"}
      </span>
    </div>
  );
}

// options: [{label, checked}], optional `other` = { text }
function CheckGroup({ label, options, columns, other, upper }) {
  const cells = options.map((o) => (
    <CheckOption key={o.label} {...o} upper={upper} />
  ));
  if (other) cells.push(<OtherOption key="__other" text={other.text} />);
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
                rowGap: "3mm",
              }
            : {
                display: "flex",
                flexWrap: "wrap",
                columnGap: "9mm",
                rowGap: "3mm",
              }
        }
      >
        {cells}
      </div>
    </div>
  );
}

// Indented single-column list (project type / site condition)
function TreeList({ rows, other }) {
  const groups = [];
  rows.forEach((row) => {
    if (row.indent === 0) groups.push([]);
    groups[groups.length - 1].push(row);
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "5mm",
        marginBottom: "6mm",
      }}
    >
      {groups.map((group, index) => (
        <div
          key={index}
          style={{ display: "flex", flexDirection: "column", gap: "3mm" }}
        >
          {group.map((row, i) => (
            <div key={i} style={{ paddingLeft: `${row.indent * 3}mm` }}>
              <CheckOption {...row} />
            </div>
          ))}
          {index === groups.length - 1 && other && (
            <OtherOption text={other.text} />
          )}
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows }) {
  const totalWeight = columns.reduce((s, c) => s + c.weight, 0);
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
          {columns.map((c) => (
            <th
              key={c.header}
              style={{
                ...labelStyle,
                color: BRAND.greenSoft,
                textAlign: "left",
                padding: "0 8px 2mm 0",
                width: `${(c.weight / totalWeight) * 100}%`,
                borderBottom: `1px solid ${BRAND.gold}`,
              }}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={r.id || i}
            style={{ borderBottom: `1px solid ${BRAND.line}` }}
          >
            {columns.map((c) => (
              <td
                key={c.header}
                style={{
                  height: "11mm",
                  padding: "6px 8px 6px 0",
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
        minHeight: "297mm",
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
      <div style={{ flex: 1 }}>{children}</div>
      <div
        style={{
          padding: `0 ${MARGIN} 9mm`,
          color: BRAND.faint,
          fontSize: 6,
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

function Section({ number, title, optional, children }) {
  return (
    <div
      style={{
        padding: `27mm ${MARGIN} 6mm`,
        boxSizing: "border-box",
        height: "100%",
      }}
    >
      {title && (
        <SectionHeader number={number} title={title} optional={optional} />
      )}
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

  const project = useMemo(() => brief?.project || {}, [brief]);
  const client = useMemo(() => project.client || {}, [project]);

  const pages = useMemo(() => {
    if (!brief) return [];

    const restriction = (key) =>
      brief[key] ||
      byOrder(brief.siteRestrictions)
        .filter((row) => row.type === key)
        .map((row) => row.details)
        .filter(Boolean)
        .join("\n");
    const out = [];
    const add = (key, node) => out.push(<PdfPage key={key}>{node}</PdfPage>);
    const address = str(project.site_location) || str(brief.siteAddress);

    // -------------------------------------------------------------- COVER
    const principal =
      str(brief.principalArchitect) || str(project.principal_architect);
    const lead = str(brief.projectLead) || str(project.project_lead);

    add(
      "cover",
      <div
        style={{
          minHeight: "283mm",
          padding: `60mm ${MARGIN} 41mm`,
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
            width: "68mm",
            height: "68mm",
            marginTop: "-17mm",
            objectFit: "contain",
            marginBottom: "-14mm",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div
          style={{
            fontSize: 32,
            fontWeight: 300,
            letterSpacing: "0.04em",
            color: BRAND.green,
          }}
        >
          RIPPŌTAI
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 300,
            letterSpacing: "0.3em",
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
            rowGap: "8mm",
          }}
        >
          {/* Project: label inline, line to the right */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div style={{ ...coverLabel, width: "43mm", paddingBottom: "1mm" }}>
              Project:
            </div>
            <div
              style={{
                ...coverValue,
                flex: 1,
                minHeight: "8mm",
                display: "flex",
                alignItems: "flex-end",
                borderBottom: `1px solid ${BRAND.line}`,
                paddingBottom: "1mm",
              }}
            >
              {project.name || ""}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: "4.6mm",
            }}
          >
            {[
              ["Address:", address],
              ["Client:", client.name],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={coverLabel}>{l}</div>
                <div
                  style={{
                    ...coverValue,
                    minHeight: "9mm",
                    display: "flex",
                    alignItems: "flex-end",
                    borderBottom: `1px solid ${BRAND.line}`,
                    paddingBottom: "1mm",
                  }}
                >
                  {v || ""}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: "4.6mm",
            }}
          >
            {[
              ["Principle Architect:", principal, true],
              ["Project Lead:", lead, false],
            ].map(([l, v, accent]) => (
              <div key={l}>
                <div style={coverLabel}>{l}</div>
                <div
                  style={{
                    ...coverValue,
                    minHeight: "9mm",
                    display: "flex",
                    alignItems: "flex-end",
                    borderBottom: `${accent ? 1.5 : 1}px solid ${
                      accent ? BRAND.gold : BRAND.line
                    }`,
                    paddingBottom: "1mm",
                  }}
                >
                  {v || ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>,
    );

    // --------------------------------------------------- 01 CLIENT & CONTACT
    const projectTypeName = (
      str(brief.projectType) || str(project.project_type)
    ).toLowerCase();
    const isType = (t) => projectTypeName === t.toLowerCase();
    const cat = isType("Residential")
      ? "residential"
      : isType("Commercial") || isType("Hospitality")
        ? "commercial"
        : isType("Institutional")
          ? "institutional"
          : null;

    const typeSel = new Set(toValues(brief.siteType));
    const hit = (v, sel) => [].concat(v).some((x) => sel.has(x));

    const typeRows = [];
    const typeKnown = new Set();
    SITE_TYPE_TREE.forEach((g) => {
      typeRows.push({
        label: g.title,
        checked: isType(g.title),
        indent: 0,
        bold: true,
      });
      g.items.forEach(([l, v]) => {
        [].concat(v).forEach((x) => typeKnown.add(x));
        typeRows.push({ label: l, checked: hit(v, typeSel), indent: 1 });
      });
      if (g.sub) {
        typeRows.push({
          label: g.sub.title,
          checked: isType(g.sub.title),
          indent: 1,
          bold: true,
        });
        g.sub.items.forEach(([l, v]) => {
          [].concat(v).forEach((x) => typeKnown.add(x));
          typeRows.push({ label: l, checked: hit(v, typeSel), indent: 2 });
        });
      }
    });
    const typeOther = [
      ...[...typeSel].filter((v) => !typeKnown.has(v)).map(humanize),
      brief.siteTypeOther,
      brief.projectTypeOther,
    ]
      .filter(Boolean)
      .join(", ");

    add(
      "client",
      <Section number="01" title="Client & contact">
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
        <SubLabel>Project type &amp; site type</SubLabel>
        <TreeList rows={typeRows} other={{ text: typeOther }} />
      </Section>,
    );

    // ---------------------------------------------------- SITE CONDITION
    const condSel = new Set(toValues(brief.siteCondition));
    const condKnown = new Set(
      SITE_CONDITION_TREE.flatMap((g) =>
        g.items.flatMap(([, v]) => [].concat(v)),
      ),
    );
    const condRows = [];
    SITE_CONDITION_TREE.forEach((g) => {
      condRows.push({
        label: g.title,
        checked:
          g.key === cat && (g.key !== "commercial" || isType("Commercial")),
        indent: 0,
        bold: true,
      });
      g.items.forEach(([l, v]) =>
        condRows.push({
          label: l,
          checked: hit(v, condSel) && (!cat || cat === g.key),
          indent: 1,
        }),
      );
    });
    const condOther = [
      ...[...condSel].filter((v) => !condKnown.has(v)).map(humanize),
      brief.siteConditionOther,
    ]
      .filter(Boolean)
      .join(", ");

    add(
      "condition",
      <Section>
        <SubLabel>Site condition</SubLabel>
        <TreeList rows={condRows} other={{ text: condOther }} />
      </Section>,
    );

    // ----------------------------------------------- 02 SITE & PROPERTY
    const drawAliases = {
      ARCHITECTURAL: "ARCHITECTURAL_DRAWINGS",
      STRUCTURAL: "STRUCTURAL_DRAWINGS",
      MEP: "MEP_LAYOUT",
      NONE: "NOTHING_AVAILABLE",
    };
    const drawSel = new Set(
      [
        ...toValues(brief.drawingsAvailable, "documentType"),
        ...toValues(brief.documents, "documentType"),
      ].map((value) => drawAliases[value] || value),
    );
    const drawKnown = knownOf(DRAWINGS);
    const drawOther = [
      ...[...drawSel].filter((v) => !drawKnown.has(v)).map(humanize),
      brief.drawingsOther,
    ]
      .filter(Boolean)
      .join(", ");

    add(
      "site",
      <Section number="02" title="Site & property details">
        <FieldGrid
          items={[
            ["Site address", brief.siteAddress || address],
            ["Parking Provision", brief.parkingProvision],
            ["Property type", brief.propertyType],
            ["Ownership Status", brief.ownershipStatus],
            [
              "Site Area (sq ft / gaj)",
              !isEmpty(brief.siteArea)
                ? `${formatNumber(brief.siteArea)} ${formatUnit(
                    brief.siteAreaUnit,
                    brief.siteAreaOtherUnit,
                  )}`.trim()
                : "",
            ],
            ["Number Of Floors", brief.numberOfFloors],
            [
              "Facing / Orientation",
              brief.facingOrientation ? humanize(brief.facingOrientation) : "",
            ],
            ["Lift Available", yesNo(brief.liftAvailable)],
          ]}
        />
        <CheckGroup
          label="Drawings and documents available with the client"
          options={mk(DRAWINGS, drawSel)}
          other={{ text: drawOther }}
          columns={3}
        />
      </Section>,
    );

    // ------------------------------------------------------ 03 SCOPE
    const workSel = new Set(toValues(brief.workTypes, "workType"));
    const serviceSel = new Set(toValues(brief.services, "serviceType"));
    const extras = (sel, known) =>
      [...sel]
        .filter((v) => !known.has(v))
        .map((v) => ({ label: humanize(v), checked: true }));

    add(
      "scope",
      <Section number="03" title="Scope of work">
        <CheckGroup
          label="Type of work"
          options={[
            ...mk(WORK_TYPES, workSel),
            ...extras(workSel, knownOf(WORK_TYPES)),
          ]}
          columns={3}
        />
        <CheckGroup
          label="Services required"
          options={[
            ...mk(SERVICES, serviceSel),
            ...extras(serviceSel, knownOf(SERVICES)),
          ]}
          columns={3}
        />
      </Section>,
    );

    // Material procurement (own page, no section header — as on the VF)
    const chosen = new Set(toValues(brief.procurementCategories, "category"));
    const allProcKnown = new Set(
      PROCUREMENT_GROUPS.flatMap((g) => [...knownOf(g.items)]),
    );
    const leftovers = [...chosen]
      .filter((v) => !allProcKnown.has(v))
      .map((v) => ({ label: humanize(v), checked: true }));

    const groupBlock = (g) => (
      <div key={g.title} style={{ marginBottom: "7mm" }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: BRAND.green,
            marginBottom: "3mm",
          }}
        >
          {g.title}
        </div>
        <div style={{ display: "grid", rowGap: "2.4mm" }}>
          {g.options.map((o) => (
            <CheckOption key={o.label} {...o} />
          ))}
        </div>
      </div>
    );
    const groups = PROCUREMENT_GROUPS.map((g) => ({
      title: g.title,
      options: mk(g.items, chosen),
    }));
    groups[3].options.push({
      label: "LANDSCAPE (separate scope — see Scope of Work)",
      checked: serviceSel.has("LANDSCAPE_DESIGN"),
    });
    if (leftovers.length) groups.push({ title: "Other", options: leftovers });

    add(
      "procurement",
      <Section>
        <SubLabel>If material procurement</SubLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "8mm",
            alignItems: "start",
          }}
        >
          <div>{groupBlock(groups[0])}</div>
          <div>{groups.slice(1).map(groupBlock)}</div>
        </div>
      </Section>,
    );

    add(
      "boundaries",
      <Section>
        <SubLabel>Scope boundaries</SubLabel>
        <TextBlocks
          items={[
            ["Areas included in scope", brief.areasIncludedInScope || ""],
            ["Areas excluded from scope", brief.areasExcludedFromScope || ""],
            [
              "Work already done by others",
              brief.workAlreadyDoneByOthers || "",
            ],
          ]}
        />
      </Section>,
    );

    // -------------------------------------------- 04 USERS & LIFESTYLE
    const occupants = byOrder(brief.occupants);
    paged(occupants, 12, 14).forEach((rows, i) =>
      add(
        `users-${i}`,
        <Section
          number={i ? undefined : "04"}
          title={i ? undefined : "Users & lifestyle"}
        >
          {i === 0 && (
            <Intro>
              Everyone who will use the space, and what each of them needs from
              it.
            </Intro>
          )}
          <DataTable
            rows={padTo(rows, i ? 0 : 12)}
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

    // ------------------------------------------- 05 SPACE REQUIREMENTS
    const spaces = byOrder(brief.spaceRequirements);
    paged(spaces, 11, 11, true).forEach((rows, i) =>
      add(
        `space-${i}`,
        <Section
          number={i ? undefined : "05"}
          title={i ? undefined : "Space requirements"}
        >
          {i === 0 && (
            <Intro>
              Space by space, in the client’s own words. Anything not recorded
              here is not part of the brief.
            </Intro>
          )}
          <DataTable
            rows={padTo(rows, 11)}
            columns={[
              {
                header: "Space requirements",
                weight: 100,
                get: (r) =>
                  [
                    r.spaceName,
                    r.requirementDetails,
                    r.quantity != null ? `Quantity: ${r.quantity}` : "",
                    r.notes,
                  ]
                    .filter(Boolean)
                    .join(" — "),
              },
            ]}
          />
        </Section>,
      ),
    );

    // ---------------------------------------- 06 DESIGN DIRECTION
    const styleSel = new Set();
    let styleOther = "";
    let styleOtherTicked = false;
    (brief.styleDirections || []).forEach((s) => {
      const v = typeof s === "string" ? s : s?.styleDirection;
      if (v === "OTHER") {
        styleOtherTicked = true;
        styleOther = s?.otherDescription || "";
      } else if (v) styleSel.add(v);
    });
    const references = byOrder(brief.references);

    add(
      "design",
      <Section number="06" title="Design direction & preferences" optional>
        <CheckGroup
          label="Style direction — tick all that apply"
          options={mk(STYLES, styleSel)}
          other={{ text: styleOther || (styleOtherTicked ? "—" : "") }}
          columns={3}
        />
        <SubLabel>Preferences</SubLabel>
        <FieldGrid
          columns={1}
          items={[
            ["Vastu requirements, if any", brief.vastuRequirements],
            ["Colours to avoid", brief.coloursToAvoid],
            ["Colours Preferred", brief.coloursPreferred],
            ["Materials disliked — hard no", brief.materialsDislikedHardNo],
            ["Material likes", brief.materialsLiked],
            ["Must-have elements", brief.mustHaveElements],
          ]}
        />
        <SubLabel>References shared by the client</SubLabel>
        <div style={{ minHeight: "18mm" }}>
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
      </Section>,
    );

    // ------------------------------------------------------ 07 BUDGET
    const rangeSel = new Set(toValues(brief.budgetRange));
    const stated = formatBudget(
      brief.initialClientBudget,
      brief.budgetCurrency,
    );

    add(
      "budget",
      <Section number="07" title="Budget">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40mm 1fr",
            alignItems: "start",
            marginBottom: "8mm",
          }}
        >
          <div style={labelStyle}>Budget Range</div>
          <div style={{ display: "grid", rowGap: "3mm" }}>
            {mk(BUDGET_RANGES, rangeSel).map((o) => (
              <CheckOption key={o.label} {...o} />
            ))}
          </div>
        </div>
        <FieldGrid
          columns={1}
          items={[
            ...(stated ? [["Budget stated by client", stated]] : []),
            [
              "Funding stage — self-funded or loan",
              brief.fundingStage ? humanize(brief.fundingStage) : "",
            ],
            ["Flexibility discussed", brief.budgetFlexibility],
          ]}
        />
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

    // ---------------------------------------------------- 08 TIMELINE
    const timeSel = new Set(toValues(brief.expectedTimeline));
    const phases = byOrder(brief.phases);

    add(
      "timeline",
      <Section number="08" title="Timeline">
        <FieldGrid
          items={[
            ["Desired start date", formatDate(brief.desiredStartDate)],
            ["Phasing required (Y / N)", yesNo(brief.phasingRequired)],
          ]}
        />
        <CheckGroup
          label="Expected timeline"
          options={mk(TIMELINES, timeSel)}
          upper
        />
        <FieldGrid
          columns={1}
          items={[
            [
              "Reason for the deadline (if any specific event or occasion)",
              brief.deadlineReason,
            ],
          ]}
        />
        <SubLabel>Phasing, if required</SubLabel>
        <DataTable
          rows={padTo(phases, 6)}
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
            { header: "Expected time", weight: 24, get: (r) => r.expectedTime },
          ]}
        />
      </Section>,
    );

    // --------------------------------------------------- 09 APPROVALS
    add(
      "approvals",
      <Section number="09" title="Approvals, constraints & site risks">
        <Intro>
          Everything that could stop work at site. Recorded now so it is priced
          and programmed, not discovered later.
        </Intro>
        <FieldGrid
          columns={1}
          items={[
            [
              "Society / RWA permitted work timings",
              restriction("societyRwaPermittedWorkTimings"),
            ],
            [
              "NOC or security deposit required",
              restriction("nocOrSecurityDepositRequired"),
            ],
            [
              "Structural changes permitted",
              restriction("structuralChangesPermitted"),
            ],
            [
              "Material movement restrictions (lift, staircase, hours)",
              restriction("materialMovementRestrictions"),
            ],
            ["Neighbour sensitivities", restriction("neighbourSensitivities")],
            [
              "Power and water availability at site",
              restriction("powerAndWaterAvailability"),
            ],
            [
              "Access, storage and debris disposal",
              restriction("accessStorageDebrisDisposal"),
            ],
            [
              "Toilet facility and stay for labour",
              brief.toiletFacilityAndStayForLabour,
            ],
            ...(isEmpty(restriction("ongoingWorkByOtherAgencies"))
              ? []
              : [
                  [
                    "Ongoing work by other agencies",
                    restriction("ongoingWorkByOtherAgencies"),
                  ],
                ]),
          ]}
        />
      </Section>,
    );

    // ---------------------------------------------- HOUSEHOLD NOTES
    add(
      "household",
      <Section>
        <SubLabel>Household notes</SubLabel>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: BRAND.ink,
            whiteSpace: "pre-line",
            wordBreak: "break-word",
          }}
        >
          {brief.householdNotes || ""}
        </div>
      </Section>,
    );
    add("household-2", <Section />); // continuation sheet, as on the VF

    // ------------------------------------------------------ 10 SIGN-OFF
    add(
      "signoff",
      <Section number="10" title="Sign-off">
        <Intro>
          This brief is the basis of the design. Anything added after sign-off
          is a change of brief and carries its own cost and time implication.
        </Intro>
        <SubLabel>Open points to close before design begins</SubLabel>
        <div
          style={{
            minHeight: "40mm",
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            wordBreak: "break-word",
            marginBottom: "10mm",
          }}
        >
          {brief.openPointsToClose || ""}
        </div>
        <FieldGrid
          items={[
            ["Brief taken by", brief.briefTaker?.name],
            ["Date", formatDate(brief.briefTakenDate)],
          ]}
        />
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

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      await document.fonts.ready;
      await Promise.all(
        Array.from(pdfRef.current.querySelectorAll("img")).map((img) =>
          img.decode(),
        ),
      );
      const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
      let outputPage = 0;
      for (const page of pdfRef.current.querySelectorAll(".pdf-page")) {
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 1280,
          onclone: (doc) =>
            doc.querySelectorAll(".pdf-page").forEach((node) => {
              node.style.boxShadow = "none";
            }),
        });
        // Preserve unusually long answers on continuation pages rather than clipping them.
        const pageHeight = Math.ceil((canvas.width * 297) / 210);
        for (let top = 0; top < canvas.height; top += pageHeight) {
          if (outputPage++) pdf.addPage();
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = Math.min(pageHeight, canvas.height - top);
          slice
            .getContext("2d")
            .drawImage(
              canvas,
              0,
              top,
              canvas.width,
              slice.height,
              0,
              0,
              canvas.width,
              slice.height,
            );
          pdf.addImage(
            slice.toDataURL("image/jpeg", 0.98),
            "JPEG",
            0,
            0,
            210,
            (slice.height * 210) / canvas.width,
          );
          slice.width = slice.height = 0;
        }
        canvas.width = canvas.height = 0;
      }
      await pdf.save(`${fileName}.pdf`, { returnPromise: true });
      toast.success("Client Brief PDF downloaded", { id: "brief-pdf" });
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
