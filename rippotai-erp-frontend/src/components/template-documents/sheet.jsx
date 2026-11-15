// Sheet documents — INOS outputs that reproduce the user's original Google-Sheets / Word templates
// (Purchase Order, Work Order, Delivery Challan, Estimate …) 1:1. Geometry is in PDF points taken
// from the reference PDFs in the template pack, so a single-page order lands on the same grid.
//
//  <SheetDocument frame={{ left, top, width, height, border }} segments={[…]} heads={{ id: node }} />
//   • segments: [{ key, node, table?, keepNext?, bottom? }] are measured off-screen and packed onto
//     A4 pages; a table row that starts a new page gets its table's head (heads[table]) repeated;
//     `bottom` segments sit together at the foot of the last page (e.g. challan remarks + signatures).
//   • The root carries .pd-page pages, so downloadDocumentPdf() from the print kit captures it.
import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import './sheet.css';
import { PT_PER_PX, txt } from './sheet-utils';

const PAGE_H = 841.89;

function packPages(segments, heights, headHeights, maxH, skip = new Set()) {
  const pages = [];
  let cur = { items: [], used: 0 };
  const flush = () => {
    pages.push(cur);
    cur = { items: [], used: 0 };
  };
  const body = segments.map((s, i) => ({ s, i })).filter((x) => !x.s.bottom && !skip.has(x.i));
  const bottomH = segments.reduce((sum, s, i) => sum + (s.bottom ? heights[i] || 0 : 0), 0);
  body.forEach(({ s, i }, n) => {
    let need = heights[i] || 0;
    // keepNext: this segment travels with the next one(s) (headings, table heads).
    for (let j = 1; j <= (s.keepNext || 0) && body[n + j]; j += 1) need += heights[body[n + j].i] || 0;
    if (cur.items.length && cur.used + need > maxH) flush();
    if (!cur.items.length && pages.length && s.table && !s.isHead) {
      cur.items.push({ head: s.table });
      cur.used += headHeights[s.table] || 0;
    }
    cur.items.push({ i });
    cur.used += heights[i] || 0;
  });
  if (bottomH && cur.used + bottomH > maxH && cur.items.length) flush();
  pages.push(cur);
  return pages.map((p) => p.items);
}

export const SheetDocument = forwardRef(function SheetDocument(
  { className = '', frame, segments, heads = {}, pageNumbers = true },
  ref,
) {
  const measureRef = useRef(null);
  const [pages, setPages] = useState(null);

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const h = (el) => (el ? el.getBoundingClientRect().height * PT_PER_PX : 0);
    const heights = segments.map((_, i) => h(root.querySelector(`[data-seg="${i}"]`)));
    const headHeights = {};
    Object.keys(heads).forEach((id) => {
      headHeights[id] = h(root.querySelector(`[data-head="${id}"]`));
    });
    // filler segments (the template's empty numbered rows) are dropped from the end when keeping
    // them would add a page.
    const fillers = segments.map((s, i) => (s.filler ? i : -1)).filter((i) => i >= 0);
    const minPages = packPages(segments, heights, headHeights, frame.height, new Set(fillers)).length;
    let next = null;
    // a document that needs several pages anyway drops all of them.
    for (let keep = minPages > 1 ? 0 : fillers.length; keep >= 0 && !next; keep -= 1) {
      const p = packPages(segments, heights, headHeights, frame.height, new Set(fillers.slice(keep)));
      if (p.length <= minPages) next = p;
    }
    setPages((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [segments, heads, frame.height]);

  useLayoutEffect(() => {
    measure();
    let alive = true;
    (document.fonts?.ready || Promise.resolve()).then(() => alive && measure());
    const imgs = Array.from(measureRef.current?.querySelectorAll('img') || []);
    imgs.forEach((img) => img.addEventListener('load', measure));
    return () => {
      alive = false;
      imgs.forEach((img) => img.removeEventListener('load', measure));
    };
  }, [measure]);

  const layout = pages || [segments.map((s, i) => (s.bottom ? null : { i })).filter(Boolean)];
  const bottomIdx = segments.map((s, i) => (s.bottom ? i : -1)).filter((i) => i >= 0);
  const frameStyle = (last) => ({
    left: `${frame.left}pt`,
    top: `${frame.top}pt`,
    width: `${frame.width}pt`,
    ...(frame.border ? {} : { borderColor: 'transparent' }),
    ...(last && !frame.fullHeight ? {} : { height: `${frame.height}pt` }),
  });

  return (
    <>
      <div ref={ref} className={`ts-doc pd-doc-sheet ${className}`} data-page-height="297">
        {layout.map((items, p) => {
          const last = p === layout.length - 1;
          return (
            <div className="pd-page ts-page" key={p}>
              <div className={`ts-frame ${frame.border ? 'ts-frame--border' : ''}`} style={frameStyle(last)}>
                {items.map((it) =>
                  it.head ? (
                    <React.Fragment key={`h-${it.head}`}>{heads[it.head]}</React.Fragment>
                  ) : (
                    <React.Fragment key={segments[it.i].key}>{segments[it.i].node}</React.Fragment>
                  ),
                )}
                {last && bottomIdx.length > 0 && (
                  <div className="ts-bottom">
                    {bottomIdx.map((i) => (
                      <React.Fragment key={segments[i].key}>{segments[i].node}</React.Fragment>
                    ))}
                  </div>
                )}
              </div>
              {pageNumbers && layout.length > 1 && (
                <div
                  className="ts-pageno"
                  style={{ top: `${Math.min(frame.top + frame.height + 6, PAGE_H - 16)}pt`, right: `${595.28 - frame.left - frame.width}pt` }}
                >
                  Page {p + 1} of {layout.length}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className={`ts-doc ts-measure ${className}`} aria-hidden="true" ref={measureRef}>
        <div className="ts-frame" style={{ width: `${frame.width}pt`, position: 'static' }}>
          {segments.map((s, i) => (
            <div key={s.key} data-seg={i} className="ts-seg">
              {s.node}
            </div>
          ))}
          {Object.entries(heads).map(([id, node]) => (
            <div key={id} data-head={id} className="ts-seg">
              {node}
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

/** "Name  ·  value" / "Date  ·  value" lines (underscores when empty) — template signature style. */
export function SignLine({ label, value, className = '' }) {
  return (
    <div className={`ts-signline ${className}`}>
      {label}&nbsp;&nbsp;·&nbsp;&nbsp;{txt(value) ? <span className="ts-signline__v">{value}</span> : '____________________'}
    </div>
  );
}
