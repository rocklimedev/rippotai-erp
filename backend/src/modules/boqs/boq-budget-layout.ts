/* eslint-disable */
// BOQ "Budget Breakdown" print layout — the user's BOQ template (ref: BOQ-TEMPLATE.pdf).
//
// ONE implementation, two copies (the frontend file is this file with the types stripped):
//   backend : src/modules/boqs/boq-budget-layout.ts          (export worker PDF + thumbnail)
//   frontend: src/components/commerce-documents/boqBudgetLayout.js (preview, Download PDF,
//             approval attachment, BOQ template PDF)
// Edit this file, then regenerate the frontend copy (from backend/):
//   npx tsc src/modules/boqs/boq-budget-layout.ts --target ES2022 --module ESNext --moduleResolution bundler --types node \
//     --removeComments false --outDir /tmp/bb && cp /tmp/bb/boq-budget-layout.js \
//     ../frontend/src/components/commerce-documents/boqBudgetLayout.js
// The model is built from the BOQ JSON the API returns, rendered to an
// unpaginated flow (no h1/h2 elements: the app shell restyles page headings), then paginateBudget() packs it onto A4 sheets (.pd-page) in the browser —
// the same packing runs in headless Chrome (backend) and in the app (frontend).

export type BudgetVariant =
  | 'internal'
  | 'client'
  | 'quantity_only'
  | 'vendor_enquiry';

export const BUDGET_VARIANT_LABELS: Record<string, string> = {
  client: 'Client copy',
  internal: 'Internal copy',
  quantity_only: 'Quantity only',
  vendor_enquiry: 'Vendor enquiry',
};

export interface BudgetRow {
  sno: number;
  description: string;
  remarks: string;
  location: string;
  unit: string;
  qty: string;
  rate: string;
  amount: string;
}

export interface BudgetGroup {
  name: string;
  rows: BudgetRow[];
  subtotal: string;
}

export interface BudgetModel {
  title: string;
  subtitle: string;
  projectName: string;
  address: string;
  estimateTotal: string;
  priceCols: 'all' | 'blank' | 'none';
  groups: BudgetGroup[];
  summary: Array<[string, string]>;
  finalTotal: string;
  terms: Array<{ label: string; body: string }>;
  monogramSrc: string;
}

/* ------------------------------------------------------------------ formatting */

const num = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 7,75,560 (Indian grouping, paise only when present). */
export const inr = (v: any): string => {
  const n = num(v) ?? 0;
  const frac = Math.abs(n - Math.round(n)) > 0.004;
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: frac ? 2 : 0,
    maximumFractionDigits: frac ? 2 : 0,
  });
};

/** ₹7,75,560 */
export const rupees = (v: any): string => `₹${inr(v)}`;

/** 4060.00 — quantities always with two decimals, no grouping (as the template). */
export const qty2 = (v: any): string => {
  const n = num(v);
  return n === null ? '' : n.toFixed(2);
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** 02 Nov 2026 */
export const budgetDate = (value: any): string => {
  if (!value) return '';
  const s = String(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value);
  if (Number.isNaN(d.getTime())) return s;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const escHtml = (v: any): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const decode = (s: string): string =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

/** Rich text / HTML → plain text (line breaks kept as \n). */
export const plainText = (html: any): string =>
  decode(
    String(html ?? '')
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|div|li|h\d)>/gi, '\n')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();

/** Terms HTML (list / paragraphs / plain lines) → numbered clauses; "Label: text" → bold label. */
export const termsItems = (
  html: any,
): Array<{ label: string; body: string }> => {
  const src = String(html ?? '');
  if (!src.trim()) return [];
  let parts: string[] = [];
  const lis = src.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi);
  if (lis && lis.length) parts = lis.map((li) => plainText(li));
  else parts = plainText(src).split(/\n+/);
  return parts
    .map((p) =>
      p
        .replace(/\s+/g, ' ')
        .replace(/^\s*(\d+[.)]|[-•*])\s*/, '')
        .trim(),
    )
    .filter(Boolean)
    .map((text) => {
      const m = /^([^:.]{2,40}):\s+(.+)$/.exec(text);
      return m ? { label: m[1], body: m[2] } : { label: '', body: text };
    });
};

/* ------------------------------------------------------------------ model */

const str = (v: any): string =>
  v === null || v === undefined ? '' : String(v).trim();

const parseDetail = (d: any): any => {
  if (!d) return {};
  if (typeof d === 'object') return d;
  try {
    return JSON.parse(d) || {};
  } catch {
    return {};
  }
};

/**
 * BOQ JSON (GET /boqs/:id — categories[].items[], miscellaneous[], computed totals) or a BOQ
 * template (template: true) → print model.
 */
export function buildBudgetModel(
  boq: any,
  opts: {
    variant?: string;
    template?: boolean;
    terms?: string;
    monogramSrc: string;
    today?: any;
  },
): BudgetModel {
  const variant = opts.variant || 'client';
  const template = !!opts.template;
  const hidePrice = variant === 'quantity_only' || variant === 'vendor_enquiry';
  const n = (v: any) => num(v) ?? 0;
  const amountOf = (i: any) =>
    num(i.amount) !== null ? n(i.amount) : n(i.quantity) * n(i.rate);

  let sno = 0;
  const groups: BudgetGroup[] = [...(boq?.categories || [])]
    .sort((a: any, b: any) => n(a.sort_order) - n(b.sort_order))
    .map((c: any) => {
      const items = [...(c.items || [])]
        .filter((i: any) => !(variant === 'client' && i.hidden))
        .sort((a: any, b: any) => n(a.sort_order) - n(b.sort_order));
      const rows: BudgetRow[] = items.map((i: any) => {
        sno += 1;
        const d = parseDetail(i.detail);
        const notes = plainText(i.notes).replace(/\n+/g, ' ');
        const name = str(i.name);
        const lump = i.calc_type === 'L';
        return {
          sno,
          description:
            name && notes ? `${name} — ${notes}` : name || notes || 'Item',
          remarks: [d.remarks, d.brand, d.spec]
            .map(str)
            .filter(Boolean)
            .join(' · '),
          location: str(i.location),
          unit: str(i.unit).toUpperCase(),
          qty: qty2(i.quantity),
          rate: lump ? 'L.S' : num(i.rate) === null ? '' : rupees(i.rate),
          amount: rupees(amountOf(i)),
        };
      });
      const subtotal = items.reduce((s: number, i: any) => s + amountOf(i), 0);
      return { name: str(c.name) || 'Items', rows, subtotal: rupees(subtotal), _v: subtotal } as any;
    })
    .filter((g: any) => g.rows.length);

  const lineTotal = groups.reduce((s: number, g: any) => s + g._v, 0);
  const summary: Array<[string, string]> = [];
  let finalTotal = 0;
  if (template) {
    finalTotal = num(boq?.total_value) ?? lineTotal;
    if (groups.length > 1)
      groups.forEach((g: any) => summary.push([g.name, g.subtotal]));
    summary.push(['Template Total', rupees(finalTotal)]);
  } else {
    if (groups.length > 1)
      groups.forEach((g: any) => summary.push([g.name, g.subtotal]));
    const extras: Array<[string, any]> = [
      ['Design Amount', boq?.design_amount],
      ['Execution Amount', boq?.execution_amount],
      ['Supervision Amount', boq?.supervisor_amount],
      ['Additional Amount', boq?.additional_total],
      ['Discount', boq?.discount_amount ? -Math.abs(n(boq.discount_amount)) : 0],
    ];
    const extraVals = extras.filter(([, v]) => n(v) !== 0);
    extraVals.forEach(([l, v]) => summary.push([l, rupees(v)]));
    // The BOQ's own totals (server-computed, all rows incl. ones hidden from the client copy) —
    // the same figures the app shows and approves; computed here only for unsaved data.
    const projectTotal =
      num(boq?.project_total) === null
        ? lineTotal + extraVals.reduce((s, [, v]) => s + n(v), 0)
        : n(boq.project_total);
    summary.push(['Project Total', rupees(projectTotal)]);
    const misc = [...(boq?.miscellaneous || [])]
      .sort((a: any, b: any) => n(a.sort_order) - n(b.sort_order))
      .filter((m: any) => n(m.value) !== 0);
    misc.forEach((m: any) =>
      summary.push([
        m.notes ? `${str(m.name)} (${str(m.notes)})` : str(m.name),
        rupees(m.value),
      ]),
    );
    const miscTotal = misc.reduce((s: number, m: any) => s + n(m.value), 0);
    const gstPct = n(boq?.gst_pct ?? boq?.gst_percent);
    const gst = n(boq?.gst_amount) || (gstPct ? ((projectTotal + miscTotal) * gstPct) / 100 : 0);
    if (gst) summary.push([gstPct ? `GST @ ${gstPct}%` : 'GST', rupees(gst)]);
    finalTotal =
      num(boq?.final_total) === null
        ? projectTotal + miscTotal + gst
        : n(boq.final_total) + gst;
  }

  const title = template ? str(boq?.name) : str(boq?.title);
  const date = template
    ? ''
    : budgetDate(boq?.date || boq?.updated_at || boq?.created_at || opts.today || new Date());
  const variantLabel =
    !template && variant !== 'client' ? BUDGET_VARIANT_LABELS[variant] || '' : '';
  return {
    title: 'Budget Breakdown',
    subtitle: [title, variantLabel, date].filter(Boolean).join(' · '),
    projectName: template
      ? str(boq?.name)
      : str(boq?.project?.name) || title,
    address: template
      ? plainText(boq?.description).replace(/\n+/g, ' ')
      : str(boq?.location) || str(boq?.project?.site_location),
    estimateTotal: hidePrice ? '' : inr(finalTotal),
    priceCols: hidePrice ? (variant === 'vendor_enquiry' ? 'blank' : 'none') : 'all',
    groups: groups.map(({ name, rows, subtotal }: any) => ({ name, rows, subtotal })),
    summary: hidePrice ? [] : summary,
    finalTotal: hidePrice ? '' : rupees(finalTotal),
    terms: template ? [] : termsItems(opts.terms),
    monogramSrc: opts.monogramSrc,
  };
}

/* ------------------------------------------------------------------ HTML */

export const BUDGET_CSS = `
.bb-doc{font-family:Arial,"Liberation Sans",Helvetica,sans-serif;color:#333;-webkit-print-color-adjust:exact;print-color-adjust:exact;text-align:left;}
.bb-doc *{box-sizing:border-box;font-family:inherit;letter-spacing:normal;}
.bb-doc .pd-page{width:210mm;height:297mm;padding:52px 38px;background:#fff;overflow:hidden;position:relative;}
.bb-flow{width:210mm;padding:0 38px;}
.bb-head{display:flex;align-items:center;justify-content:space-between;}
.bb-mono{width:82px;display:flex;justify-content:center;}
.bb-mono img{height:24px;width:auto;display:block;}
.bb-titles{text-align:right;}
.bb-title{margin:0;font-size:24px;line-height:29px;font-weight:700;color:#2b2b2b;letter-spacing:0;}
.bb-sub{margin-top:2px;font-size:10px;line-height:14px;color:#7a8285;}
.bb-dash{border-top:1px dashed #c8cdcf;margin:13px 0 14px;height:0;}
.bb-meta{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}
.bb-project{font-size:12px;line-height:18px;color:#333;}
.bb-est{width:217px;border-left:1px solid #c8cdcf;padding-left:16px;}
.bb-est-label{font-size:10px;line-height:14px;color:#8a9194;text-transform:uppercase;}
.bb-est-value{font-size:17px;line-height:22px;font-weight:700;color:#333;}
.bb-table{width:100%;border-collapse:collapse;table-layout:fixed;}
.bb-table th{height:28px;background:#e5e9ea;color:#6d7578;font-size:8.5px;font-weight:700;text-transform:uppercase;text-align:left;padding:0 6px;vertical-align:middle;}
.bb-table td{font-size:10.5px;line-height:12px;color:#333;padding:8px 6px;vertical-align:top;border-bottom:1px solid #dfe3e4;overflow-wrap:anywhere;}
.bb-table .r{text-align:right;white-space:nowrap;}
.bb-table td.c{text-align:center;}
.bb-table tr.bb-cat td{background:#f3f5f5;font-size:11.5px;line-height:14px;font-weight:700;padding:9px 6px;border-bottom:0;}
.bb-table tr.bb-sub td{border-bottom:0;padding:12px 6px;color:#1f4d3a;font-weight:700;}
.bb-rem{display:block;margin-top:2px;font-size:9px;line-height:11px;color:#8a9194;}
.bb-sum{margin-top:18px;border:1px solid #d3d8da;border-radius:6px;padding:14px 18px 16px;}
.bb-sum-h{font-size:11px;line-height:14px;font-weight:700;color:#6d7578;text-transform:uppercase;margin-bottom:8px;}
.bb-sum-line{display:flex;justify-content:space-between;gap:16px;font-size:11.5px;line-height:17px;padding:2px 0;color:#333;}
.bb-sum-line span:last-child{white-space:nowrap;}
.bb-sum-final{display:flex;justify-content:space-between;gap:16px;border-top:1px solid #333;margin-top:10px;padding-top:8px;font-size:17px;line-height:22px;font-weight:700;color:#333;}
.bb-terms-h{margin:0;font-size:14px;line-height:17px;font-weight:700;color:#333;padding-bottom:6px;border-bottom:2px solid #333;}
.bb-terms-h.cont{border-bottom:0;padding-bottom:0;font-size:11px;color:#6d7578;}
.bb-terms ol{list-style:decimal outside;margin:12px 0 0;padding-left:18px;font-size:11.5px;line-height:18px;color:#666;}
.bb-terms ol.cont{margin-top:4px;}
.bb-terms li{display:list-item;}
.bb-terms li b{color:#555;font-weight:700;}
.bb-terms-gap{height:28px;}
`;

const colgroup = (priceCols: string): string => {
  const w =
    priceCols === 'none'
      ? [40, null, 130, 70, 90]
      : [40, null, 107, 52, 70, 78, 92];
  return `<colgroup>${w.map((x) => (x ? `<col style="width:${x}px">` : '<col>')).join('')}</colgroup>`;
};

/** "Civil Work — Extension" → "Civil Work (Extension)" for the subtotal line (as the template). */
const subtotalName = (name: string): string => {
  const m = /^(.+?)\s+[—–-]\s+(.+)$/.exec(name);
  return m ? `${m[1]} (${m[2]})` : name;
};

/** Unpaginated flow (header, table, summary, terms). paginateBudget() turns it into A4 pages. */
export function renderBudgetFlow(m: BudgetModel): string {
  const e = escHtml;
  const price = m.priceCols !== 'none';
  const cols = price ? 7 : 5;
  const head = `<tr><th>S.No</th><th>Description</th><th>Location</th><th>Unit</th><th class="r">Qty</th>${
    price ? '<th class="r">Rate</th><th class="r">Amount</th>' : ''
  }</tr>`;
  const body = m.groups
    .map((g) => {
      const rows = g.rows
        .map(
          (r) =>
            `<tr class="bb-item"><td class="c">${r.sno}</td><td>${e(r.description)}${
              r.remarks ? `<span class="bb-rem">${e(r.remarks)}</span>` : ''
            }</td><td>${e(r.location)}</td><td>${e(r.unit)}</td><td class="r">${e(r.qty)}</td>${
              m.priceCols === 'all'
                ? `<td class="r">${e(r.rate)}</td><td class="r">${e(r.amount)}</td>`
                : m.priceCols === 'blank'
                  ? '<td></td><td></td>'
                  : ''
            }</tr>`,
        )
        .join('');
      const sub =
        m.priceCols === 'all'
          ? `<tr class="bb-sub"><td colspan="${cols - 1}" class="r">Subtotal — ${e(subtotalName(g.name))}</td><td class="r">${e(g.subtotal)}</td></tr>`
          : '';
      return `<tr class="bb-cat"><td colspan="${cols}">${e(g.name)}</td></tr>${rows}${sub}`;
    })
    .join('');
  const summary =
    m.priceCols === 'all'
      ? `<div class="bb-sum"><div class="bb-sum-h">Cost Summary</div>${m.summary
          .map(
            ([l, v]) =>
              `<div class="bb-sum-line"><span>${e(l)}</span><span>${e(v)}</span></div>`,
          )
          .join(
            '',
          )}<div class="bb-sum-final"><span>Final Total</span><span>${e(m.finalTotal)}</span></div></div>`
      : '';
  const terms = m.terms.length
    ? `<div class="bb-terms"><div class="bb-terms-h" role="heading" aria-level="2">Terms &amp; Conditions</div><ol>${m.terms
        .map(
          (t) =>
            `<li>${t.label ? `<b>${e(t.label)}</b>: ` : ''}${e(t.body)}</li>`,
        )
        .join('')}</ol></div>`
    : '';
  return `<div class="bb-flow">
<div class="bb-top"><div class="bb-head"><div class="bb-mono">${
    m.monogramSrc ? `<img src="${e(m.monogramSrc)}" alt="Rippotai"/>` : ''
  }</div><div class="bb-titles"><div class="bb-title" role="heading" aria-level="1">${e(m.title)}</div>${
    m.subtitle ? `<div class="bb-sub">${e(m.subtitle)}</div>` : ''
  }</div></div><div class="bb-dash"></div><div class="bb-meta"><div class="bb-project">${
    m.projectName ? `<div>${e(m.projectName)}</div>` : ''
  }${m.address ? `<div>${e(m.address)}</div>` : ''}</div>${
    m.estimateTotal
      ? `<div class="bb-est"><div class="bb-est-label">Estimate Total</div><div class="bb-est-value">${e(m.estimateTotal)}</div></div>`
      : ''
  }</div></div>
<table class="bb-table">${colgroup(m.priceCols)}<thead>${head}</thead><tbody>${body}</tbody></table>
${summary}
${terms}
</div>`;
}

/** Full standalone HTML document (backend / headless Chrome). */
export function renderBudgetHtml(m: BudgetModel): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escHtml(
    [m.title, m.projectName].filter(Boolean).join(' — '),
  )}</title><style>@page{size:A4;margin:0;}html,body{margin:0;padding:0;background:#fff;}
.bb-doc .pd-page+.pd-page{break-before:page;}${BUDGET_CSS}</style></head><body><div class="bb-doc">${renderBudgetFlow(
    m,
  )}</div></body></html>`;
}

/* ------------------------------------------------------------------ pagination */

/**
 * Packs .bb-flow (inside root) onto A4 .pd-page sheets: header block on page 1, table rows never
 * split (category header stays with its first item, a subtotal never opens a page, the column
 * header repeats on every page the table continues on), cost summary kept whole, terms start on
 * a new page. Self-contained (runs via puppeteer page.evaluate) — no outer references.
 */
export function paginateBudget(root: any): number {
  const flow = root.querySelector('.bb-flow');
  if (!flow) return root.querySelectorAll('.pd-page').length;
  const doc = root.ownerDocument;
  const MM = 96 / 25.4;
  const BODY = 297 * MM - 104 - 2; // sheet − 52px top/bottom padding − rounding spare
  const outer = (el: any) => {
    if (!el) return 0;
    const cs = doc.defaultView.getComputedStyle(el);
    return (
      el.getBoundingClientRect().height +
      parseFloat(cs.marginTop || '0') +
      parseFloat(cs.marginBottom || '0')
    );
  };
  const top = flow.querySelector('.bb-top');
  const table = flow.querySelector('.bb-table');
  const thead = table && table.querySelector('thead');
  const rows: any[] = table ? Array.from(table.querySelectorAll('tbody > tr')) : [];
  const summary = flow.querySelector('.bb-sum');
  const termsBox = flow.querySelector('.bb-terms');
  const termsH = termsBox && termsBox.querySelector('.bb-terms-h');
  const termsOl = termsBox && termsBox.querySelector('ol');
  const lis: any[] = termsOl ? Array.from(termsOl.children) : [];
  const theadH = outer(thead);
  const rowH = rows.map((r) => r.getBoundingClientRect().height);
  const sumH = outer(summary);
  const termsHH = outer(termsH);
  const liH = lis.map((li) => li.getBoundingClientRect().height);
  const olTop = termsOl ? parseFloat(doc.defaultView.getComputedStyle(termsOl).marginTop || '0') : 0;

  type Page = { top: boolean; rows: number[]; summary: boolean; termsHead: boolean; lis: number[]; used: number };
  const pages: Page[] = [];
  const newPage = (): Page => {
    const p = { top: false, rows: [], summary: false, termsHead: false, lis: [], used: 0 };
    pages.push(p);
    return p;
  };
  let cur = newPage();
  cur.top = true;
  cur.used = outer(top);

  // rows in groups that must stay together
  let i = 0;
  while (i < rows.length) {
    const grp = [i];
    if (rows[i].classList.contains('bb-cat') && i + 1 < rows.length) grp.push(i + 1);
    let j = grp[grp.length - 1] + 1;
    while (j < rows.length && rows[j].classList.contains('bb-sub')) grp.push(j++);
    const h = grp.reduce((s, k) => s + rowH[k], 0);
    const need = h + (cur.rows.length ? 0 : theadH);
    const pageEmpty = !cur.rows.length && !cur.top;
    if (cur.used + need > BODY && !pageEmpty) {
      cur = newPage();
      cur.used = theadH + h;
    } else cur.used += need;
    cur.rows.push(...grp);
    i = grp[grp.length - 1] + 1;
  }
  if (summary) {
    if (cur.used + sumH > BODY && (cur.rows.length || cur.top)) cur = newPage();
    cur.summary = true;
    cur.used += sumH;
  }
  if (lis.length) {
    cur = newPage();
    cur.termsHead = true;
    cur.used = termsHH + olTop;
    lis.forEach((_, k) => {
      if (cur.used + liH[k] > BODY && cur.lis.length) {
        cur = newPage();
        cur.used = olTop;
      }
      cur.lis.push(k);
      cur.used += liH[k];
    });
  }

  const sheets = pages.map((p) => {
    const sheet = doc.createElement('div');
    sheet.className = 'pd-page bb-page';
    if (p.top && top) sheet.appendChild(top.cloneNode(true));
    if (p.rows.length && table) {
      const t = table.cloneNode(false);
      const cg = table.querySelector('colgroup');
      if (cg) t.appendChild(cg.cloneNode(true));
      if (thead) t.appendChild(thead.cloneNode(true));
      const tb = doc.createElement('tbody');
      p.rows.forEach((k) => tb.appendChild(rows[k].cloneNode(true)));
      t.appendChild(tb);
      sheet.appendChild(t);
    }
    if (p.summary && summary) sheet.appendChild(summary.cloneNode(true));
    if (p.termsHead || p.lis.length) {
      const box = termsBox.cloneNode(false);
      if (p.termsHead && termsH) box.appendChild(termsH.cloneNode(true));
      if (p.lis.length) {
        const ol = termsOl.cloneNode(false);
        ol.setAttribute('start', String(p.lis[0] + 1));
        if (!p.termsHead) ol.className = 'cont';
        p.lis.forEach((k) => ol.appendChild(lis[k].cloneNode(true)));
        box.appendChild(ol);
      }
      sheet.appendChild(box);
    }
    return sheet;
  });
  flow.remove();
  sheets.forEach((s) => root.appendChild(s));
  return sheets.length;
}
