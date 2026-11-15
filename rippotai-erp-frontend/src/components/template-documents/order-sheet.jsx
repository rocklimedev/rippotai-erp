// Order sheet — the shared grid of the original PURCHASE ORDER and WORK ORDER templates
// (PO+WO+DC TEMPLATES.xlsx → PDF). All geometry is in PO points; the work order is the same
// sheet printed "fit to page", i.e. scaled by k ≈ 0.9226 with a 32 pt left margin.
import { SignLine } from './sheet';
import { SHEET_LOGO, padRows, txt, amt, at } from './sheet-utils';

export const PO_GEOMETRY = {
  k: 1,
  frame: { left: 8.9, top: 4.3, width: 577.2, height: 768.4 },
  headerH: 107.7,
  logo: { x: 37.1, y: 5.7, w: 51, h: 61 },
  title: { top: 14.4, size: 18.6 },
  sub: { top: 35.6, size: 13 },
  tagline: { top: 66, size: 8.3 },
  info: { tops: [77.1, 87.3, 97.4], size: 8.3, metaX: 404.9 },
};

// Work order: same sheet scaled; header measured from WORK ORDER TEMPLATE.pdf.
export const WO_GEOMETRY = {
  k: 0.9226,
  frame: { left: 32, top: 7.4, width: 532.5, height: 828 },
  headerH: 96.7,
  logo: { x: 34, y: 4.6, w: 47, h: 57 },
  title: { top: 13.3, size: 17.1 },
  sub: { top: 32.9, size: 12 },
  tagline: { top: 60.9, size: 7.7 },
  info: { tops: [71.1, 80.5, 89.9], size: 7.7, metaX: 373.5 },
};

const phoneDigits = (p) => txt(p).replace(/^\+91/, '').replace(/[\s-]/g, '');

export function buildOrderSheet(g, d) {
  const k = g.k;
  const u = (n) => `${n * k}pt`;
  const fs = (n) => `${Math.round(n * k * 10) / 10}pt`;
  const W = g.frame.width;
  const pad = 2.5 * k;

  // ---- header (logo, title, company + document meta)
  const H = g.headerH;
  const abs = (left, top, size, style = {}) => ({
    left: `${left}pt`,
    top: `${at(top, size)}pt`,
    fontSize: `${size}pt`,
    ...style,
  });
  const company = d.company || {};
  const info = [
    `Address: ${txt(company.address)}`,
    `Phone:${phoneDigits(company.phone)}${txt(company.email) ? ` | Email: ${txt(company.email)}` : ''}`,
    `PAN: ${txt(company.pan)}`,
  ];
  const header = (
    <div style={{ position: 'relative', height: `${H}pt` }} className="ts-b">
      <img
        src={SHEET_LOGO}
        alt="Rippotai"
        style={{ position: 'absolute', left: `${g.logo.x}pt`, top: `${g.logo.y}pt`, width: `${g.logo.w}pt`, height: `${g.logo.h}pt` }}
      />
      <div className="ts-abs ts-bold ts-green" style={abs(0, g.title.top, g.title.size, { right: `${pad}pt`, left: 'auto' })}>
        {d.title}
      </div>
      <div className="ts-abs ts-green" style={abs(0, g.sub.top, g.sub.size, { right: `${pad}pt`, left: 'auto' })}>
        {d.subtitle}
      </div>
      <div className="ts-abs" style={abs(pad, g.tagline.top, g.tagline.size, { color: 'var(--ts-sage)' })}>
        ARCHITECTURE · INTERIORS · TURNKEY
      </div>
      {info.map((line, i) => (
        <div key={`i${i}`} className="ts-abs ts-calibri" style={abs(pad, g.info.tops[i], g.info.size)}>
          {line}
        </div>
      ))}
      {d.meta.map((m, i) => (
        <div key={`m${i}`} className="ts-abs ts-calibri" style={abs(g.info.metaX, g.info.tops[i], g.info.size)}>
          {m.label} {txt(m.value)}
        </div>
      ))}
    </div>
  );

  // ---- band + party grid
  const [c1, c2, c3] = [84.2, 196.9, 121.3].map((n) => n * k);
  const c4 = W - c1 - c2 - c3;
  const band = (
    <div className="ts-row ts-b" style={{ height: u(17.1), background: 'var(--ts-band)' }}>
      {[d.band[0], d.band[1]].map((t, i) => (
        <div
          key={t}
          className={`ts-cell ts-cell--mid ts-bold ${i === 0 ? 'ts-r' : ''}`}
          style={{ width: `${i === 0 ? c1 + c2 : c3 + c4}pt`, justifyContent: 'center', color: '#fff', fontSize: fs(8.3) }}
        >
          {t}
        </div>
      ))}
    </div>
  );
  const nRows = Math.max(d.left.length, d.right.length);
  // a value may be "text" or { text, sub } (sub = a smaller second line, e.g. the contractor address)
  const cellVal = (v) =>
    v && typeof v === 'object' && !Array.isArray(v) && 'text' in v ? (
      <>
        {v.text}
        {txt(v.sub) ? <span className="ts-sub">{v.sub}</span> : null}
      </>
    ) : (
      v
    );
  const lab = { fontSize: fs(7.4), padding: `0 ${pad}pt ${0.9 * k}pt` };
  const val = { fontSize: fs(8.3), color: 'var(--ts-ink)', padding: `${1.2 * k}pt ${pad}pt ${0.7 * k}pt` };
  const partyRows = Array.from({ length: nRows }, (_, r) => {
    const L = d.left[r];
    const R = d.right[r];
    return (
      <div key={r} className="ts-row" style={{ minHeight: u(17.1) }}>
        <div className="ts-cell ts-r ts-b" style={{ width: `${c1}pt`, ...lab }}>{L ? L[0] : ''}</div>
        <div className="ts-cell ts-r ts-b" style={{ width: `${c2}pt`, ...val }}>
          <span className="ts-in">{L ? cellVal(L[1]) : ''}</span>
        </div>
        {R ? (
          <>
            <div className="ts-cell ts-r ts-b" style={{ width: `${c3}pt`, ...lab }}>{R[0]}</div>
            <div className="ts-cell ts-b" style={{ width: `${c4}pt`, ...val }}>
              <span className="ts-in">{cellVal(R[1])}</span>
            </div>
          </>
        ) : null}
      </div>
    );
  });

  // ---- item table
  const tc = [25, 377.4, 40, 64.9].map((n) => n * k);
  const tcLast = W - tc.reduce((a, b) => a + b, 0);
  const widths = [...tc, tcLast];
  const headCell = { fontSize: fs(8.3), padding: `0 ${pad}pt ${1.6 * k}pt` };
  const tableHead = (
    <div className="ts-row ts-b ts-t ts-bold" style={{ height: u(18.5), marginTop: '-0.71pt' }}>
      {['S.No', d.descHead, 'Qty', 'Rate (₹)', 'Amount (₹)'].map((t, i) => (
        <div
          key={t}
          className={`ts-cell ${i < 4 ? 'ts-r' : ''} ${i === 1 || i === 2 ? 'ts-center' : i > 2 ? 'ts-right' : ''}`}
          style={{ width: `${widths[i]}pt`, ...headCell, justifyContent: i === 1 || i === 2 ? 'center' : i > 2 ? 'flex-end' : 'flex-start' }}
        >
          {t.includes('₹') ? (
            <span>
              {t.split('₹')[0]}
              <span className="ts-arial">₹</span>
              {t.split('₹')[1]}
            </span>
          ) : (
            t
          )}
        </div>
      ))}
    </div>
  );
  const rowCell = { fontSize: fs(9.3), color: 'var(--ts-ink)', padding: `${1.5 * k}pt ${pad}pt ${0.9 * k}pt` };
  const itemRows = padRows(d.items, d.minRows ?? 10).map((it, i) => (
    <div key={`r${i}`} className="ts-row ts-b" style={{ minHeight: u(17.1) }}>
      <div className="ts-cell ts-r" style={{ width: `${widths[0]}pt`, ...rowCell }}>{i + 1}</div>
      <div className="ts-cell ts-r" style={{ width: `${widths[1]}pt`, ...rowCell }}>
        <span className="ts-in">
          {it?.desc}
          {txt(it?.sub) ? <span className="ts-sub">{it.sub}</span> : null}
        </span>
      </div>
      <div className="ts-cell ts-r ts-right" style={{ width: `${widths[2]}pt`, ...rowCell, paddingLeft: `${0.8 * k}pt`, paddingRight: `${1.6 * k}pt`, whiteSpace: 'nowrap', letterSpacing: '-0.1pt' }}>
        <span className="ts-in">
          {it?.qty}
          {txt(it?.unit) ? <span className="ts-unit">&nbsp;{it.unit}</span> : null}
        </span>
      </div>
      <div className="ts-cell ts-r ts-right" style={{ width: `${widths[3]}pt`, ...rowCell }}>
        <span className="ts-in">{it ? amt(it.rate) : ''}</span>
      </div>
      <div className="ts-cell ts-right" style={{ width: `${widths[4]}pt`, ...rowCell }}>
        <span className="ts-in">{it ? amt(it.amount) : ''}</span>
      </div>
    </div>
  ));

  // ---- totals (+ notes in the blank area on the left)
  const leftW = widths[0] + widths[1] + widths[2];
  const t = d.totals;
  const totRow = (label, value) => (
    <div className="ts-row" style={{ height: u(17.1) }}>
      <div className="ts-cell ts-r ts-b ts-l ts-right" style={{ width: `${widths[3]}pt`, ...rowCell, justifyContent: 'flex-end', marginLeft: '-0.71pt' }}>
        {label}
      </div>
      <div className="ts-cell ts-b ts-right" style={{ width: `${widths[4]}pt`, ...rowCell, justifyContent: 'flex-end' }}>
        {value}
      </div>
    </div>
  );
  const totals = (
    <div className="ts-row" style={{ minHeight: u(87) }}>
      <div style={{ width: `${leftW}pt`, padding: `${4 * k}pt ${pad}pt 0`, fontSize: fs(8.3), color: 'var(--ts-ink)' }}>
        {(d.notes || []).filter((n) => txt(n.value)).map((n) => (
          <div key={n.label} style={{ marginBottom: `${4 * k}pt`, lineHeight: 1.35, maxWidth: `${leftW - 20 * k}pt` }}>
            <div className="ts-bold ts-green">{n.label}</div>
            <div style={{ whiteSpace: 'pre-line' }}>{n.value}</div>
          </div>
        ))}
      </div>
      <div style={{ width: `${widths[3] + widths[4]}pt` }}>
        {totRow('SUB TOTAL', amt(t.subtotal))}
        {totRow('DISCOUNT', t.discount ? amt(t.discount) : '')}
        {totRow(t.gstLabel || 'GST%', t.gst ? amt(t.gst) : '')}
        {totRow('CARTAGE', t.cartage ? amt(t.cartage) : '')}
        <div className="ts-row ts-b ts-bold ts-green" style={{ height: u(18.5), marginLeft: '-0.71pt' }}>
          <div className="ts-cell ts-right" style={{ width: `${widths[3]}pt`, ...rowCell, color: 'var(--ts-green)', justifyContent: 'flex-end', paddingBottom: `${2.4 * k}pt` }}>
            TOTAL
          </div>
          <div className="ts-cell ts-right" style={{ width: `${widths[4]}pt`, ...rowCell, color: 'var(--ts-green)', fontSize: fs(10.2), justifyContent: 'flex-end', paddingBottom: `${2.2 * k}pt` }}>
            {t.total ? amt(t.total) : '—'}
          </div>
        </div>
      </div>
    </div>
  );

  // ---- payment terms (work order)
  let payment = [];
  if (d.payment) {
    const pc = [77.7, 181.6, 148.8];
    const pw = [...pc, W - pc.reduce((a, b) => a + b, 0)];
    const prow = (cells, key, opts = {}) => (
      <div key={key} className={`ts-row ts-b ts-arial ${opts.className || ''}`} style={{ minHeight: `${opts.h}pt` }}>
        {cells.map((c, i) => (
          <div
            key={i}
            className={`ts-cell ts-cell--mid ${i < 3 ? 'ts-r' : ''}`}
            style={{ width: `${pw[i]}pt`, justifyContent: opts.align?.[i] || 'center', fontSize: `${opts.size}pt`, padding: '0 3pt', textAlign: opts.align?.[i] === 'flex-end' ? 'right' : 'left' }}
          >
            {c}
          </div>
        ))}
      </div>
    );
    payment = [
      {
        key: 'pay-title',
        keepNext: 2,
        node: (
          <div style={{ paddingTop: '20.4pt' }}>
            <div className="ts-row ts-b ts-t ts-arial ts-bold" style={{ height: '15.8pt', justifyContent: 'center', alignItems: 'center', fontSize: '11.1pt' }}>
              PAYMENT TERMS
            </div>
          </div>
        ),
      },
      { key: 'pay-head', isHead: true, table: 'pay', keepNext: 1, node: prow(['STAGES', 'DATE', 'AMOUNT', 'Remarks'], 'ph', { h: 15.8, size: 9.4 }) },
      ...padRows(d.payment, 4).map((p, i) => ({
        key: `pay-${i}`,
        table: 'pay',
        filler: i >= d.payment.length && i > 0,
        node: prow(
          p ? [p.stage, p.date, amt(p.amount), p.remarks] : ['', '', '', ''],
          `p${i}`,
          { h: 13.8, size: 8, align: ['flex-start', 'center', 'flex-end', 'flex-start'] },
        ),
      })),
      ...(txt(d.paymentNote)
        ? [
            {
              key: 'pay-note',
              node: (
                <div className="ts-row ts-b ts-arial" style={{ minHeight: '13.8pt', fontSize: '8pt', padding: '2pt 3pt', alignItems: 'center', whiteSpace: 'pre-line' }}>
                  {d.paymentNote}
                </div>
              ),
            },
          ]
        : []),
    ];
  }

  // ---- terms
  const termSize = 8.3 * k;
  const termsTitle = (
    <div className="ts-bold ts-green" style={{ fontSize: fs(9.3), lineHeight: 1, padding: `${d.payment ? 4.8 : 27.3 * k}pt ${pad}pt ${4.4 * k}pt` }}>
      TERMS & CONDITION
    </div>
  );
  const termRows = (d.terms || []).map((term, i) => (
    <li
      key={i}
      style={{
        fontSize: `${termSize}pt`,
        lineHeight: d.payment ? 1.27 : 1,
        padding: `${(d.payment ? 1.2 : 2.65) * k}pt ${12 * k}pt ${(d.payment ? 1.2 : 2.65) * k}pt ${8.9 * k}pt`,
      }}
    >
      <b style={{ width: `${18.6 * k}pt` }}>{i + 1}.</b>
      <span>{term}</span>
    </li>
  ));

  // ---- signatures
  const S = d.sign;
  const sigTop = 29.9 * k - 8; // FOR RIPPOTAI top, relative to the end of the terms list
  const lineY = sigTop + 46 * k;
  const sign = (
    <div style={{ position: 'relative', height: `${lineY + 59.9 * k}pt` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: `${lineY}pt`, borderTop: 'var(--ts-rule)' }} />
      {[
        [S.left, pad],
        [S.right, g.info.metaX],
      ].map(([s, left]) => (
        <div key={s.title} style={{ position: 'absolute', left: `${left}pt`, top: 0, bottom: 0, width: `${W / 2 - 10}pt` }}>
          <div className="ts-abs ts-bold ts-green" style={{ left: 0, top: `${at(sigTop, 8.3 * k)}pt`, fontSize: fs(8.3) }}>
            {s.title}
          </div>
          {txt(s.signedFor) ? (
            <div className="ts-abs" style={{ left: 0, top: `${at(sigTop + 14 * k, 8.3 * k)}pt`, fontSize: fs(8.3), color: 'var(--ts-ink)' }}>
              {s.signedFor}
            </div>
          ) : null}
          <div className="ts-abs" style={{ left: 0, top: `${at(lineY + 7.1 * k, 7.4 * k)}pt`, fontSize: fs(7.4), color: 'var(--ts-sage)' }}>
            {s.caption}
          </div>
          <div className="ts-abs" style={{ left: 0, top: `${at(lineY + 21.1 * k, 8.3 * k)}pt`, fontSize: fs(8.3) }}>
            <SignLine label="Name" value={s.name} />
          </div>
          <div className="ts-abs" style={{ left: 0, top: `${at(lineY + 36.1 * k, 8.3 * k)}pt`, fontSize: fs(8.3) }}>
            <SignLine label="Date" value={s.date} />
          </div>
        </div>
      ))}
    </div>
  );

  const segments = [
    { key: 'header', node: <div>{header}{band}{partyRows}</div> },
    { key: 'gap', keepNext: 2, node: <div style={{ height: u(32.1) }} /> },
    { key: 'thead', isHead: true, table: 'items', keepNext: 1, node: tableHead },
    ...itemRows.map((node, i) => ({ key: `row-${i}`, table: 'items', node, filler: i >= d.items.length })),
    { key: 'totals', node: totals },
    ...payment,
    { key: 'terms-title', keepNext: 1, node: termsTitle },
    ...termRows.map((node, i) => ({
      key: `term-${i}`,
      keepNext: i === termRows.length - 1 ? 1 : 0, // the last clause travels with the signatures
      node: <ul className="ts-terms">{node}</ul>,
    })),
    { key: 'sign', node: sign },
  ];
  const heads = { items: tableHead };
  if (d.payment) heads.pay = payment[1].node;
  return { frame: { ...g.frame, border: true }, segments, heads };
}

