import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Download,
  Loader2,
  Camera,
  MapPin,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetSiteRecceQuery,
  useDeleteSiteRecceMutation,
} from "../../api/site-recce.api";

// npm i html2canvas jspdf

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

const SITE_TYPES = ["FLAT", "FLOOR", "KOTHI", "RAW"];

const ROOM_CAPTURE_GUIDE = [
  {
    room: "Living & Dining",
    covers: "Every wall, the ceiling, the floor, and each window and door.",
  },
  {
    room: "Bedrooms",
    covers: "Every wall, the ceiling, the floor, and the window.",
  },
  {
    room: "Kitchen",
    covers:
      "Every wall, plus a close-up of every existing plumbing point and every existing electrical point.",
  },
  {
    room: "Bathroom",
    covers:
      "Every wall, plus a close-up of the floor drain and the ventilation point.",
  },
  {
    room: "Balcony",
    covers:
      "Every wall, the railing, the floor drain, and the view looking out.",
  },
];

/* ---------------------------------------------------------------- */
/* helpers                                                           */
/* ---------------------------------------------------------------- */

const show = (v, suffix = "") =>
  v === null || v === undefined || v === "" ? "—" : `${v}${suffix}`;

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

/* ---------------------------------------------------------------- */
/* pagination helpers — chunk dynamic content the way the printed    */
/* template physically breaks across pages, not just by section      */
/* ---------------------------------------------------------------- */

// Page 3 (Utilities + Existing Condition + table header) has little room
// left for table rows; continuation pages are just the table, so they
// hold far more rows each.
const ROOM_TABLE_FIRST_PAGE_ROWS = 4;
const ROOM_TABLE_CONT_PAGE_ROWS = 14;

function chunkRows(items, firstSize, restSize) {
  const chunks = [];
  let i = 0;
  let first = true;
  if (items.length === 0) return [[]];
  while (i < items.length) {
    const size = first ? firstSize : restSize;
    chunks.push(items.slice(i, i + size));
    i += size;
    first = false;
  }
  return chunks;
}

// Living/dining runs bigger in the template (3 shots per page across two
// pages); every other room type takes 4 shots per page.
const LARGE_ROOM_MATCH = ["LIVING", "DINING", "HALL"];
const BEDROOM_MATCH = ["BEDROOM"];

function shotsPerPage(room) {
  const type = `${room.room_type || ""} ${room.room_name || ""}`.toUpperCase();
  if (LARGE_ROOM_MATCH.some((t) => type.includes(t))) return 3;
  return 4;
}

function roomHint(room) {
  const type = `${room.room_type || ""} ${room.room_name || ""}`.toUpperCase();
  if (LARGE_ROOM_MATCH.some((t) => type.includes(t))) {
    return "A larger room — plan for six to ten photos.";
  }
  if (BEDROOM_MATCH.some((t) => type.includes(t))) {
    return "Four to six photos is typical.";
  }
  return null;
}

function chunkShots(photos, perPage) {
  const list = photos || [];
  if (list.length === 0) return [[]];
  const chunks = [];
  for (let i = 0; i < list.length; i += perPage) {
    chunks.push(list.slice(i, i + perPage));
  }
  return chunks;
}

/* ---------------------------------------------------------------- */
/* shared presentational primitives                                 */
/* ---------------------------------------------------------------- */

function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      {number && (
        <div
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: BRAND.green }}
        >
          {number}
        </div>
      )}
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

function Field({ label, value, className = "" }) {
  return (
    <div className={className}>
      <span
        className="text-[11px] tracking-wide uppercase block mb-1"
        style={{ color: BRAND.muted }}
      >
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: BRAND.ink }}>
        {value}
      </span>
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

/* Placeholder box used for layout image / photo image slots and diagram examples */
function PlaceholderBox({ icon: Icon, label, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 border border-dashed ${className}`}
      style={{
        backgroundColor: "#F8F9F5",
        borderColor: "#C9C4B4",
        color: "#9A9587",
      }}
    >
      <Icon size={22} strokeWidth={1.5} />
      <span className="text-[11px] uppercase tracking-wide text-center px-2">
        {label}
      </span>
    </div>
  );
}

/* Small running header repeated on every content page, matching the PDF */
function PageHeader() {
  return (
    <div
      className="px-10 pt-6 pb-2 text-right text-[10px] uppercase tracking-[0.14em]"
      style={{ color: BRAND.muted }}
    >
      Site Recce Format
    </div>
  );
}

function PageFooter({ address }) {
  return (
    <div
      className="px-10 py-4 flex justify-between text-[10px] uppercase tracking-[0.12em]"
      style={{ color: BRAND.muted, borderTop: `1px solid ${BRAND.line}` }}
    >
      <span>Site Recce Format</span>
      <span>{address}</span>
    </div>
  );
}

/* A single Shot row: layout image (left) + photo (right), like Part 2 of the PDF */
function ShotRow({ photo, index }) {
  const meta = [photo.standing_position, photo.camera_direction]
    .filter(Boolean)
    .join(" • ");

  return (
    <div
      className="grid grid-cols-2 gap-6 py-6"
      style={{ borderBottom: `1px solid ${BRAND.line}` }}
    >
      <div>
        <div
          className="text-[12px] font-semibold mb-2"
          style={{ color: BRAND.green }}
        >
          SHOT {photo.shot_number ?? index + 1} — LAYOUT
        </div>
        {photo.layout_image_url ? (
          <img
            src={photo.layout_image_url}
            alt={photo.layout_file_name || "Layout"}
            className="w-full h-56 object-contain rounded-lg bg-white"
            style={{ border: `1px solid ${BRAND.line}` }}
            crossOrigin="anonymous"
          />
        ) : (
          <PlaceholderBox
            icon={MapPin}
            label="Layout not attached"
            className="w-full h-56 rounded-lg"
          />
        )}
      </div>
      <div>
        <div
          className="text-[12px] font-semibold mb-2"
          style={{ color: BRAND.green }}
        >
          PHOTO {photo.shot_number ?? index + 1}
        </div>
        {photo.photo_url ? (
          <img
            src={photo.photo_url}
            alt={photo.photo_file_name || "Site photo"}
            className="w-full h-56 object-cover rounded-lg"
            style={{ border: `1px solid ${BRAND.line}` }}
            crossOrigin="anonymous"
          />
        ) : (
          <PlaceholderBox
            icon={Camera}
            label="Photo not attached"
            className="w-full h-56 rounded-lg"
          />
        )}
      </div>
      {(meta || photo.notes) && (
        <div
          className="col-span-2 -mt-2 text-[12px]"
          style={{ color: BRAND.muted }}
        >
          {meta && <span>{meta}</span>}
          {meta && photo.notes && <span> • </span>}
          {photo.notes && <span>{photo.notes}</span>}
        </div>
      )}
    </div>
  );
}

function RoomMeasurementsTable({ rows }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr
          className="text-left"
          style={{ borderBottom: `2px solid ${BRAND.green}` }}
        >
          <th
            className="py-2 pr-4 font-semibold"
            style={{ color: BRAND.green }}
          >
            Room
          </th>
          <th
            className="py-2 pr-4 font-semibold"
            style={{ color: BRAND.green }}
          >
            Length
          </th>
          <th
            className="py-2 pr-4 font-semibold"
            style={{ color: BRAND.green }}
          >
            Width
          </th>
          <th
            className="py-2 pr-4 font-semibold"
            style={{ color: BRAND.green }}
          >
            Height
          </th>
          <th className="py-2 font-semibold" style={{ color: BRAND.green }}>
            Existing Flooring / Ceiling / Notes
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((room) => {
          const unit = (room.measurement_unit || "FT").toLowerCase();
          const details = [
            room.existing_flooring && `Flooring: ${room.existing_flooring}`,
            room.existing_ceiling && `Ceiling: ${room.existing_ceiling}`,
            room.notes,
          ]
            .filter(Boolean)
            .join(" • ");
          return (
            <tr
              key={room.id}
              style={{ borderBottom: `1px solid ${BRAND.line}` }}
            >
              <td className="py-3 pr-4 align-top">
                <div className="font-medium" style={{ color: BRAND.ink }}>
                  {room.room_name}
                </div>
                <div
                  className="text-[11px] uppercase"
                  style={{ color: BRAND.muted }}
                >
                  {room.room_type}
                  {room.room_number ? ` • ${room.room_number}` : ""}
                </div>
              </td>
              <td className="py-3 pr-4 align-top">
                {show(room.length, ` ${unit}`)}
              </td>
              <td className="py-3 pr-4 align-top">
                {show(room.width, ` ${unit}`)}
              </td>
              <td className="py-3 pr-4 align-top">
                {show(room.height, ` ${unit}`)}
              </td>
              <td className="py-3 align-top" style={{ color: BRAND.ink }}>
                {details || "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ---------------------------------------------------------------- */
/* main view                                                          */
/* ---------------------------------------------------------------- */

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

  const contentRef = useRef(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const downloadPdf = async () => {
    if (!contentRef.current || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const pageNodes = contentRef.current.querySelectorAll(".recce-page");
      if (!pageNodes.length) {
        toast.error("Nothing to export yet");
        return;
      }

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageNodes.length; i++) {
        const canvas = await html2canvas(pageNodes[i], {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          ignoreElements: (el) => el.classList?.contains("no-print"),
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);

        // Fit the captured page inside the A4 canvas, centered.
        const ratio = Math.min(
          pageWidth / canvas.width,
          pageHeight / canvas.height,
        );
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
      }

      const nameSource =
        recce?.project?.name || recce?.project_name || "site-recce";
      const safeName = nameSource
        .toString()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^\w-]/g, "");
      pdf.save(`${safeName || "site-recce"}_recce_report.pdf`);
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

  const project = recce.project || {};
  const siteEngineer = recce.site_engineer || {};
  const rooms = recce.rooms || [];
  const addressLine = [
    project.name || recce.project_name,
    recce.site_address || project.site_location,
  ]
    .filter(Boolean)
    .join(", ");

  const roomTableChunks = chunkRows(
    rooms,
    ROOM_TABLE_FIRST_PAGE_ROWS,
    ROOM_TABLE_CONT_PAGE_ROWS,
  );

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
            style={{ backgroundColor: BRAND.green }}
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
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .recce-page { break-after: page; }
          .recce-page:last-child { break-after: auto; }
          .shot-row { break-inside: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* ✅ ref attached here — this was the missing piece */}
      <div ref={contentRef} className="max-w-4xl mx-auto space-y-6">
        {/* ============================================================ */}
        {/* PAGE 1 — Cover                                                */}
        {/* ============================================================ */}
        <div
          className="recce-page shadow-sm print:shadow-none flex flex-col items-center text-center px-14 pt-20 pb-10"
          style={{
            backgroundColor: BRAND.paper,
            border: `1px solid ${BRAND.line}`,
          }}
        >
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
            SITE RECCE FORMAT
          </div>

          <div className="h-24" />

          <div className="w-full text-left mt-auto">
            <div
              className="text-[11px] uppercase tracking-[0.14em] pb-3 mb-6"
              style={{
                color: BRAND.muted,
                borderBottom: `1px solid ${BRAND.line}`,
              }}
            >
              To be filled by the site engineer at the survey visit
            </div>
            <div className="grid grid-cols-2 gap-x-10">
              <div
                className="pb-3"
                style={{ borderBottom: `2px solid ${BRAND.gold}` }}
              >
                <div
                  className="text-[11px] uppercase tracking-wide font-semibold"
                  style={{ color: BRAND.gold }}
                >
                  Part 1
                </div>
                <div className="text-sm mt-1" style={{ color: BRAND.ink }}>
                  Text &amp; Content Details
                </div>
              </div>
              <div
                className="pb-3"
                style={{ borderBottom: `2px solid ${BRAND.gold}` }}
              >
                <div
                  className="text-[11px] uppercase tracking-wide font-semibold"
                  style={{ color: BRAND.gold }}
                >
                  Part 2
                </div>
                <div className="text-sm mt-1" style={{ color: BRAND.ink }}>
                  Layout &amp; Photo Reference
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PAGE 2 — 01 Project & Site Details + Access for Material     */}
        {/* ============================================================ */}
        <div
          className="recce-page shadow-sm print:shadow-none"
          style={{
            backgroundColor: BRAND.paper,
            border: `1px solid ${BRAND.line}`,
          }}
        >
          <PageHeader />

          <div
            className="px-10 pb-8"
            style={{ borderBottom: `1px solid ${BRAND.line}` }}
          >
            <SectionHeader number="01" title="Project & Site Details" />

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm mb-6">
              <Field
                label="Project Name"
                value={show(project.name || recce.project_name)}
              />
              <Field label="Client Name" value={show(recce.client_name)} />
            </div>

            <div className="mb-6">
              <Field
                label="Site Address"
                value={show(recce.site_address || project.site_location)}
              />
            </div>

            <div className="grid grid-cols-3 gap-x-8 gap-y-6 text-sm mb-6">
              <Field label="Date of Recce" value={fmtDate(recce.recce_date)} />
              <Field label="Site Engineer" value={show(siteEngineer.name)} />
              <Field
                label="Accompanied By"
                value={show(recce.accompanied_by)}
              />
            </div>

            <div className="grid grid-cols-3 gap-x-8 gap-y-6 text-sm mb-6">
              <Field
                label="Unit / Floor No."
                value={show(recce.unit_floor_no)}
              />
              <Field
                label="Carpet Area (approx. sq ft)"
                value={show(recce.carpet_area_sqft)}
              />
              <Field label="No. of Rooms" value={show(recce.number_of_rooms)} />
            </div>

            <div className="grid grid-cols-3 gap-x-8 gap-y-6 text-sm mb-8">
              <Field
                label="Build Up Area (approx. sq ft)"
                value={show(recce.built_up_area_sqft)}
              />
              <Field
                label="No. of Floors"
                value={show(recce.number_of_floors)}
              />
            </div>

            <div>
              <span
                className="text-[11px] tracking-wide uppercase block mb-3"
                style={{ color: BRAND.muted }}
              >
                Site Type — tick one
              </span>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {SITE_TYPES.map((t) => (
                  <CheckOption
                    key={t}
                    label={t}
                    checked={recce.site_type === t}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-10 py-8">
            <SectionHeader title="Access for Material & Labour" />
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 text-sm">
              <Field
                label="Lift Available (Y/N) & Size"
                value={
                  recce.lift_available
                    ? `Yes${recce.lift_size ? " • " + recce.lift_size : ""}`
                    : "No"
                }
              />
              <Field
                label="Staircase Width"
                value={show(recce.staircase_width)}
              />
              <Field
                label="Material Entry Point"
                value={show(recce.material_entry_point)}
              />
            </div>
          </div>

          <PageFooter address={addressLine} />
        </div>

        {/* ============================================================ */}
        {/* PAGE 3 — Utilities + Existing Condition + 02 Room Table       */}
        {/* ============================================================ */}
        <div
          className="recce-page shadow-sm print:shadow-none"
          style={{
            backgroundColor: BRAND.paper,
            border: `1px solid ${BRAND.line}`,
          }}
        >
          <PageHeader />

          <div
            className="px-10 pb-8"
            style={{ borderBottom: `1px solid ${BRAND.line}` }}
          >
            <SectionHeader title="Utilities Available on Site" />
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 text-sm mb-6">
              <Field
                label="Water Connection"
                value={show(recce.water_connection)}
              />
              <Field
                label="Power Load Available"
                value={show(recce.power_load_available)}
              />
              <Field
                label="Drainage Point Location"
                value={show(recce.drainage_point_location)}
              />
            </div>
            <div className="grid grid-cols-1 gap-y-6 text-sm">
              <Field
                label="Society / RWA Restrictions"
                value={show(recce.society_rwa_restrictions)}
              />
              <div className="grid grid-cols-2 gap-x-8">
                <Field
                  label="Working Hours Allowed"
                  value={show(recce.working_hours_allowed)}
                />
                <Field
                  label="Material Movement Rule"
                  value={show(recce.material_movement_rule)}
                />
              </div>
            </div>
          </div>

          <div
            className="px-10 py-8"
            style={{ borderBottom: `1px solid ${BRAND.line}` }}
          >
            <SectionHeader title="Existing Condition" />
            <p className="text-[13px] mb-3" style={{ color: BRAND.muted }}>
              Seepage, cracks, prior alterations, damage — recorded before any
              work touched the site.
            </p>
            <div
              className="text-sm leading-relaxed"
              style={{ color: BRAND.ink }}
            >
              {show(recce.existing_condition)}
            </div>
          </div>

          <div className="px-10 py-8">
            <SectionHeader number="02" title="Room-Wise Measurements" />
            {rooms.length === 0 ? (
              <p className="text-sm" style={{ color: BRAND.muted }}>
                No rooms recorded.
              </p>
            ) : (
              <RoomMeasurementsTable rows={roomTableChunks[0]} />
            )}
          </div>

          <PageFooter address={addressLine} />
        </div>

        {/* ============================================================ */}
        {/* PAGE 3B, 3C, ... — table continuation pages                  */}
        {/* ============================================================ */}
        {roomTableChunks.slice(1).map((chunk, i) => (
          <div
            key={`room-table-cont-${i}`}
            className="recce-page shadow-sm print:shadow-none px-10 py-8"
            style={{
              backgroundColor: BRAND.paper,
              border: `1px solid ${BRAND.line}`,
            }}
          >
            <PageHeader />
            <RoomMeasurementsTable rows={chunk} />
            <PageFooter address={addressLine} />
          </div>
        ))}

        {/* ============================================================ */}
        {/* PAGE 4 — 03 How to Document the Layout & Photos               */}
        {/* ============================================================ */}
        <div
          className="recce-page shadow-sm print:shadow-none px-10 py-8"
          style={{
            backgroundColor: BRAND.paper,
            border: `1px solid ${BRAND.line}`,
          }}
        >
          <SectionHeader
            number="03"
            title="How to Document the Layout & Photos"
          />

          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: BRAND.ink }}
          >
            One photo. One arrow. One copy of the layout. That is the whole
            method — repeated as many times as you took photos in that room.
          </p>

          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <div
                className="text-[11px] uppercase tracking-wide font-semibold mb-3"
                style={{ color: BRAND.muted }}
              >
                1. Mark where you stood
              </div>
              <PlaceholderBox
                icon={MapPin}
                label="Layout with dot & arrow"
                className="w-full h-40 rounded-lg"
              />
              <p className="text-xs mt-2" style={{ color: BRAND.muted }}>
                One dot. One arrow, pointing the way the camera faced.
              </p>
            </div>
            <div>
              <div
                className="text-[11px] uppercase tracking-wide font-semibold mb-3"
                style={{ color: BRAND.muted }}
              >
                2. Paste that photo next to it
              </div>
              <PlaceholderBox
                icon={Camera}
                label="Matching photo"
                className="w-full h-40 rounded-lg"
              />
              <p className="text-xs mt-2" style={{ color: BRAND.muted }}>
                The photo taken from that spot, in that direction.
              </p>
            </div>
          </div>

          <div className="mb-10">
            <div
              className="text-[11px] uppercase tracking-wide font-semibold mb-3"
              style={{ color: BRAND.muted }}
            >
              Same room, four photos
            </div>
            <div className="grid grid-cols-2 gap-8 items-start">
              <div className="space-y-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <PlaceholderBox
                      icon={Camera}
                      label={`${n}`}
                      className="w-10 h-10 rounded shrink-0"
                    />
                    <span className="text-xs" style={{ color: BRAND.ink }}>
                      Photo {n} + its own layout copy
                    </span>
                  </div>
                ))}
              </div>
              <PlaceholderBox
                icon={MapPin}
                label="Four dots, four arrows — one per corner"
                className="w-full h-44 rounded-lg"
              />
            </div>
            <p className="text-xs mt-2" style={{ color: BRAND.muted }}>
              Four photos taken in this room means four separate
              layout-and-photo pairs on the sheet — not one shared layout.
            </p>
          </div>

          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: "#F8F9F5" }}
          >
            <div
              className="text-[11px] uppercase tracking-wide font-semibold mb-3"
              style={{ color: BRAND.muted }}
            >
              How to fill Part 2, step by step
            </div>
            <ol
              className="text-sm space-y-2 list-decimal list-inside"
              style={{ color: BRAND.ink }}
            >
              <li>
                For every photo you take in a room, use one row on that room's
                sheet.
              </li>
              <li>
                Paste or insert a copy of the room's layout into the left box of
                that row.
              </li>
              <li>
                On that layout, mark one dot where you were standing, and draw
                one arrow from the dot showing exactly which way the camera was
                pointed.
              </li>
              <li>
                Paste the matching photo into the right box of the same row.
              </li>
              <li>
                Move to the next row for your next photo. Do not put more than
                one arrow on a single layout copy — a layout with two arrows
                does not say which photo is which.
              </li>
            </ol>
          </div>

          <PageFooter address={addressLine} />
        </div>

        {/* ============================================================ */}
        {/* PAGE 5 — 03.1 What to Capture, Room by Room (static guide)    */}
        {/* ============================================================ */}
        <div
          className="recce-page shadow-sm print:shadow-none px-10 py-8"
          style={{
            backgroundColor: BRAND.paper,
            border: `1px solid ${BRAND.line}`,
          }}
        >
          <SectionHeader
            number="03.1"
            title="What to Make Sure You Capture, Room by Room"
          />
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr
                className="text-left"
                style={{ borderBottom: `2px solid ${BRAND.green}` }}
              >
                <th
                  className="py-2 pr-4 font-semibold w-[22%]"
                  style={{ color: BRAND.green }}
                >
                  Room
                </th>
                <th
                  className="py-2 font-semibold"
                  style={{ color: BRAND.green }}
                >
                  Make Sure One Photo Each Covers
                </th>
              </tr>
            </thead>
            <tbody>
              {ROOM_CAPTURE_GUIDE.map((row) => (
                <tr
                  key={row.room}
                  style={{ borderBottom: `1px solid ${BRAND.line}` }}
                >
                  <td
                    className="py-3 pr-4 align-top font-medium"
                    style={{ color: BRAND.ink }}
                  >
                    {row.room}
                  </td>
                  <td className="py-3 align-top" style={{ color: BRAND.ink }}>
                    {row.covers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs" style={{ color: BRAND.muted }}>
            A close-up of a plumbing or electrical point still gets its own row
            — mark where you stood and which way you pointed the camera, exactly
            like any other shot.
          </p>
          <PageFooter address={addressLine} />
        </div>

        {/* ============================================================ */}
        {/* PAGE 6+ — 04 Layout & Photo Sheets (one page-group per room)  */}
        {/* ============================================================ */}
        {rooms.flatMap((room, roomIdx) => {
          const perPage = shotsPerPage(room);
          const hint = roomHint(room);
          const chunks = chunkShots(room.photos, perPage);

          return chunks.map((chunk, chunkIdx) => {
            const isFirstChunk = chunkIdx === 0;
            const isLastChunk = chunkIdx === chunks.length - 1;

            return (
              <div
                key={`${room.id}-${chunkIdx}`}
                className="recce-page shadow-sm print:shadow-none px-10 py-8"
                style={{
                  backgroundColor: BRAND.paper,
                  border: `1px solid ${BRAND.line}`,
                }}
              >
                <PageHeader />
                {roomIdx === 0 && isFirstChunk && (
                  <SectionHeader number="04" title="Layout & Photo Sheets" />
                )}

                {isFirstChunk && (
                  <div className="mb-6">
                    <div
                      className="text-[15px] font-semibold"
                      style={{ color: BRAND.green }}
                    >
                      {room.room_name}
                    </div>
                    <div
                      className="text-[12px] uppercase tracking-wide"
                      style={{ color: BRAND.muted }}
                    >
                      {room.room_type}
                      {room.room_number ? ` • ${room.room_number}` : ""} •{" "}
                      {(room.photos || []).length} photo
                      {(room.photos || []).length !== 1 ? "s" : ""}
                    </div>
                    {hint && (
                      <div
                        className="text-xs italic mt-1"
                        style={{ color: BRAND.muted }}
                      >
                        {hint}
                      </div>
                    )}
                  </div>
                )}

                {chunk.length === 0 ? (
                  isFirstChunk && (
                    <p className="text-sm" style={{ color: BRAND.muted }}>
                      No shots recorded for this room.
                    </p>
                  )
                ) : (
                  <div>
                    {chunk.map((photo, idx) => (
                      <div key={photo.id} className="shot-row">
                        <ShotRow
                          photo={photo}
                          index={chunkIdx * perPage + idx}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {isLastChunk && chunk.length > 0 && (
                  <p className="text-xs mt-4" style={{ color: BRAND.muted }}>
                    Took more photos than rows here? Duplicate a row. Took
                    fewer? Leave the rest blank.
                  </p>
                )}

                <PageFooter address={addressLine} />
              </div>
            );
          });
        })}

        {/* Footer */}
        <div
          className="no-print text-xs text-center pb-6"
          style={{ color: BRAND.muted }}
        >
          Site Recce ID: {recce.id}
        </div>
      </div>
    </Shell>
  );
}
