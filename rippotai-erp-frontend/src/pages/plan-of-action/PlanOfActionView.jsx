import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Edit3, Trash2, Download, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Shell, Card } from "../../hooks/shared";
import {
  useGetPlanOfActionQuery,
  useDeletePlanOfActionMutation,
  usePublishPlanOfActionMutation,
} from "../../api/documents/plan-of-actions.api";
// Template logo: cube + RIPPŌTAI wordmark (706x858 PNG, same asset as the Site Recce report).
import logo from "../../assets/rippotai_logo.png";

/* ================================================================ */
/* DESIGN TOKENS — sampled from PLAN_OF_ACTION_VF.pdf               */
/* ================================================================ */

const C = {
  green: "#103D2F",
  gold: "#D9AF5F",
  goldFaint: "#EBD9B0",
  peach: "#F1DFCF",
  ink: "#111111",
  body: "#555555",
  label: "#6F6F6F",
  teal: "#356A78",
  sage: "#6B8A7E",
  paper: "#FFFFFF",
};

const FONT = "'Lato', 'Helvetica Neue', Arial, sans-serif";
const PAGE_W = 794;
const PAGE_H = 1123;
const PAD = 71;
const FOOTER_Y = 104; // gold rule sits 104px above the page bottom

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');
.poa-page, .poa-page * { font-family: ${FONT}; box-sizing: border-box; }
.poa-backdrop { background: #57595c; padding: 40px 0 56px; }
@media print {
  @page { size: A4; margin: 0; }
  body * { visibility: hidden; }
  .poa-print-area, .poa-print-area * { visibility: visible; }
  .poa-print-area { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; }
  .poa-backdrop { background: none; padding: 0; }
  .poa-page { margin: 0 !important; box-shadow: none !important; break-after: page; }
  .poa-page:last-child { break-after: auto; }
  .no-print { display: none !important; }
}
`;

/* ================================================================ */
/* DEFAULT CONTENT (used only when the record has none)             */
/* ================================================================ */

const NUM_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const defaultDescription = (n) =>
  `Execution at site is organised into ${NUM_WORDS[n] || n} phase${n === 1 ? "" : "s"}. Each phase has a defined scope and a defined duration, so progress can be reviewed against a clear benchmark rather than an open-ended schedule. Phases are deliberately overlapped — as one phase moves towards completion, the next one is already mobilised on site, which compresses the overall timeline without compromising the sequence of work.`;

const DEFAULT_TERMS = [
  {
    title: "Overlapping of phases",
    body: [
      "From Phase 2 onwards, the next phase commences as the current phase moves towards completion. This overlap is intentional and is planned to keep work continuous at site.",
    ],
  },
  {
    title: "Snag closure before handover",
    body: [
      "During the snag phase, the site will not be handed over to the client until every item on the snag list has been rectified and jointly signed off.",
    ],
  },
  {
    title: "Commencement & counting of days",
    body: [
      "The timeline begins from the date of clear and unobstructed possession of the site. Durations stated are working days and exclude Sundays, public holidays and days on which work is stopped by any authority.",
    ],
  },
  {
    title: "Timely client decisions",
    body: [
      "Material, finish, fixture and furniture selections are to be approved within the parallel window indicated against each phase. Any delay in approvals will shift all subsequent phases day for day.",
    ],
  },
  {
    title: "Client-supplied items",
    body: [
      "Items procured directly by the client are to reach site as per the agreed schedule. Delay in the delivery, shortfall or damage of such items is not attributable to Rippotai and will extend the affected phase accordingly.",
    ],
  },
  {
    title: "Changes in scope",
    body: [
      "Any change in layout, specification or scope after a phase has commenced will be treated as a variation. The cost and time implication will be shared in writing and executed only after written approval.",
    ],
  },
  {
    title: "Payments",
    body: [
      "Payments are to be released as per the agreed Payment Schedule. Mobilisation of the next phase is subject to the corresponding milestone payment being cleared.",
    ],
  },
  {
    title: "Site facilities",
    body: [
      "Uninterrupted access to the site, along with power, water, and a secure area for storage of material, is to be provided by the client at no cost for the duration of the works.",
    ],
  },
  {
    title: "Circumstances beyond control",
    body: [
      "Statutory construction restrictions, labour strikes, extreme weather, transport disruption and unavailability of specified material are beyond our control and will extend the timeline proportionately, with prior intimation to the client.",
    ],
  },
  {
    title: "Post-handover defects",
    body: [
      "Issues reported after handover fall under the defect liability terms of the signed Agreement and not under the snag phase of this plan.",
    ],
  },
];

/* ================================================================ */
/* HELPERS                                                          */
/* ================================================================ */

const pad2 = (n) => String(n).padStart(2, "0");

function formatDurationLabel(min, max) {
  const has = (v) => v !== null && v !== undefined && v !== "";
  if (!has(min) && !has(max)) return null;
  if (!has(min)) return `${pad2(max)} Days`;
  if (!has(max) || Number(min) === Number(max)) return `${pad2(min)} Days`;
  return `${pad2(min)}–${pad2(max)} Days`;
}

// Parses stored terms HTML (h3 + p pairs) into { title, body[] } items.
function parseTermsHtml(html) {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const items = [];
    let current = null;
    Array.from(doc.body.children).forEach((node) => {
      const tag = node.tagName?.toLowerCase();
      if (tag === "h2") return;
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

// Bars follow the template: each phase starts when the previous is ~84% through.
function computeBars(phases) {
  const OVERLAP = 0.84;
  let cursor = 0;
  const raw = phases.map((p, i) => {
    const marker = i === phases.length - 1 && !p.avgDays;
    const start = cursor;
    if (!marker) cursor = start + p.avgDays * OVERLAP;
    return { start, dur: marker ? 0 : p.avgDays, marker };
  });
  const span = Math.max(...raw.map((r) => r.start + r.dur), 1);
  return raw.map((r) => ({
    marker: r.marker,
    left: (r.start / span) * 97,
    width: Math.max(5, (r.dur / span) * 97),
  }));
}

// Greedy pagination by estimated height, so long rows never get clipped.
function paginate(items, estimate, available) {
  const pages = [];
  let cur = [];
  let used = 0;
  items.forEach((it) => {
    const h = estimate(it);
    if (cur.length && used + h > available) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(it);
    used += h;
  });
  if (cur.length || !pages.length) pages.push(cur);
  return pages;
}

const lines = (text, perLine) =>
  text ? Math.ceil(String(text).length / perLine) : 0;

const estimatePhase = (p) => {
  const desc = lines(p.description, 46) * 18;
  const notes = [p.parallel_note, p.inclusion_note]
    .filter(Boolean)
    .reduce((s, n) => s + 10 + lines(n, 36) * 13, 0);
  const name = lines(p.title, 20) * 17 + 14;
  return Math.max(desc + notes, name) + 28;
};

const estimateTerm = (t) =>
  17 + t.body.reduce((s, b) => s + lines(b, 105) * 14.5, 0) + 22;

/* ================================================================ */
/* PRIMITIVES                                                       */
/* ================================================================ */

function Page({ children, footerLine = true, style }) {
  return (
    <div
      className="poa-page"
      style={{
        position: "relative",
        width: PAGE_W,
        height: PAGE_H,
        overflow: "hidden",
        margin: "0 auto 28px",
        background: C.paper,
        boxShadow: "0 8px 30px rgba(0,0,0,.35)",
        color: C.ink,
        ...style,
      }}
    >
      {children}
      {footerLine && (
        <div
          style={{
            position: "absolute",
            left: PAD,
            right: PAD,
            bottom: FOOTER_Y,
            height: 1,
            background: C.gold,
          }}
        />
      )}
    </div>
  );
}

const PageTitle = ({ children, upper }) => (
  <div
    style={{
      fontSize: 34,
      fontWeight: 300,
      color: C.ink,
      lineHeight: 1.1,
      letterSpacing: upper ? "0.01em" : 0,
    }}
  >
    {children}
  </div>
);

const Tracked = ({ children, style }) => (
  <div style={{ textTransform: "uppercase", letterSpacing: "0.3em", ...style }}>
    {children}
  </div>
);

/* ================================================================ */
/* COVER FIELD ROW                                                  */
/* ================================================================ */

function CoverRow({ cells, last }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        padding: "0 0 10px 27px",
        borderBottom: `${last ? 2 : 1}px solid ${last ? C.gold : C.peach}`,
        marginBottom: last ? 0 : 20,
      }}
    >
      {cells.map(([label, value]) => (
        <div
          key={label}
          style={{
            fontSize: 12,
            lineHeight: "16px",
            textTransform: "uppercase",
            fontWeight: 300,
            color: C.label,
          }}
        >
          {label}
          {value ? (
            <span style={{ marginLeft: 8, fontWeight: 700, color: C.ink }}>
              {value}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ================================================================ */
/* MAIN VIEW                                                        */
/* ================================================================ */

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
  const [exporting, setExporting] = useState(false);

  const removePlan = async () => {
    if (!window.confirm("Delete this Plan of Action? This cannot be undone."))
      return;
    try {
      await deletePlanOfAction(id).unwrap();
      toast.success("Plan of Action deleted");
      nav("/crm/plan-of-action/all");
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

  const exportPdf = async () => {
    const pageEls = Array.from(
      document.querySelectorAll(".poa-print-area .poa-page"),
    );
    if (!pageEls.length || exporting) return;
    setExporting(true);
    try {
      // Same typeface in the PDF as on screen.
      if (document.fonts) {
        await Promise.all(
          ["300", "400", "700"].map((w) =>
            document.fonts.load(`${w} 12px Lato`),
          ),
        );
        await document.fonts.ready;
      }
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: PAGE_W,
          height: PAGE_H,
          windowWidth: PAGE_W,
          onclone: (doc) => {
            doc.querySelectorAll(".poa-page").forEach((el) => {
              el.style.boxShadow = "none";
              el.style.margin = "0";
            });
          },
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          0,
          0,
          210,
          297,
          undefined,
          "FAST",
        );
      }
      const safeName = (poa?.project?.name || "plan-of-action")
        .trim()
        .replace(/[^\w-]+/g, "_");
      pdf.save(`${safeName}_Plan_of_Action.pdf`);
      toast.success("PDF exported");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  /* ---------------- derived data ---------------- */
  const phases = useMemo(() => {
    return [...(poa?.phases || [])]
      .map((phase) => {
        const link = phase.PlanOfActionPhase || {};
        const min = link.duration_min_days;
        const max = link.duration_max_days;
        const nums = [min, max]
          .filter((v) => v !== null && v !== undefined)
          .map(Number);
        return {
          ...phase,
          duration_label: formatDurationLabel(min, max),
          avgDays: nums.length
            ? nums.reduce((a, b) => a + b, 0) / nums.length
            : 0,
          parallel_note: link.parallel_work_note || null,
          inclusion_note: link.inclusion_note || null,
          sort_order: link.sort_order ?? phase.sort_order ?? 0,
        };
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [poa]);

  const bars = useMemo(() => computeBars(phases), [phases]);
  const phasePages = useMemo(
    () => paginate(phases, estimatePhase, 870),
    [phases],
  );

  const termItems = useMemo(() => {
    const parsed = parseTermsHtml(poa?.terms_content_snapshot);
    return parsed.length ? parsed : DEFAULT_TERMS;
  }, [poa?.terms_content_snapshot]);
  const termPages = useMemo(
    () => paginate(termItems, estimateTerm, 825),
    [termItems],
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
  const member = (role) =>
    poa.team_members?.find(
      (m) => m.role_label?.toLowerCase() === role.toLowerCase(),
    )?.user?.name;
  const clientName =
    project.client_name || poa.client_name || project.client?.name;

  const nPhases = poa.total_phases ?? phases.length;
  const totalLabel =
    poa.total_duration_label ||
    (poa.total_duration_min_days && poa.total_duration_max_days
      ? `${poa.total_duration_min_days}–${poa.total_duration_max_days} days`
      : "—");

  const COLS = "48px 159px 297px 1fr"; // number | name | detail | timeline (matches template x-positions)
  const lastIsMarker = bars.length > 0 && bars[bars.length - 1].marker;
  const rowH = Math.min(32, Math.floor(420 / Math.max(phases.length, 1)));

  return (
    <Shell
      title="Plan of Action"
      subtitle={`${project.name || "Project"} • v${poa.version || 1}`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/crm/plan-of-action/all")}
            className="h-10 px-4 rounded-lg border border-[#DDD8CE] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => nav(`/crm/forms/plan-of-action/${id}/edit`)}
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
            onClick={exportPdf}
            disabled={exporting}
            className="h-10 px-4 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold text-[#333333] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download size={14} /> {exporting ? "Exporting…" : "Export PDF"}
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
      <style>{FONT_CSS}</style>

      <div className="poa-backdrop">
        <div
          className="poa-print-area"
          style={{ width: PAGE_W, margin: "0 auto" }}
        >
          {/* ================= COVER ================= */}
          <Page footerLine={false}>
            <img
              src={logo}
              alt="Rippōtai"
              style={{
                position: "absolute",
                top: 277,
                left: (PAGE_W - 310) / 2,
                width: 310,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 626,
                width: "100%",
                textAlign: "center",
                fontSize: 22,
                letterSpacing: "0.04em",
                fontWeight: 300,
                color: C.green,
              }}
            >
              PLAN OF ACTION
            </div>
            <div
              style={{ position: "absolute", left: PAD, right: PAD, top: 900 }}
            >
              <CoverRow cells={[["Project", project.name]]} />
              <CoverRow
                cells={[
                  ["Address", project.site_location],
                  ["Client", clientName],
                ]}
              />
              <CoverRow
                cells={[
                  ["Principle Architect", member("Principal Architect")],
                  ["Project Lead", member("Project Lead")],
                ]}
                last
              />
            </div>
          </Page>

          {/* ================= HOW THE EXECUTION RUNS ================= */}
          <Page style={{ padding: `76px ${PAD}px 0` }}>
            <PageTitle>How the Execution runs</PageTitle>
            <div style={{ height: 2, background: C.ink, marginTop: 44 }} />

            <p
              style={{
                margin: "22px 0 0",
                fontSize: 11.5,
                lineHeight: "18.5px",
                fontWeight: 300,
                color: C.body,
              }}
            >
              {poa.execution_description || defaultDescription(nPhases)}
            </p>

            <div
              style={{
                width: 417,
                height: 1.5,
                background: C.gold,
                marginTop: 42,
              }}
            />
            <div style={{ display: "flex", marginTop: 20 }}>
              <div style={{ width: 208 }}>
                <div
                  style={{
                    fontSize: 27,
                    fontWeight: 300,
                    color: C.ink,
                    lineHeight: 1.1,
                  }}
                >
                  {pad2(nPhases)}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 300,
                    color: C.sage,
                    marginTop: 12,
                    width: 170,
                    lineHeight: 1.45,
                  }}
                >
                  Execution phases from services to handover
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 27,
                    fontWeight: 300,
                    color: C.ink,
                    lineHeight: 1.1,
                  }}
                >
                  {totalLabel}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 300,
                    color: C.sage,
                    marginTop: 12,
                    width: 190,
                    lineHeight: 1.45,
                  }}
                >
                  Indicative site duration with overlaps, subject to Terms
                </div>
              </div>
            </div>

            <Tracked
              style={{
                marginTop: 70,
                fontSize: 9,
                fontWeight: 700,
                color: C.green,
              }}
            >
              Phase overlap — indicative
            </Tracked>

            <div style={{ marginTop: 26 }}>
              {phases.map((p, i) => {
                const b = bars[i];
                return (
                  <div
                    key={p.id || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: rowH,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: C.teal,
                      }}
                    >
                      P{i + 1}
                    </div>
                    <div style={{ position: "relative", flex: 1, height: 14 }}>
                      {b.marker ? (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: -1,
                            width: 17,
                            height: 16,
                            background: "#000",
                          }}
                        />
                      ) : (
                        <div
                          title={p.title}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: `${b.left}%`,
                            width: `${b.width}%`,
                            height: 14,
                            background:
                              lastIsMarker && i === phases.length - 2
                                ? C.gold
                                : C.green,
                            color:
                              lastIsMarker && i === phases.length - 2
                                ? "rgba(255,255,255,.75)"
                                : "rgba(255,255,255,.85)",
                            fontSize: 6.5,
                            fontWeight: 300,
                            textTransform: "uppercase",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                          }}
                        >
                          {p.title}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* axis */}
              <div
                style={{
                  marginLeft: 32,
                  marginTop: 10,
                  borderBottom: `1.5px solid ${C.gold}`,
                  paddingBottom: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#1F4B3C",
                  textTransform: "uppercase",
                }}
              >
                <span>Site start</span>
                <span style={{ marginRight: 34 }}>Handover</span>
              </div>
            </div>
          </Page>

          {/* ================= PHASE DETAIL PAGES ================= */}
          {phasePages.map((pagePhases, pageIdx) => {
            const start = phasePages
              .slice(0, pageIdx)
              .reduce((s, p) => s + p.length, 0);
            return (
              <Page
                key={`ph-${pageIdx}`}
                style={{ padding: `74px ${PAD}px 0` }}
              >
                <PageTitle upper>PLAN OF ACTION</PageTitle>

                <div style={{ marginRight: 28, marginTop: 44 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: COLS,
                      paddingBottom: 9,
                      borderBottom: `1.5px solid ${C.ink}`,
                    }}
                  >
                    <div />
                    {["Phase", "Detail", "Timeline"].map((h) => (
                      <Tracked
                        key={h}
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          color: C.green,
                        }}
                      >
                        {h}
                      </Tracked>
                    ))}
                  </div>

                  {pagePhases.map((p, k) => (
                    <div
                      key={p.id || k}
                      style={{
                        display: "grid",
                        gridTemplateColumns: COLS,
                        padding: "14px 0",
                        borderBottom: `1px solid ${C.gold}`,
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9.5,
                          fontWeight: 300,
                          color: C.goldFaint,
                          paddingTop: 1,
                        }}
                      >
                        {pad2(start + k + 1)}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 400,
                          color: C.ink,
                          paddingRight: 12,
                          lineHeight: "17px",
                        }}
                      >
                        {p.title}
                      </div>
                      <div style={{ paddingRight: 12 }}>
                        {p.description && (
                          <div
                            style={{
                              fontSize: 11,
                              lineHeight: "18px",
                              fontWeight: 300,
                              color: C.body,
                            }}
                          >
                            {p.description}
                          </div>
                        )}
                        {[p.parallel_note, p.inclusion_note]
                          .filter(Boolean)
                          .map((n, j) => (
                            <div
                              key={j}
                              style={{
                                marginTop: 10,
                                fontSize: 8,
                                lineHeight: "13px",
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                fontWeight: 300,
                                color: C.sage,
                              }}
                            >
                              {n}
                            </div>
                          ))}
                      </div>
                      <div
                        style={{ fontSize: 12, fontWeight: 400, color: C.ink }}
                      >
                        {p.duration_label ||
                          (start + k === phases.length - 1
                            ? "On completion"
                            : "—")}
                      </div>
                    </div>
                  ))}

                  {phases.length === 0 && (
                    <div
                      style={{
                        padding: "24px 0",
                        fontSize: 12,
                        fontWeight: 300,
                        color: C.label,
                      }}
                    >
                      No phases have been added yet.
                    </div>
                  )}
                </div>
              </Page>
            );
          })}

          {/* ================= TERMS & CONDITIONS ================= */}
          {termPages.map((pageTerms, pageIdx) => {
            const start = termPages
              .slice(0, pageIdx)
              .reduce((s, p) => s + p.length, 0);
            return (
              <Page
                key={`tc-${pageIdx}`}
                style={{ padding: `74px ${PAD}px 0` }}
              >
                <PageTitle>
                  Terms &amp; Conditions{pageIdx > 0 ? " (contd.)" : ""}
                </PageTitle>
                <div style={{ height: 2, background: C.ink, marginTop: 44 }} />

                <div style={{ marginTop: 18, marginRight: 28 }}>
                  {pageTerms.map((t, k) => (
                    <div
                      key={start + k}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "43px 1fr",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9.5,
                          fontWeight: 300,
                          color: C.goldFaint,
                          paddingTop: 12,
                        }}
                      >
                        {pad2(start + k + 1)}
                      </div>
                      <div
                        style={{
                          padding: "10px 0 12px",
                          borderBottom: `1px solid ${C.gold}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: C.ink,
                            lineHeight: "17px",
                          }}
                        >
                          {t.title}
                        </div>
                        {t.body.map((b, j) => (
                          <div
                            key={j}
                            style={{
                              marginTop: 3,
                              fontSize: 9.5,
                              lineHeight: "14.5px",
                              fontWeight: 300,
                              color: C.body,
                            }}
                          >
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Page>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
