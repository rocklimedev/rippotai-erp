import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Printer, CheckCircle2 } from "lucide-react";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetPlanOfActionQuery,
  useDeletePlanOfActionMutation,
  usePublishPlanOfActionMutation,
} from "../../api/plan-of-actions.api";
import logo from "../../assets/rippotai_logo.png";
// ---- Brand tokens (matched to the Rippotai Plan of Action document) ----
const GREEN = "#16352A";
const GOLD = "#C6A15B";
const HAIRLINE = "#DCCFAE";
const INK = "#1F2937";
const MUTED = "#6B7280";

const statusBadgeClass = (status) => {
  switch (status) {
    case "published":
      return "bg-[#E4F3E8] text-[#1F7A3D]";
    case "review":
      return "bg-[#FDEFD9] text-[#B0740F]";
    default:
      return "bg-[#EAEEF0] text-[#333333]";
  }
};
const chunkPhases = (items, size = 7) => {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};
// Parses the stored terms HTML (h3/p pairs) into numbered { title, body } items
function parseTermsHtml(html) {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nodes = Array.from(doc.body.children);
    const items = [];
    let current = null;
    nodes.forEach((node) => {
      const tag = node.tagName?.toLowerCase();
      if (tag === "h2") return; // skip top-level "Terms & Conditions" heading
      if (tag === "h3") {
        current = {
          title: node.textContent.replace(/^\d+\.\s*/, "").trim(),
          body: [],
        };
        items.push(current);
      } else if (current) {
        current.body.push(node.textContent.trim());
      }
    });
    return items;
  } catch {
    return [];
  }
}

// Distributes phases across an indicative overlapping timeline (P1..Pn) the
// same way the source document staggers "MEP & Waterproofing" -> "Handover"
function computeOverlapBars(count) {
  if (!count) return [];
  const isLast = (i) => i === count - 1;
  return Array.from({ length: count }, (_, i) => {
    if (isLast(i)) {
      return { startPct: 96, widthPct: 4, marker: true };
    }
    const usable = count <= 2 ? count : count - 1;
    const widthPct = Math.max(18, 62 / usable);
    const startPct = (i / Math.max(1, usable)) * (94 - widthPct);
    return { startPct, widthPct, marker: false };
  });
}

const LogoMark = () => (
  <img src={logo} alt="Rippotai" className="h-[120px] w-auto object-contain" />
);

const FieldRow = ({ children }) => (
  <div
    className="grid grid-cols-2 gap-8 py-3 poa-avoid-break"
    style={{ borderBottom: `1px solid ${HAIRLINE}` }}
  >
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <span
      className="text-[11px] tracking-wide uppercase"
      style={{ color: MUTED }}
    >
      {label}:{" "}
    </span>
    <span className="text-[13px] font-semibold" style={{ color: INK }}>
      {value || "—"}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Pagination — on screen AND on export
// ---------------------------------------------------------------------------
// The document is meant to read as four discrete pages:
//   1. Cover
//   2. How the Execution runs (overview + overlap chart)
//   3. Phase Detail Timeline
//   4. Terms & Conditions
//
// On screen, each `.poa-page` renders as its own bounded A4 "sheet" — fixed
// width/min-height, white background, shadow, and a gap before the next
// sheet — sitting on a muted backdrop, the way a PDF viewer shows pages.
// That gives an accurate live preview of the pagination before anyone
// clicks Print.
//
// On print, all of that screen-only chrome (shadow, gap, backdrop, page
// label) is stripped via @media print overrides, each sheet becomes a full
// page with `break-after: page`, and every repeating row inside a section
// carries `poa-avoid-break` so a single phase or term is never split across
// a page boundary. `.poa-page-last` avoids a trailing forced break that some
// print engines turn into a blank fifth page.
//
// Printing scope — `.poa-print-area`
// -----------------------------------
// `window.print()` prints the whole current page by default, which would
// include the Shell's header/sidebar/action buttons surrounding this
// component. To print ONLY the document itself, `@media print` first hides
// every element on the page (`body * { visibility: hidden }`) and then
// re-reveals just the `.poa-print-area` wrapper (the backdrop containing all
// four `.poa-page` sheets) and everything inside it. Because `visibility`
// (unlike `display`) still reserves layout space, the revealed area is also
// pulled out of the app's layout flow with `position: absolute; top:0;
// left:0` so it doesn't print with a blank gap where the hidden header used
// to sit.
const A4_WIDTH_PX = 794; // 210mm @ 96dpi
const A4_MIN_HEIGHT_PX = 1123; // 297mm @ 96dpi

const PrintStyles = () => (
  <style>{`
    .poa-preview-backdrop {
      background: #57595c;
      padding: 40px 0 64px;
    }
    .poa-page {
      width: ${A4_WIDTH_PX}px;
      min-height: ${A4_MIN_HEIGHT_PX}px;
      margin: 0 auto 40px;
      background: #fff;
      box-shadow: 0 8px 30px rgba(0,0,0,.35);
      position: relative;
    }
    .poa-page-label {
      position: absolute;
      top: -24px;
      left: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #d6d6d6;
    }
    @media print {
      /* Hide everything on the page by default... */
      body * {
        visibility: hidden;
      }
      /* ...then reveal only the printable document and its contents */
      .poa-print-area,
      .poa-print-area * {
        visibility: visible;
      }
      /* Pull the printable area out of the app layout so hidden siblings
         (header/sidebar) don't leave blank reserved space on the page */
      .poa-print-area {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }

      @page {
        size: A4;
        margin: 0;
      }
      .poa-preview-backdrop {
        background: none;
        padding: 0;
      }
      .poa-page {
        width: auto;
        min-height: 0;
        margin: 0;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }
      /* Only the cover page needs a real page-height box — its logo block
         centers vertically via flex-1, which needs something to grow
         into. Scoping this to just the cover (instead of every .poa-page)
         keeps the other pages sizing naturally off their own content,
         which is what lets break-after: page land cleanly without an
         oversized box spilling a row onto the next physical page. */
      .poa-page-cover {
        height: 297mm;
        box-sizing: border-box;
        overflow: hidden;
      }
      .poa-page-label {
        display: none;
      }
      .poa-page-last {
        break-after: auto;
        page-break-after: auto;
      }
      .poa-avoid-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  `}</style>
);

const PageLabel = ({ index, title }) => (
  <div className="poa-page-label print:hidden">
    Page {index} of 4 · {title}
  </div>
);

export function PlanOfActionView() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    data: poa,
    isFetching,
    isError,
  } = useGetPlanOfActionQuery(id, { skip: !id });
  const [deletePlanOfAction, { isLoading: deleting }] =
    useDeletePlanOfActionMutation();
  const [publishPlanOfAction, { isLoading: publishing }] =
    usePublishPlanOfActionMutation();

  const removePlan = async () => {
    if (!window.confirm("Delete this Plan of Action? This cannot be undone."))
      return;
    try {
      await deletePlanOfAction(id).unwrap();
      toast.success("Plan of Action deleted");
      nav("/documents/all");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to delete");
    }
  };

  const publishPlan = async () => {
    if (
      !window.confirm(
        "Publish this Plan of Action? The client will be able to view it.",
      )
    )
      return;
    try {
      await publishPlanOfAction(id).unwrap();
      toast.success("Plan of Action published");
    } catch (e) {
      toast.error(e?.data?.detail || "Failed to publish");
    }
  };

  const printReport = () => window.print();

  const phases = useMemo(() => {
    const list = [...(poa?.phases || [])];
    return list.sort(
      (a, b) =>
        (a.PlanOfActionPhase?.sort_order ?? a.sort_order ?? 0) -
        (b.PlanOfActionPhase?.sort_order ?? b.sort_order ?? 0),
    );
  }, [poa]);
  const phasePages = useMemo(() => chunkPhases(phases, 7), [phases]);
  const overlapBars = useMemo(
    () => computeOverlapBars(phases.length),
    [phases.length],
  );
  const termItems = useMemo(
    () => parseTermsHtml(poa?.terms_content_snapshot),
    [poa?.terms_content_snapshot],
  );

  if (isFetching) {
    return (
      <Shell title="Plan of Action">
        <div className="text-[13px] text-[#6B7B7C]">Loading…</div>
      </Shell>
    );
  }

  if (isError || !poa) {
    return (
      <Shell title="Plan of Action">
        <Card>
          <div className="text-center text-[#B5C4B6] py-8">
            Plan of Action not found, or you don't have access to it.
          </div>
        </Card>
      </Shell>
    );
  }

  const project = poa.project || {};

  return (
    <Shell
      title="Plan of Action"
      subtitle={`${project.name || "Project"} • v${poa.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/documents/all")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => nav(`/documents/plan-of-action/${id}/edit`)}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Edit
          </button>
          {poa.status !== "published" && (
            <button
              onClick={publishPlan}
              disabled={publishing}
              className="h-10 px-4 rounded-lg border border-[#1F7A3D] text-[13px] font-semibold text-[#1F7A3D] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Publish
            </button>
          )}
          <button
            onClick={printReport}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={removePlan}
            disabled={deleting}
            className="h-10 px-4 rounded-lg border border-[#E3B7A4] text-[13px] font-semibold text-[#B04D26] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      }
    >
      <PrintStyles />

      <div className="poa-preview-backdrop poa-print-area">
        {/* Status ribbon (not in source doc — kept minimal so it doesn't disturb the layout) */}
        <div className="flex justify-end max-w-[794px] mx-auto mb-4 print:hidden">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(
              poa.status,
            )}`}
          >
            {poa.status?.toUpperCase() || "DRAFT"}
          </span>
        </div>

        {/* ================= PAGE 1 — COVER ================= */}
        <div className="poa-page px-16 pt-10 pb-24 flex flex-col items-center">
          <PageLabel index={1} title="Cover" />

          {/* LOGO + CONTENT CENTERED ON PAGE */}
          <div className="flex flex-col items-center justify-center flex-1 w-full">
            {/* LOGO */}
            <LogoMark />

            {/* BRAND NAME */}
            <div
              className="mt-6 text-center font-serif tracking-[0.25em] text-3xl"
              style={{ color: GREEN }}
            >
              RIPPŌTAI
            </div>

            {/* TITLE */}
            <div
              className="text-center tracking-[0.2em] text-sm mt-1"
              style={{ color: MUTED }}
            >
              PLAN OF ACTION
            </div>

            {/* PROJECT INFORMATION */}
            <div className="w-full mt-20">
              <FieldRow>
                <Field label="Project" value={project.name} />
                <div />
              </FieldRow>

              <FieldRow>
                <Field label="Address" value={project.site_location} />
                <Field label="Client" value={project.client_name} />
              </FieldRow>

              <FieldRow>
                <Field
                  label="Principle Architect"
                  value={poa.principal_architect || project.architect_name}
                />

                <Field
                  label="Project Lead"
                  value={poa.project_lead || project.project_lead_name}
                />
              </FieldRow>
            </div>
          </div>
        </div>
        {/* ================= PAGE 2 — HOW THE EXECUTION RUNS ================= */}
        <div className="poa-page px-16 py-16">
          <PageLabel index={2} title="How the Execution runs" />
          <h1 className="text-3xl font-normal" style={{ color: INK }}>
            How the Execution runs
          </h1>
          <div
            className="mt-6 pt-6"
            style={{ borderTop: `1px solid ${INK}` }}
          />

          {poa.execution_description && (
            <p
              className="text-[13px] leading-relaxed mt-6 max-w-3xl"
              style={{ color: "#374151" }}
            >
              {poa.execution_description}
            </p>
          )}

          <div
            className="mt-10 pt-6"
            style={{ borderTop: `1px solid ${GOLD}` }}
          >
            <div className="grid grid-cols-2 gap-16 mt-6">
              <div>
                <div className="text-4xl font-normal" style={{ color: INK }}>
                  {String(poa.total_phases ?? phases.length).padStart(2, "0")}
                </div>
                <div className="text-[13px] mt-2" style={{ color: MUTED }}>
                  Execution phases from services to handover
                </div>
              </div>
              <div>
                <div className="text-4xl font-normal" style={{ color: INK }}>
                  {poa.total_duration_label ||
                    (poa.total_duration_min_days && poa.total_duration_max_days
                      ? `${poa.total_duration_min_days}-${poa.total_duration_max_days} days`
                      : "—")}
                </div>
                <div className="text-[13px] mt-2" style={{ color: MUTED }}>
                  Indicative site duration with overlaps, subject to Terms
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <div
              className="text-[11px] tracking-[0.15em] font-semibold mb-6"
              style={{ color: GREEN }}
            >
              PHASE OVERLAP — INDICATIVE
            </div>

            <div className="space-y-3">
              {phases.map((phase, i) => {
                const bar = overlapBars[i] || {
                  startPct: 0,
                  widthPct: 20,
                  marker: false,
                };
                return (
                  <div
                    key={phase.id}
                    className="flex items-center gap-4 poa-avoid-break"
                  >
                    <div
                      className="w-8 text-[11px] font-semibold"
                      style={{ color: GREEN }}
                    >
                      P{i + 1}
                    </div>
                    <div className="relative flex-1 h-6">
                      <div
                        className="absolute top-0 h-6 rounded-sm flex items-center justify-center text-[9px] font-semibold text-white px-2 truncate"
                        style={{
                          left: `${bar.startPct}%`,
                          width: bar.marker ? "16px" : `${bar.widthPct}%`,
                          backgroundColor: bar.marker
                            ? INK
                            : i === phases.length - 2
                              ? GOLD
                              : GREEN,
                        }}
                        title={phase.title}
                      >
                        {!bar.marker && phase.title?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="flex justify-between text-[11px] tracking-wide mt-4 pt-3"
              style={{ borderTop: `1px solid ${GOLD}`, color: GREEN }}
            >
              <span>SITE START</span>
              <span>HANDOVER</span>
            </div>
          </div>
        </div>

        {/* ================= PAGE 3 — PHASE DETAIL TIMELINE ================= */}
        {/* ================= PHASE DETAIL TIMELINE PAGES ================= */}

        {Array.from(
          { length: Math.ceil(phases.length / 7) },
          (_, pageIndex) => {
            const startIndex = pageIndex * 7;
            const pagePhases = phases.slice(startIndex, startIndex + 7);

            return (
              <div
                key={`phase-detail-page-${pageIndex}`}
                className="poa-page px-16 py-16"
                // NOTE: this is intentionally never tagged `poa-page-last`.
                // Terms & Conditions always follows the phase-detail
                // pages, so every phase-detail page — including the final
                // one — must keep its forced `break-after: page`.
                // Otherwise, if the last phase-detail page doesn't fully
                // fill the sheet, Terms & Conditions starts flowing into
                // the leftover space on that same physical page instead of
                // starting fresh.
              >
                <PageLabel
                  index={3 + pageIndex}
                  title={`Phase Detail Timeline`}
                />

                {/* PAGE TITLE */}
                <div
                  className="text-[11px] tracking-[0.15em] font-semibold mb-8"
                  style={{ color: GREEN }}
                >
                  PHASE DETAIL TIMELINE
                </div>

                {/* PHASES */}
                <div className="space-y-10">
                  {pagePhases.map((phase, localIndex) => {
                    const phaseIndex = startIndex + localIndex;

                    return (
                      <div
                        key={phase.id}
                        className="grid grid-cols-[48px_1fr_180px] gap-6 items-start poa-avoid-break"
                      >
                        {/* PHASE NUMBER */}
                        <div
                          className="text-2xl font-light"
                          style={{ color: GREEN }}
                        >
                          {String(phaseIndex + 1).padStart(2, "0")}
                        </div>

                        {/* PHASE DETAILS */}
                        <div>
                          <div
                            className="text-sm font-semibold"
                            style={{ color: INK }}
                          >
                            {phase.title}
                          </div>

                          {phase.description && (
                            <p
                              className="text-[13px] leading-relaxed mt-1.5"
                              style={{ color: "#374151" }}
                            >
                              {phase.description}
                            </p>
                          )}

                          {phase.parallel_note && (
                            <div
                              className="text-[10px] tracking-wide font-semibold mt-2"
                              style={{ color: GOLD }}
                            >
                              {phase.parallel_note.toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* DURATION */}
                        <div
                          className="text-right text-sm font-medium"
                          style={{ color: INK }}
                        >
                          {phase.duration_label || "—"}
                        </div>
                      </div>
                    );
                  })}

                  {/* NO PHASES */}
                  {phases.length === 0 && (
                    <div className="text-sm" style={{ color: MUTED }}>
                      No phases have been added yet.
                    </div>
                  )}
                </div>
              </div>
            );
          },
        )}

        {/* ================= PAGE 4 — TERMS & CONDITIONS ================= */}
        <div className="poa-page poa-page-last px-16 py-16">
          <PageLabel index={4} title="Terms & Conditions" />
          <div className="text-3xl font-normal mb-8" style={{ color: INK }}>
            Terms & Conditions
          </div>

          <div className="grid grid-cols-1 gap-8">
            {termItems.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[40px_1fr] gap-4 poa-avoid-break"
              >
                <div className="text-sm font-semibold" style={{ color: GREEN }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: INK }}>
                    {item.title}
                  </div>
                  {item.body.map((p, j) => (
                    <p
                      key={j}
                      className="text-[13px] leading-relaxed mt-1"
                      style={{ color: "#374151" }}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {termItems.length === 0 && (
              <div className="text-sm" style={{ color: MUTED }}>
                No terms have been applied to this Plan of Action yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
