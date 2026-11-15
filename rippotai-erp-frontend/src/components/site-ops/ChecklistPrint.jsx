// Printable QC checklist (A4, black & white safe) for site ticking.
//
//  • Official Rippotai monogram header, "Quality Checklist" title, checklist / project / date.
//  • Every checkpoint row: No. | Checkpoint | empty □ tick box (5 mm, black outline) | Remarks
//    (blank ruled lines to write on). Phases (Before / During / After execution) as group rows.
//  • Blank template (from a work-head template, no project) or filled from a project checklist —
//    boxes stay empty either way; recorded answers print only as small grey text.
//  • Inspector / site engineer / approver name, signature and date lines at the end.
// Rendered as .pd-page sheets, so the shared downloadDocumentPdf turns it into the PDF.
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import monogram from "../../assets/brand/rippotai-monogram.png";
import { downloadWhenReady, OFFSCREEN_STYLE } from "@/components/print-document/commerce";
import { useGetQualityChecklistTemplateQuery } from "@/api/site-ops/site-ops.api";

const PHASES = [
  ["BEFORE_EXECUTION", "Before execution"],
  ["DURING_EXECUTION", "During execution"],
  ["AFTER_EXECUTION", "After execution"],
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const fileSafe = (s) => String(s || "Checklist").replace(/[^\w-]+/g, "-").replace(/-+/g, "-");

const CSS = `
.ck-doc{font-family:Arial,"Liberation Sans",Helvetica,sans-serif;color:#000;text-align:left;}
.ck-doc *{box-sizing:border-box;font-family:inherit;letter-spacing:normal;}
.ck-doc--screen{display:flex;flex-direction:column;align-items:center;gap:16px;}
.ck-doc .pd-page{width:210mm;height:297mm;padding:14mm 12mm 16mm;background:#fff;overflow:hidden;position:relative;}
.ck-doc.is-capturing .pd-page{box-shadow:none;}
.ck-flow{width:210mm;padding:0 12mm;background:#fff;}
.ck-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:10px;border-bottom:1.5px solid #000;}
.ck-head img{height:11mm;width:auto;display:block;}
.ck-titles{text-align:right;}
.ck-title{font-size:20px;line-height:24px;font-weight:700;color:#000;}
.ck-sub{font-size:11px;line-height:15px;color:#333;margin-top:2px;}
.ck-info{display:grid;grid-template-columns:1fr 1fr;column-gap:20px;row-gap:6px;margin:12px 0 14px;font-size:11px;line-height:15px;}
.ck-info div{display:flex;gap:6px;align-items:flex-end;min-width:0;}
.ck-info b{white-space:nowrap;font-weight:700;}
.ck-info span{flex:1;min-width:0;border-bottom:1px solid #000;min-height:15px;padding-bottom:1px;overflow-wrap:anywhere;}
.ck-table{width:100%;border-collapse:collapse;table-layout:fixed;}
.ck-table th{font-size:10px;font-weight:700;text-transform:uppercase;text-align:left;padding:6px;border:1px solid #000;background:#e6e6e6;color:#000;}
.ck-table td{font-size:11px;line-height:14px;padding:7px 6px;border:1px solid #000;vertical-align:top;color:#000;overflow-wrap:anywhere;}
.ck-table .c{text-align:center;}
.ck-table tr.ck-phase td{background:#f0f0f0;font-weight:700;font-size:11px;padding:6px;}
.ck-box{display:inline-block;width:5mm;height:5mm;border:1.5px solid #000;background:#fff;vertical-align:middle;}
.ck-rec{display:block;margin-top:3px;font-size:9px;line-height:11px;color:#777;}
.ck-lines i{display:block;height:13px;border-bottom:1px solid #8a8a8a;}
.ck-sign{margin-top:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;font-size:11px;line-height:15px;}
.ck-sign .ck-role{font-weight:700;margin-bottom:22px;}
.ck-sign .ck-line{border-bottom:1px solid #000;height:22px;}
.ck-sign .ck-cap{font-size:9.5px;color:#333;margin:2px 0 6px;}
.ck-note{margin-top:12px;font-size:9.5px;line-height:13px;color:#333;}
.ck-foot{position:absolute;left:12mm;right:12mm;bottom:7mm;display:flex;justify-content:space-between;font-size:9px;color:#333;border-top:0.75px solid #000;padding-top:3px;}
`;

/** model → unpaginated HTML (header, table, sign-off). */
function renderFlow(m) {
  const info = [
    ["Project", m.projectName],
    ["Location / area", m.location],
    ["Work head", m.workHead],
    ["Inspection date", ""],
    ["Inspector", ""],
    ["Contractor / agency", ""],
  ];
  const rows = PHASES.map(([phase, label]) => {
    const items = m.items.filter((i) => (i.phase || "BEFORE_EXECUTION") === phase);
    if (!items.length) return "";
    return (
      `<tr class="ck-phase"><td colspan="4">${esc(label)}</td></tr>` +
      items
        .map(
          (i) =>
            `<tr class="ck-item"><td class="c">${esc(i.serial_number)}</td><td>${esc(i.checkpoint_name)}${
              i.recorded ? `<span class="ck-rec">${esc(i.recorded)}</span>` : ""
            }</td><td class="c"><span class="ck-box" aria-label="tick box"></span></td><td><div class="ck-lines"><i></i><i></i></div></td></tr>`,
        )
        .join("")
    );
  }).join("");
  const sign = ["Inspected by (site engineer)", "Contractor / agency representative", "Approved by (architect / PM)"]
    .map(
      (r) =>
        `<div><div class="ck-role">${esc(r)}</div><div class="ck-line"></div><div class="ck-cap">Name</div><div class="ck-line"></div><div class="ck-cap">Signature</div><div class="ck-line"></div><div class="ck-cap">Date</div></div>`,
    )
    .join("");
  return `<div class="ck-flow"><div class="ck-top"><div class="ck-head"><img src="${esc(m.monogram)}" alt="Rippotai"/><div class="ck-titles"><div class="ck-title" role="heading" aria-level="1">Quality Checklist</div><div class="ck-sub">${esc(
    [m.name, m.date].filter(Boolean).join(" · "),
  )}</div></div></div><div class="ck-info">${info
    .map(([l, v]) => `<div><b>${esc(l)}:</b><span>${esc(v)}</span></div>`)
    .join("")}</div></div><table class="ck-table"><colgroup><col style="width:11mm"><col><col style="width:15mm"><col style="width:62mm"></colgroup><thead><tr><th class="c">No.</th><th>Checkpoint</th><th class="c">✓</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table><div class="ck-end"><div class="ck-note">Tick (✓) each box only after the checkpoint is verified on site. Write any deviation, measurement or follow-up in Remarks.</div><div class="ck-sign">${sign}</div></div></div>`;
}

/** Pack the flow onto A4 sheets: rows never split, a phase row stays with its first item,
 *  the column header repeats, the sign-off block stays whole. Adds "Page x of y" footers. */
function paginate(root, footLeft) {
  const flow = root.querySelector(".ck-flow");
  if (!flow) return;
  const MM = 96 / 25.4;
  const BODY = (297 - 14 - 16) * MM - 2;
  const outer = (el) => {
    if (!el) return 0;
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  };
  const top = flow.querySelector(".ck-top");
  const table = flow.querySelector(".ck-table");
  const thead = table.querySelector("thead");
  const rows = Array.from(table.querySelectorAll("tbody > tr"));
  const end = flow.querySelector(".ck-end");
  const theadH = outer(thead);
  const rowH = rows.map((r) => r.getBoundingClientRect().height);
  const pages = [{ top: true, rows: [], end: false, used: outer(top) }];
  let cur = pages[0];
  for (let i = 0; i < rows.length; ) {
    const grp = rows[i].classList.contains("ck-phase") && i + 1 < rows.length ? [i, i + 1] : [i];
    const h = grp.reduce((s, k) => s + rowH[k], 0);
    const need = h + (cur.rows.length ? 0 : theadH);
    if (cur.used + need > BODY && (cur.rows.length || !cur.top)) {
      cur = { top: false, rows: [], end: false, used: theadH + h };
      pages.push(cur);
    } else cur.used += need;
    cur.rows.push(...grp);
    i = grp[grp.length - 1] + 1;
  }
  if (cur.used + outer(end) > BODY) {
    cur = { top: false, rows: [], end: false, used: 0 };
    pages.push(cur);
  }
  cur.end = true;
  const sheets = pages.map((p, n) => {
    const s = document.createElement("div");
    s.className = "pd-page ck-page";
    if (p.top) s.appendChild(top.cloneNode(true));
    if (p.rows.length) {
      const t = table.cloneNode(false);
      t.appendChild(table.querySelector("colgroup").cloneNode(true));
      t.appendChild(thead.cloneNode(true));
      const tb = document.createElement("tbody");
      p.rows.forEach((k) => tb.appendChild(rows[k].cloneNode(true)));
      t.appendChild(tb);
      s.appendChild(t);
    }
    if (p.end) s.appendChild(end.cloneNode(true));
    const f = document.createElement("div");
    f.className = "ck-foot";
    f.innerHTML = `<span>${esc(footLeft)}</span><span>Page ${n + 1} of ${pages.length}</span>`;
    s.appendChild(f);
    return s;
  });
  flow.remove();
  sheets.forEach((s) => root.appendChild(s));
}

/**
 * props: name (checklist / template title), projectName, location, workHead, date,
 *        items [{ serial_number, checkpoint_name, phase, recorded? }], blank (template, no project)
 */
export const ChecklistPrintDocument = forwardRef(function ChecklistPrintDocument(props, ref) {
  const { name, projectName, location, workHead, date, items = [], blank = false } = props;
  const hostRef = useRef(null);
  const setRef = useCallback(
    (el) => {
      hostRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  const key = JSON.stringify([name, projectName, location, workHead, date, items, blank]);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = renderFlow({ name, projectName, location, workHead, date, items, blank, monogram });
    paginate(host, ["Rippotai Architecture", name].filter(Boolean).join(" · "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <>
      <style>{CSS}</style>
      <div ref={setRef} className="ck-doc ck-doc--screen" data-page-height="297" />
    </>
  );
});

const recordedText = (item) => {
  const answer = item.is_accepted === true ? "Accepted" : item.is_accepted === false ? "Not accepted" : "";
  const parts = [answer, item.remarks, fmtDate(item.inspection_date)].filter(Boolean);
  return parts.length ? `Recorded: ${parts.join(" · ")}` : "";
};

/** Print model for a project checklist (GET /quality-checklists/:id). */
const checklistPrintProps = (checklist, projectName) => ({
  name: checklist?.checklist_name || checklist?.template_title || "Checklist",
  projectName: projectName || checklist?.project?.name || "",
  location: checklist?.description || "",
  workHead: checklist?.template_title || String(checklist?.work_head || "").replace(/_/g, " "),
  date: fmtDate(new Date()),
  items: [...(checklist?.checklist_items || [])]
    .sort((a, b) => a.serial_number - b.serial_number)
    .map((i) => ({
      serial_number: i.serial_number,
      checkpoint_name: i.checkpoint_name,
      phase: i.phase,
      recorded: recordedText(i),
    })),
});

/** Print model for a blank work-head template (GET /quality-checklists/templates/:workHead). */
const templatePrintProps = (tpl) => ({
  name: tpl?.title || tpl?.label || "Checklist",
  projectName: "",
  location: "",
  workHead: tpl?.label || "",
  date: "",
  blank: true,
  items: (tpl?.checkpoints || []).map((i) => ({
    serial_number: i.serial_number,
    checkpoint_name: i.checkpoint_name,
    phase: i.phase,
  })),
});

function OffscreenPrint({ docProps, fileName, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    const id = `ck-${Date.now()}`;
    toast.loading("Preparing the checklist…", { id });
    downloadWhenReady(() => ref.current, fileName, { title: `Quality checklist — ${docProps.name}` })
      .then(() => alive && toast.success("Checklist downloaded", { id }))
      .catch((e) => {
        console.error("Checklist PDF failed", e);
        toast.error("Couldn't create the checklist PDF. Try again.", { id });
      })
      .finally(() => onDone());
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={OFFSCREEN_STYLE} aria-hidden>
      <ChecklistPrintDocument ref={ref} {...docProps} />
    </div>
  );
}

/** "Print checklist" for a loaded project checklist. */
export function PrintChecklistButton({ checklist, projectName, className = "bc-btn-secondary", label = "Print checklist" }) {
  const [busy, setBusy] = useState(false);
  const props = checklistPrintProps(checklist, projectName);
  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy || !checklist}
        onClick={() => setBusy(true)}
        title="A4 checklist with empty tick boxes for site inspection"
      >
        <Printer size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
        {busy ? "Preparing…" : label}
      </button>
      {busy && (
        <OffscreenPrint
          docProps={props}
          fileName={`Checklist_${fileSafe(props.name)}${projectName ? `_${fileSafe(projectName)}` : ""}.pdf`}
          onDone={() => setBusy(false)}
        />
      )}
    </>
  );
}

function TemplateLoader({ workHead, onDone }) {
  const { currentData, isError } = useGetQualityChecklistTemplateQuery(workHead);
  useEffect(() => {
    if (isError) {
      toast.error("Couldn't load the checklist template.");
      onDone();
    }
  }, [isError, onDone]);
  if (!currentData) return null;
  const props = templatePrintProps(currentData);
  return <OffscreenPrint docProps={props} fileName={`Checklist-template_${fileSafe(currentData.label || workHead)}.pdf`} onDone={onDone} />;
}

/** Blank printable checklist from a work-head template (no project). */
export function PrintTemplateButton({ workHead, className = "bc-btn-secondary", label = "Print blank checklist" }) {
  const [busy, setBusy] = useState(false);
  const done = useCallback(() => setBusy(false), []);
  return (
    <>
      <button type="button" className={className} disabled={busy || !workHead} onClick={() => setBusy(true)}>
        <Printer size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
        {busy ? "Preparing…" : label}
      </button>
      {busy && <TemplateLoader workHead={workHead} onDone={done} />}
    </>
  );
}

/** Work-head picker + "Print blank checklist" (templates that have checkpoints). */
export function PrintBlankChecklist({ templates = [] }) {
  const usable = templates.filter((t) => t.has_template);
  const [workHead, setWorkHead] = useState("");
  if (!usable.length) return null;
  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <select
        className="bc-input"
        aria-label="Checklist template to print"
        value={workHead}
        onChange={(e) => setWorkHead(e.target.value)}
        style={{ height: 36, minWidth: 180 }}
      >
        <option value="">Blank checklist for…</option>
        {usable.map((t) => (
          <option key={t.work_head} value={t.work_head}>
            {t.label} ({t.checkpoint_count})
          </option>
        ))}
      </select>
      <PrintTemplateButton workHead={workHead} label="Print blank" />
    </div>
  );
}
