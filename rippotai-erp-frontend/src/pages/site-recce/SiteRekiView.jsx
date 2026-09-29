import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Download,
  Loader2,
  Camera,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetSiteRecceQuery,
  useDeleteSiteRecceMutation,
} from "../../api/documents/site-recce.api";
// Use the template logo (cube + RIPPŌTAI wordmark, 706x858 PNG).
import logo from "../../assets/rippotai_logo.png";

/* ================================================================ */
/* DESIGN TOKENS — sampled from SITE_RECCE_Vf.pdf                   */
/* ================================================================ */

const C = {
  green: "#0F3D2F",
  gold: "#D9AF5F",
  ink: "#222222",
  title: "#3A3A3A",
  label: "#6B6B6B",
  faint: "#B4B4B4",
  rule: "#BDBDBD",
  black: "#111111",
  dash: "#7A9A8E",
  panel: "#F4F6F5",
  arrow: "#2F5FA8",
};

const FONT = "'Lato', 'Helvetica Neue', Arial, sans-serif";
const PAGE_W = 794;
const PAGE_H = 1123;
const PAD_X = 73;

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');
.recce-page, .recce-page * { font-family: ${FONT}; box-sizing: border-box; }
@media print {
  .no-print { display: none !important; }
  .recce-page { break-after: page; box-shadow: none !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

/* ================================================================ */
/* STATIC TEMPLATE CONTENT                                          */
/* ================================================================ */

const PROJECT_TYPES = [
  {
    name: "Residential",
    items: [
      "Bare Plot",
      "Bare Shell",
      "Builder Floor",
      "Kothi",
      "Flat",
      "Villa",
      "Farmhouse",
      "Penthouse",
    ],
  },
  {
    name: "Commercial",
    items: ["Bare Plot", "Bare Shell", "Office", "Retail Showroom"],
  },
  {
    name: "Institutional",
    items: [
      "Bare Plot",
      "Campus Addition",
      "Education",
      "Religious",
      "Residential Institutional",
      "Sports",
    ],
  },
  {
    name: "Hospitality",
    items: [
      "Bare Plot",
      "Hotel",
      "Restaurant",
      "Banquets",
      "Bar and Lounge",
      "Resort",
      "QSR and Cloud Kitchen",
    ],
  },
];

const SITE_CONDITIONS = [
  {
    name: "Residential",
    items: [
      "Bare Plot",
      "Bare Shell",
      "Warm Shell",
      "Existing Occupied",
      "Existing Vacant",
    ],
  },
  {
    name: "Commercial",
    items: ["Bare Plot", "Cold Shell", "Warm Shell", "Existing Operational"],
  },
  {
    name: "Institutional",
    items: [
      "Bare Plot",
      "Existing Building",
      "Existing Operational",
      "Campus Addition",
      "Fit Out",
    ],
  },
  {
    name: "Hospitality",
    items: [
      "Bare Plot",
      "Cold Shell",
      "Warm Shell",
      "Existing Operational",
      "Existing Vacant",
      "Rebranding",
    ],
  },
];

const CAPTURE_GUIDE = [
  [
    "Living & Dining",
    "Every wall, the ceiling, the floor, and each window and door.",
  ],
  ["Bedrooms", "Every wall, the ceiling, the floor, and the window."],
  [
    "Kitchen",
    "Every wall, plus a close-up of every existing plumbing point and every existing electrical point.",
  ],
  [
    "Bathroom",
    "Every wall, plus a close-up of the floor drain and the ventilation point.",
  ],
  [
    "Balcony",
    "Every wall, the railing, the floor drain, and the view looking out.",
  ],
];

const HOW_TO_STEPS = [
  "For every photo you take in a room, use one row on that room’s sheet.",
  "Paste or insert a copy of the room’s layout into the left box of that row.",
  "On that layout, mark one dot where you were standing, and draw one arrow from the dot showing exactly which way the camera was pointed.",
  "Paste the matching photo into the right box of the same row.",
  "Move to the next row for your next photo. Do not put more than one arrow on a single layout copy — a layout with two arrows does not say which photo is which.",
];

/* ================================================================ */
/* HELPERS                                                          */
/* ================================================================ */

const norm = (s) =>
  String(s ?? "")
    .toUpperCase()
    .replace(/[\s_-]+/g, " ")
    .trim();

const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";

const fmtDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
};

const num = (v) => (has(v) ? String(Number(v)) : "");

// Room-type driven hints, as in the template.
function roomHint(room) {
  const t = norm(`${room.room_type} ${room.room_name}`);
  if (t.includes("LIVING") || t.includes("DINING") || t.includes("HALL"))
    return "A larger room — plan for six to ten photos.";
  if (t.includes("BEDROOM")) return "Four to six photos is typical.";
  return null;
}

function chunk(list, first, rest) {
  if (!list.length) return [[]];
  const out = [];
  let i = 0;
  let size = first;
  while (i < list.length) {
    out.push(list.slice(i, i + size));
    i += size;
    size = rest;
  }
  return out;
}

// Society/RWA, working hours and material movement — supports both the
// legacy scalar fields and the newer `site_restrictions` table.
function resolveRestrictions(recce) {
  const list = Array.isArray(recce.site_restrictions)
    ? recce.site_restrictions
    : [];
  const fmt = (r) =>
    [r.type && String(r.type).replace(/_/g, " "), r.details]
      .filter(Boolean)
      .join(": ");
  const pick = (re) =>
    list
      .filter((r) => re.test(String(r.type || "")))
      .map(fmt)
      .join("; ");
  const working = recce.working_hours_allowed || pick(/work|hour|time/i);
  const material = recce.material_movement_rule || pick(/material|movement/i);
  const rest = list
    .filter(
      (r) => !/work|hour|time|material|movement/i.test(String(r.type || "")),
    )
    .map(fmt)
    .join("; ");
  return {
    society: recce.society_rwa_restrictions || rest,
    working,
    material,
  };
}

/* ================================================================ */
/* PRIMITIVES                                                       */
/* ================================================================ */

function Page({ children, footer = true, style }) {
  return (
    <div
      className="recce-page"
      style={{
        position: "relative",
        width: PAGE_W,
        height: PAGE_H,
        overflow: "hidden",
        background: "#fff",
        padding: `84px ${PAD_X}px 0`,
        boxShadow: "0 1px 4px rgba(0,0,0,.12)",
        color: C.ink,
        ...style,
      }}
    >
      {children}
      {footer && (
        <div
          style={{
            position: "absolute",
            left: PAD_X,
            bottom: 40,
            fontSize: 8,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontWeight: 300,
            color: C.faint,
          }}
        >
          Site Recce Format
        </div>
      )}
    </div>
  );
}

// "01  Project & Site Details" + heavy black rule
function SectionTitle({ no, children, marginTop = 0 }) {
  return (
    <div style={{ marginTop }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 300, color: C.label }}>
          {no}
        </span>
        <span style={{ fontSize: 24, fontWeight: 300, color: C.title }}>
          {children}
        </span>
      </div>
      <div
        style={{
          height: 2.5,
          background: C.black,
          marginTop: 34,
          marginBottom: 26,
        }}
      />
    </div>
  );
}

// Small spaced caps heading with gold underline (Access / Utilities / Society)
function GoldHeading({ children, marginTop = 0 }) {
  return (
    <div style={{ marginTop, marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 300,
          color: C.title,
        }}
      >
        {children}
      </div>
      <div style={{ height: 2, background: C.gold, marginTop: 10 }} />
    </div>
  );
}

// Field: tiny spaced label + value sitting on a grey rule
function Field({ label, value, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div
        style={{
          fontSize: 8,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 300,
          color: C.label,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          minHeight: 30,
          paddingBottom: 4,
          borderBottom: `1px solid ${C.rule}`,
          fontSize: 13,
          fontWeight: 400,
          color: C.ink,
          display: "flex",
          alignItems: "flex-end",
          whiteSpace: "pre-wrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const grid = (cols, gap = "22px 28px") => ({
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gap,
});

function Box({ checked }) {
  return (
    <span
      style={{
        width: 11,
        height: 11,
        flexShrink: 0,
        border: `1px solid ${checked ? C.green : "#8A8A8A"}`,
        background: checked ? C.green : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {checked && (
        <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function BlockHeading({ children, marginTop = 0 }) {
  return (
    <div style={{ marginTop, marginBottom: 22 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.black,
        }}
      >
        {children}
      </div>
      <div style={{ height: 1, background: C.rule, marginTop: 12 }} />
    </div>
  );
}

// Checkbox matrix: Residential / Commercial / Institutional / Hospitality / Other
function TypeGrid({
  groups,
  selectedGroup,
  selectedItem,
  otherText,
  showOther = true,
}) {
  const rows = [
    ...groups.map((g) => {
      const groupOn = norm(selectedGroup) === norm(g.name);
      return (
        <div key={g.name}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 10,
              fontWeight: 300,
              marginBottom: 12,
            }}
          >
            <Box checked={groupOn} />
            {g.name}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 11,
              paddingLeft: 20,
            }}
          >
            {g.items.map((it) => (
              <div
                key={it}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 8.5,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontWeight: 300,
                }}
              >
                <Box checked={groupOn && norm(selectedItem) === norm(it)} />
                {it}
              </div>
            ))}
          </div>
        </div>
      );
    }),
  ];
  if (showOther) {
    const otherOn = norm(selectedGroup) === "OTHER";
    rows.push(
      <div
        key="other"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          fontSize: 10,
          fontWeight: 300,
        }}
      >
        <Box checked={otherOn} />
        <span>
          Other{" "}
          <span
            style={{
              display: "inline-block",
              minWidth: 90,
              borderBottom: `1px solid ${C.rule}`,
              fontWeight: 400,
            }}
          >
            {otherText || "\u00A0"}
          </span>
        </span>
      </div>,
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "26px 20px",
        alignItems: "start",
      }}
    >
      {rows}
    </div>
  );
}

/* ================================================================ */
/* ILLUSTRATIONS (page 03)                                          */
/* ================================================================ */

function Arrow({ x1, y1, x2, y2 }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 9;
  const p = (ang) =>
    `${x2 - h * Math.cos(a + ang)},${y2 - h * Math.sin(a + ang)}`;
  return (
    <g stroke={C.arrow} fill={C.arrow}>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - 4 * Math.cos(a)}
        y2={y2 - 4 * Math.sin(a)}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <polygon points={`${x2},${y2} ${p(0.5)} ${p(-0.5)}`} stroke="none" />
    </g>
  );
}

function RoomOutline({ w, h, doorFrom, doorTo, children }) {
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "block" }}
    >
      <path
        d={`M1 ${h - 1} L1 1 L${w - 1} 1 L${w - 1} ${h - 1} L${doorTo} ${h - 1} M${doorFrom} ${h - 1} L1 ${h - 1}`}
        fill="none"
        stroke={C.black}
        strokeWidth="2"
      />
      {children}
    </svg>
  );
}

function DashedBox({ style, children }) {
  return (
    <div
      style={{
        border: `1px dashed ${C.dash}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: C.dash,
        fontSize: 8,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 300,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const Tiny = ({ children, style }) => (
  <div style={{ fontSize: 8, color: C.dash, fontWeight: 300, ...style }}>
    {children}
  </div>
);

const DiagramLabel = ({ children }) => (
  <div
    style={{
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: C.green,
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

/* ================================================================ */
/* ROOM TABLE                                                       */
/* ================================================================ */

const TH = {
  fontSize: 8,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  fontWeight: 300,
  color: C.label,
  textAlign: "left",
  padding: "0 6px 10px 0",
};

function RoomTable({ rows, blankRows = 0 }) {
  const cols = ["20%", "11%", "11%", "11%", "47%"];
  const cell = {
    padding: "10px 6px 10px 0",
    borderBottom: `1px solid ${C.rule}`,
    fontSize: 12.5,
    fontWeight: 400,
    verticalAlign: "top",
    height: 40,
  };
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
      }}
    >
      <colgroup>
        {cols.map((w, i) => (
          <col key={i} style={{ width: w }} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ borderBottom: `1.5px solid ${C.black}` }}>
          <th style={TH}>Room</th>
          <th style={TH}>Length</th>
          <th style={TH}>Width</th>
          <th style={TH}>Height</th>
          <th style={TH}>Existing Flooring / Ceiling / Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const u = norm(r.measurement_unit || "FT").toLowerCase();
          const dim = (v) =>
            has(v) ? (
              <>
                {num(v)}{" "}
                <span style={{ color: C.label, fontSize: 9 }}>{u}</span>
              </>
            ) : (
              ""
            );
          const details = [
            has(r.existing_flooring) && `Flooring: ${r.existing_flooring}`,
            has(r.existing_ceiling) && `Ceiling: ${r.existing_ceiling}`,
            has(r.notes) && r.notes,
          ].filter(Boolean);
          return (
            <tr key={r.id}>
              <td style={cell}>{r.room_name}</td>
              <td style={cell}>{dim(r.length)}</td>
              <td style={cell}>{dim(r.width)}</td>
              <td style={cell}>{dim(r.height)}</td>
              <td style={{ ...cell, fontSize: 11.5 }}>
                {details.map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </td>
            </tr>
          );
        })}
        {Array.from({ length: blankRows }).map((_, i) => (
          <tr key={`b${i}`}>
            {cols.map((_, j) => (
              <td key={j} style={cell}>
                &nbsp;
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================================================================ */
/* SHOT ROW (section 04)                                            */
/* ================================================================ */

function ShotRow({ photo, n, floorThumb }) {
  const meta = [
    has(photo?.standing_position) && `Standing: ${photo.standing_position}`,
    has(photo?.camera_direction) && `Facing: ${photo.camera_direction}`,
    has(photo?.notes) && photo.notes,
  ]
    .filter(Boolean)
    .join("  •  ");

  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 1fr 74px",
          height: 168,
          border: `1px dashed ${C.dash}`,
        }}
      >
        {/* layout */}
        <div
          style={{
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.dash,
              fontWeight: 300,
            }}
          >
            Shot {n} —{" "}
            {photo?.layout_image_url ? "Room layout" : "Paste room layout here"}
          </div>
          {photo?.layout_image_url ? (
            <img
              src={photo.layout_image_url}
              alt={photo.layout_file_name || "Layout"}
              crossOrigin="anonymous"
              style={{
                marginTop: 6,
                flex: 1,
                minHeight: 0,
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <Tiny style={{ marginTop: 4, textAlign: "center" }}>
              Mark ONE dot where you stood, and ONE arrow showing the exact
              direction the camera faced.
            </Tiny>
          )}
        </div>
        {/* photo */}
        <div
          style={{
            borderLeft: `1px dashed ${C.dash}`,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          {photo?.photo_url ? (
            <img
              src={photo.photo_url}
              alt={photo.photo_file_name || "Site photo"}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.dash,
                }}
              >
                Photo {n}
              </div>
              <Tiny>paste matching photo</Tiny>
            </>
          )}
        </div>
        {/* floor thumbnail */}
        <div
          style={{
            borderLeft: `1px dashed ${C.dash}`,
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {floorThumb ? (
            <img
              src={floorThumb}
              alt="Floor layout"
              crossOrigin="anonymous"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <Tiny>Floor layout thumbnail marked with room</Tiny>
          )}
        </div>
      </div>
      <div
        style={{
          height: 14,
          fontSize: 8.5,
          color: C.label,
          fontWeight: 300,
          marginTop: 3,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {meta}
      </div>
    </div>
  );
}

/* ================================================================ */
/* MAIN VIEW                                                        */
/* ================================================================ */

export function SiteRekiView() {
  const { id } = useParams();
  const nav = useNavigate();
  const {
    data: recce,
    isFetching,
    isError,
  } = useGetSiteRecceQuery(id, { skip: !id });
  const [deleteSiteRecce, { isLoading: deleting }] =
    useDeleteSiteRecceMutation();
  const contentRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const removeRecce = async () => {
    if (!window.confirm("Delete this site recce? This cannot be undone."))
      return;
    try {
      await deleteSiteRecce(id).unwrap();
      toast.success("Site recce deleted");
      nav("/site-recce");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  const downloadPdf = async () => {
    if (!contentRef.current || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      // Make sure Lato is loaded so the PDF uses the same face as the screen.
      if (document.fonts) {
        await Promise.all([
          document.fonts.load("300 12px Lato"),
          document.fonts.load("400 12px Lato"),
          document.fonts.load("700 12px Lato"),
        ]);
        await document.fonts.ready;
      }
      const nodes = contentRef.current.querySelectorAll(".recce-page");
      if (!nodes.length) return toast.error("Nothing to export yet");

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: PAGE_W,
          height: PAGE_H,
          windowWidth: PAGE_W,
          onclone: (doc) => {
            doc
              .querySelectorAll(".recce-page")
              .forEach((el) => (el.style.boxShadow = "none"));
          },
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          0,
          0,
          pw,
          ph,
        );
      }

      const nameSource =
        recce?.project?.name || recce?.project_name || "site-recce";
      const safe = String(nameSource)
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w-]/g, "");
      pdf.save(`${safe || "site-recce"}_recce_report.pdf`);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (isFetching) {
    return (
      <Shell title="Site Recce">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }
  if (isError || !recce) {
    return (
      <Shell title="Site Recce">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Site recce not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  /* ---------------- derived data ---------------- */
  const project = recce.project || {};
  const engineer = recce.site_engineer || {};
  const rooms = [...(recce.rooms || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const restr = resolveRestrictions(recce);

  // Legacy records have only site_type (FLAT/KOTHI...) — treat them as Residential.
  const projectType =
    recce.project_type || (recce.site_type ? "Residential" : "");
  const siteCondGroup =
    recce.site_condition_category ||
    recce.project_type ||
    (recce.site_condition ? "Residential" : "");

  const floorLayouts = (recce.floor_layouts || recce.floor_layout_urls || [])
    .map((f) => (typeof f === "string" ? f : f?.url))
    .filter(Boolean);
  const floorThumb = floorLayouts[0];

  const condition = recce.existing_condition || "";
  const roomChunks = chunk(rooms, condition.length > 240 ? 1 : 3, 18);

  // Room pages: 3 shots on the first (intro) page, 4 elsewhere.
  const roomPages = [];
  rooms.forEach((room, ri) => {
    const shots = [...(room.photos || [])].sort(
      (a, b) => (a.shot_number ?? 0) - (b.shot_number ?? 0),
    );
    const first = ri === 0 ? 3 : 4;
    const parts = chunk(shots, first, 4);
    parts.forEach((part, pi) =>
      roomPages.push({
        room,
        part,
        pi,
        last: pi === parts.length - 1,
        ri,
        hint: roomHint(room),
        offset: pi === 0 ? 0 : first + (pi - 1) * 4,
      }),
    );
  });

  const gridBox = { marginBottom: 0 };

  return (
    <Shell
      title="Site Recce Report"
      subtitle={`${project.name || recce.project_name || "Project"} • ${fmtDate(recce.recce_date)}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/site-recce")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => nav(`/site-recce/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={downloadPdf}
            disabled={generatingPdf}
            className="h-10 px-4 rounded-lg text-[13px] font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: C.green }}
          >
            {generatingPdf ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Download size={14} /> Download PDF
              </>
            )}
          </button>
          <button
            onClick={removeRecce}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      }
    >
      <style>{FONT_CSS}</style>

      <div
        ref={contentRef}
        className="mx-auto"
        style={{
          width: PAGE_W,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* ============ COVER ============ */}
        <Page footer={false} style={{ padding: 0 }}>
          <img
            src={logo}
            alt="Rippōtai"
            style={{
              position: "absolute",
              top: 172,
              left: (PAGE_W - 190) / 2,
              width: 190,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 432,
              width: "100%",
              textAlign: "center",
              fontSize: 22,
              fontWeight: 300,
              letterSpacing: "0.15em",
              color: C.green,
            }}
          >
            SITE RECCE FORMAT
          </div>
          <div
            style={{
              position: "absolute",
              left: PAD_X,
              right: PAD_X,
              top: 754,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 300,
                color: C.title,
                paddingBottom: 14,
                borderBottom: `1px solid ${C.rule}`,
              }}
            >
              To be filled by the site engineer at the survey visit
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.07fr 1fr",
                gap: 18,
                marginTop: 20,
              }}
            >
              {[
                ["Part 1", "Text & Content Details"],
                ["Part 2", "Layout & Photo Reference"],
              ].map(([a, b]) => (
                <div
                  key={a}
                  style={{
                    borderBottom: `3px solid ${C.gold}`,
                    paddingBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: C.title,
                      fontWeight: 300,
                    }}
                  >
                    {a}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontWeight: 300,
                      marginTop: 12,
                    }}
                  >
                    {b}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Page>

        {/* ============ 01 PROJECT & SITE DETAILS ============ */}
        <Page>
          <SectionTitle no="01">Project &amp; Site Details</SectionTitle>
          <div style={grid(2)}>
            <Field
              label="Project Name"
              value={project.name || recce.project_name}
            />
            <Field label="Client Name" value={recce.client_name} />
          </div>
          <div style={{ ...grid(1), marginTop: 26 }}>
            <Field
              label="Site Address"
              value={recce.site_address || project.site_location}
            />
          </div>
          <div style={{ ...grid(3), marginTop: 26 }}>
            <Field label="Date of Recce" value={fmtDate(recce.recce_date)} />
            <Field label="Site Engineer" value={engineer.name} />
            <Field label="Accompanied By" value={recce.accompanied_by} />
            <Field label="Unit / Floor No." value={recce.unit_floor_no} />
            <Field
              label="Carpet Area (Approx. Sq Ft)"
              value={num(recce.carpet_area_sqft)}
            />
            <Field label="No. of Rooms" value={recce.number_of_rooms} />
            <Field
              label="Build Up Area (Approx. Sq Ft)"
              value={num(recce.built_up_area_sqft)}
            />
            <Field label="No. of Floors" value={recce.number_of_floors} />
          </div>
          <BlockHeading marginTop={44}>
            Project Type &amp; Site Type
          </BlockHeading>
          <TypeGrid
            groups={PROJECT_TYPES.slice(0, 3)}
            selectedGroup={projectType}
            selectedItem={recce.site_type}
            showOther={false}
          />
        </Page>

        {/* ============ 01 (cont.) HOSPITALITY / OTHER / SITE CONDITION ============ */}
        <Page>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "26px 20px",
              alignItems: "start",
            }}
          >
            {(() => {
              const g = PROJECT_TYPES[3];
              const on = norm(projectType) === norm(g.name);
              return (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 10,
                      fontWeight: 300,
                      marginBottom: 12,
                    }}
                  >
                    <Box checked={on} />
                    {g.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 11,
                      paddingLeft: 20,
                    }}
                  >
                    {g.items.map((it) => (
                      <div
                        key={it}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 8.5,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          fontWeight: 300,
                        }}
                      >
                        <Box
                          checked={on && norm(recce.site_type) === norm(it)}
                        />
                        {it}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 10,
                fontWeight: 300,
              }}
            >
              <Box checked={norm(projectType) === "OTHER"} />
              <span>
                Other{" "}
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 90,
                    borderBottom: `1px solid ${C.rule}`,
                    fontWeight: 400,
                  }}
                >
                  {(norm(projectType) === "OTHER" &&
                    (recce.site_type_other || recce.site_type)) ||
                    "\u00A0"}
                </span>
              </span>
            </div>
          </div>

          <BlockHeading marginTop={46}>Site Condition</BlockHeading>
          <TypeGrid
            groups={SITE_CONDITIONS.slice(0, 3)}
            selectedGroup={siteCondGroup}
            selectedItem={recce.site_condition}
            showOther={false}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "26px 20px",
              alignItems: "start",
              marginTop: 40,
            }}
          >
            {(() => {
              const g = SITE_CONDITIONS[3];
              const on = norm(siteCondGroup) === norm(g.name);
              return (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 10,
                      fontWeight: 300,
                      marginBottom: 12,
                    }}
                  >
                    <Box checked={on} />
                    {g.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 11,
                      paddingLeft: 20,
                    }}
                  >
                    {g.items.map((it) => (
                      <div
                        key={it}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 8.5,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          fontWeight: 300,
                        }}
                      >
                        <Box
                          checked={
                            on && norm(recce.site_condition) === norm(it)
                          }
                        />
                        {it}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 10,
                fontWeight: 300,
              }}
            >
              <Box checked={norm(siteCondGroup) === "OTHER"} />
              <span>
                Other{" "}
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 90,
                    borderBottom: `1px solid ${C.rule}`,
                    fontWeight: 400,
                  }}
                >
                  {(norm(siteCondGroup) === "OTHER" &&
                    (recce.site_condition_other || recce.site_condition)) ||
                    "\u00A0"}
                </span>
              </span>
            </div>
          </div>
        </Page>

        {/* ============ ACCESS / UTILITIES / SOCIETY / EXISTING / 02 ============ */}
        <Page style={{ paddingTop: 70 }}>
          <GoldHeading>Access for Material &amp; Labour</GoldHeading>
          <div style={grid(3)}>
            <Field
              label="Lift Available (Y/N) & Size"
              value={
                recce.lift_available === true
                  ? `Yes${has(recce.lift_size) ? " • " + recce.lift_size : ""}`
                  : recce.lift_available === false
                    ? "No"
                    : ""
              }
            />
            <Field label="Staircase Width" value={recce.staircase_width} />
            <Field
              label="Material Entry Point"
              value={recce.material_entry_point}
            />
          </div>

          <GoldHeading marginTop={32}>Utilities Available on Site</GoldHeading>
          <div style={grid(3)}>
            <Field label="Water Connection" value={recce.water_connection} />
            <Field
              label="Power Load Available"
              value={recce.power_load_available}
            />
            <Field
              label="Drainage Point Location"
              value={recce.drainage_point_location}
            />
          </div>

          <GoldHeading marginTop={28}>Society / RWA Restrictions</GoldHeading>
          <div style={grid(3)}>
            <Field label="Working Hours Allowed" value={restr.working} />
            <Field label="Material Movement Rule" value={restr.material} />
            <div />
          </div>
          {has(restr.society) && (
            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              {restr.society}
            </div>
          )}

          <div style={{ marginTop: 30 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 300,
                color: C.title,
              }}
            >
              Existing Condition — Note Anything Found
            </div>
            <div
              style={{
                height: 1,
                background: C.rule,
                marginTop: 10,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                fontSize: 8.5,
                fontWeight: 300,
                color: C.label,
                marginBottom: 6,
              }}
            >
              Seepage, cracks, prior alterations, damage — record before any
              work touches the site.
            </div>
            <div
              style={{
                minHeight: 84,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: "28px",
                whiteSpace: "pre-wrap",
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 27px, ${C.rule} 27px, ${C.rule} 28px)`,
              }}
            >
              {condition}
            </div>
          </div>

          <SectionTitle no="02" marginTop={26}>
            Room-Wise Measurements
          </SectionTitle>
          <RoomTable
            rows={roomChunks[0]}
            blankRows={rooms.length === 0 ? 3 : 0}
          />
        </Page>

        {/* table continuation */}
        {roomChunks.slice(1).map((rows, i) => (
          <Page key={`rt-${i}`}>
            <RoomTable rows={rows} />
          </Page>
        ))}

        {/* ============ 03 HOW TO DOCUMENT ============ */}
        <Page>
          <SectionTitle no="03">
            How to Document the Layout &amp; Photos
          </SectionTitle>
          <div style={{ fontSize: 9.5, fontWeight: 300, color: "#555" }}>
            One photo. One arrow. One copy of the layout. That is the whole
            method — repeated as many times as you took photos in that room.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 36,
              marginTop: 36,
              paddingLeft: 0,
            }}
          >
            <div>
              <DiagramLabel>1. Mark where you stood</DiagramLabel>
              <RoomOutline w={200} h={176} doorFrom={62} doorTo={108}>
                <circle cx="16" cy="160" r="4.5" fill={C.black} />
                <Arrow x1="30" y1="146" x2="56" y2="118" />
              </RoomOutline>
              <Tiny style={{ marginTop: 8, color: C.label }}>
                One dot. One arrow, pointing the way the camera faced.
              </Tiny>
            </div>
            <div style={{ alignSelf: "center", color: C.gold, fontSize: 14 }}>
              =
            </div>
            <div>
              <DiagramLabel>2. Paste that photo next to it</DiagramLabel>
              <DashedBox style={{ width: 140, height: 176 }}>
                <Camera size={26} strokeWidth={1.4} color={C.dash} />
                <div style={{ marginTop: 10, fontSize: 7, lineHeight: 1.4 }}>
                  The photo taken
                  <br />
                  from that spot,
                  <br />
                  in that direction
                </div>
              </DashedBox>
            </div>
          </div>

          <div style={{ display: "flex", gap: 60, marginTop: 84 }}>
            <div
              style={{
                width: 170,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                paddingTop: 22,
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <DashedBox style={{ width: 30, height: 34, flexShrink: 0 }}>
                    <Camera size={13} strokeWidth={1.5} color={C.dash} />
                  </DashedBox>
                  <span style={{ fontSize: 8, fontWeight: 300 }}>
                    Photo {n} + its own layout copy
                  </span>
                </div>
              ))}
            </div>
            <div>
              <DiagramLabel>Same room, four photos</DiagramLabel>
              <RoomOutline w={160} h={176} doorFrom={52} doorTo={92}>
                {[
                  { x: 15, y: 162, tx: 34, ty: 140, n: 1, lx: 14, ly: 156 },
                  { x: 145, y: 162, tx: 126, ty: 140, n: 2, lx: 140, ly: 156 },
                  { x: 145, y: 15, tx: 126, ty: 36, n: 3, lx: 140, ly: 12 },
                  { x: 15, y: 15, tx: 34, ty: 36, n: 4, lx: 14, ly: 12 },
                ].map((d) => (
                  <g key={d.n}>
                    <circle cx={d.x} cy={d.y} r="4.5" fill={C.black} />
                    <Arrow
                      x1={d.x + (d.tx - d.x) * 0.25}
                      y1={d.y + (d.ty - d.y) * 0.25}
                      x2={d.tx}
                      y2={d.ty}
                    />
                    <text
                      x={d.lx}
                      y={d.ly}
                      fontSize="7"
                      fill={C.black}
                      textAnchor="middle"
                      dy={d.ly > 100 ? 11 : -6}
                      fontWeight="700"
                    >
                      {d.n}
                    </text>
                  </g>
                ))}
              </RoomOutline>
              <Tiny style={{ marginTop: 8, color: C.label, width: 170 }}>
                Four photos taken in this room means four separate
                layout-and-photo pairs on the sheet — not one shared layout.
              </Tiny>
            </div>
          </div>

          <div
            style={{
              marginTop: 40,
              fontSize: 9,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 300,
              color: C.title,
            }}
          >
            Mark direction on each layout (North, East, South and West)
          </div>

          <div
            style={{ marginTop: 22, background: C.panel, padding: "22px 26px" }}
          >
            <div
              style={{
                fontSize: 8.5,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 300,
                color: C.label,
                marginBottom: 14,
              }}
            >
              How to fill Part 2, step by step
            </div>
            {HOW_TO_STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 9,
                  fontWeight: 300,
                  lineHeight: 1.5,
                  marginBottom: 8,
                }}
              >
                <span style={{ width: 12 }}>{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </Page>

        {/* ============ 03.1 CAPTURE GUIDE ============ */}
        <Page>
          <SectionTitle no="03.1">
            What to Make Sure You Capture, Room by Room
          </SectionTitle>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.black}` }}>
                <th style={{ ...TH, width: "22%" }}>Room</th>
                <th style={TH}>Make sure one photo each covers</th>
              </tr>
            </thead>
            <tbody>
              {CAPTURE_GUIDE.map(([r, t]) => (
                <tr key={r}>
                  <td
                    style={{
                      padding: "12px 6px 12px 0",
                      borderBottom: `1px solid ${C.rule}`,
                      fontSize: 11.5,
                      fontWeight: 300,
                      verticalAlign: "top",
                    }}
                  >
                    {r}
                  </td>
                  <td
                    style={{
                      padding: "12px 0",
                      borderBottom: `1px solid ${C.rule}`,
                      fontSize: 11.5,
                      fontWeight: 300,
                    }}
                  >
                    {t}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              marginTop: 16,
              fontSize: 9,
              fontWeight: 300,
              color: C.label,
              lineHeight: 1.5,
            }}
          >
            A close-up of a plumbing or electrical point still gets its own row
            — mark where you stood and which way you pointed the camera, exactly
            like any other shot.
          </div>
        </Page>

        {/* ============ 04 FLOOR LAYOUT ============ */}
        <Page>
          <SectionTitle no="04">Layout &amp; Photo Sheets</SectionTitle>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.black,
              marginBottom: 22,
            }}
          >
            FLOOR LAYOUT
          </div>
          {[0, 1].map((i) => (
            <DashedBox
              key={i}
              style={{
                width: "100%",
                height: 250,
                marginBottom: 40,
                justifyContent: "flex-start",
                padding: floorLayouts[i] ? 6 : 8,
              }}
            >
              {floorLayouts[i] ? (
                <img
                  src={floorLayouts[i]}
                  alt="Floor layout"
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                "Paste floor layout here"
              )}
            </DashedBox>
          ))}
        </Page>

        {/* ============ 04 ROOM SHEETS ============ */}
        {roomPages.length === 0 && (
          <Page>
            <div style={{ fontSize: 11, fontWeight: 300, color: C.label }}>
              No rooms recorded.
            </div>
          </Page>
        )}
        {roomPages.map(({ room, part, pi, last, ri, hint, offset }) => (
          <Page key={`${room.id}-${pi}`}>
            {ri === 0 && pi === 0 && (
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 300,
                  color: "#555",
                  marginBottom: 22,
                  lineHeight: 1.5,
                }}
              >
                One block per room. Each row is one photo and its matching
                layout arrow. Duplicate a row for extra photos; leave rows blank
                if you needed fewer.
              </div>
            )}
            {pi === 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.black }}>
                  {room.room_name}
                </div>
                {hint && (
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 300,
                      color: C.label,
                      marginTop: 8,
                    }}
                  >
                    {hint}
                  </div>
                )}
              </div>
            )}
            {part.length === 0 ? (
              <ShotRow photo={null} n={1} floorThumb={floorThumb} />
            ) : (
              part.map((p, k) => (
                <ShotRow
                  key={p.id || k}
                  photo={p}
                  n={p.shot_number ?? offset + k + 1}
                  floorThumb={floorThumb}
                />
              ))
            )}
            {last && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 9,
                  fontWeight: 300,
                  color: C.label,
                }}
              >
                Took more photos than rows here? Duplicate a row. Took fewer?
                Leave the rest blank.
              </div>
            )}
          </Page>
        ))}
      </div>
    </Shell>
  );
}
