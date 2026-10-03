// PrintDocument — the one A4 layout every client-facing document uses.
//
//  • Fixed cover: big Rippotai mark, document name, project, and a details band at the bottom.
//  • Inner pages: small logo + "Doc type · Project" header, footer with "Page x / y".
//  • Content is measured off-screen and packed greedily onto 210 × 297 mm sheets:
//    headings travel with their first block, sections never start in the last 45 mm,
//    tables longer than 5 rows split with "(continued)" + repeated column header,
//    and the last row of a table never sits alone on a new page.
//
// See /tmp/inos2/print-kit.md (and index.js) for the API.
import React, { forwardRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import "@fontsource/lato/300.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource/lato/900.css";
import "./print-document.css";
import mark from "../../assets/rippotai_mark.png";
import { has } from "./format";
import { RowsHead, Row, TextItem } from "./primitives";

const MM = 96 / 25.4; // CSS px per mm
// Inner page: 297 − 14 (top pad) − 11 (header) − 9 (body pad) − 14 (footer) = 249 mm; keep 1.5 mm spare.
const BODY_HEIGHT_PX = 247.5 * MM;
const CONT_HEAD_PX = 15 * MM; // "Section (continued)" label + repeated column header
const FRESH_SECTION_PX = 45 * MM; // don't open a section in the last 45 mm
const WHOLE_TABLE_MAX = 5; // tables with ≤ 5 rows are never split

/* ------------------------------------------------------------ flatten sections → blocks */

function expandBlocks(section, si) {
  const out = []; // { node, isRow?, tableId?, contHead?, tight? }
  const specs = [...(section.rows ? [{ table: section.rows }] : []), ...(section.blocks || [])];
  specs.forEach((spec, bi) => {
    if (spec == null || spec === false) return;
    // table spec
    if (spec && typeof spec === "object" && !React.isValidElement(spec) && spec.table) {
      const t = spec.table;
      const items = (t.items || []).filter(Boolean);
      if (!items.length) return;
      const head = <RowsHead cols={t.cols} template={t.template} />;
      const label = t.heading ? (
        <div className="pd-subhead">{t.heading}</div>
      ) : t.label ? (
        <span className="pd-label" style={{ marginBottom: "2.5mm" }}>
          {t.label}
        </span>
      ) : null;
      const rowNode = (it, i) => (
        <Row key={it?.key ?? i} cols={t.cols} template={t.template} cells={Array.isArray(it) ? it : it.cells} variant={it?.variant} />
      );
      if ((items.length <= WHOLE_TABLE_MAX && !t.allowSplit) || t.keepWhole) { // allowSplit (docs-commerce): let short tables flow too
        out.push({
          node: (
            <div>
              {label}
              {head}
              {items.map(rowNode)}
            </div>
          ),
        });
        return;
      }
      const tableId = `${si}-${bi}`;
      items.forEach((it, i) =>
        out.push({
          node: (
            <div>
              {i === 0 && (
                <>
                  {label}
                  {head}
                </>
              )}
              {rowNode(it, i)}
            </div>
          ),
          isRow: true,
          tableStart: i === 0,
          tableId,
          contHead: head,
          contTitle: t.contLabel || (typeof (t.heading || t.label) === "string" ? `${section.title} — ${t.heading || t.label}` : undefined),
          tight: i < items.length - 1,
        }),
      );
      return;
    }
    // long text spec — split into paragraphs so it can flow across pages
    if (spec && typeof spec === "object" && !React.isValidElement(spec) && spec.text) {
      const { label, value } = spec.text;
      if (!has(value)) return;
      const paras = String(value)
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (paras.length <= 1 || String(value).length < 900) {
        out.push({ node: <TextItem label={label} value={value} /> });
        return;
      }
      paras.forEach((p, i) =>
        out.push({
          node: i === 0 ? <TextItem label={label} value={p} /> : <p className="pd-text">{p}</p>,
          para: true,
          tight: i < paras.length - 1,
        }),
      );
      return;
    }
    // { keep: node } — a block that must stay on the same page as the block before it (e.g. totals under a table)
    if (spec && typeof spec === "object" && !React.isValidElement(spec) && spec.keep) {
      out.push({ node: spec.keep, keepWithPrev: true });
      return;
    }
    out.push({ node: spec });
  });
  return out;
}

function flatten(sections, numbered) {
  const flat = [];
  let n = 0;
  (sections || []).forEach((s, si) => {
    if (!s) return;
    const blocks = expandBlocks(s, si);
    if (!blocks.length) return;
    n += 1;
    blocks.forEach((b, bi) => {
      flat.push({
        ...b,
        key: `${si}-${bi}`,
        sectionStart: bi === 0,
        sectionEnd: bi === blocks.length - 1,
        newPage: bi === 0 && !!s.newPage,
        sectionTitle: s.title,
        node:
          bi === 0 ? (
            <>
              {s.title && (
                <div className="pd-section-head">
                  {numbered && <span className="pd-section-head__no">{String(n).padStart(2, "0")}</span>}
                  <h2 className="pd-section-head__title">{s.title}</h2>
                </div>
              )}
              {s.intro && <p className="pd-section-intro">{s.intro}</p>}
              {b.node}
            </>
          ) : (
            b.node
          ),
      });
    });
  });
  return flat;
}

/* ------------------------------------------------------------ pagination */

function paginate(full, content, flat) {
  const pages = [];
  let cur = [];
  let used = 0;
  const sameTable = (a, b) => a && b && a.isRow && b.isRow && a.tableId === b.tableId;
  const startPage = (carry, b) => {
    pages.push(cur);
    cur = [...carry];
    const first = carry.length ? flat[carry[0]] : b;
    used = (first && !first.sectionStart && first.isRow && !first.tableStart ? CONT_HEAD_PX : 0) + carry.reduce((s, i) => s + full[i], 0);
  };
  flat.forEach((b, i) => {
    const next = flat[i + 1];
    const overflow = used + content[i] > BODY_HEIGHT_PX;
    const wantsFresh = b.sectionStart && (b.newPage || BODY_HEIGHT_PX - used < FRESH_SECTION_PX);
    // a table must not open with a single row at the foot of a page
    const lonelyStart = b.tableStart && sameTable(b, next) && used + full[i] + content[i + 1] > BODY_HEIGHT_PX;
    if (cur.length && (overflow || wantsFresh || lonelyStart)) {
      // widow control: the last row of a table takes the previous row with it
      const prevIdx = cur[cur.length - 1];
      const carry =
        overflow && b.isRow && !b.tableStart && !sameTable(b, next) && sameTable(flat[prevIdx], b) &&
        !flat[prevIdx].tableStart && cur.length > 1;
      const carried = [];
      if (carry) carried.unshift(cur.pop());
      // keep-with-previous: take the previous block along (and, if that is the last row of a table, the row before it too)
      if (!carry && overflow && b.keepWithPrev && cur.length > 1) {
        carried.unshift(cur.pop());
        const p2 = cur[cur.length - 1];
        if (flat[prevIdx].isRow && sameTable(flat[p2], flat[prevIdx]) && !flat[p2].tableStart && cur.length > 1) carried.unshift(cur.pop());
      }
      startPage(carried, b);
    }
    cur.push(i);
    used += full[i];
  });
  if (cur.length) pages.push(cur);
  return pages;
}

/* ------------------------------------------------------------ cover */

function Cover({ docType, title, subtitle, details }) {
  const shown = (details || []).filter((d) => d && has(d.value));
  return (
    <section className="pd-page pd-cover">
      <div className="pd-cover__brand">
        <img className="pd-cover__mark" src={mark} alt="Rippotai" crossOrigin="anonymous" />
        <div className="pd-cover__word">RIPPOTAI</div>
        <div className="pd-cover__sub">Architecture</div>
      </div>
      <div className="pd-cover__titles">
        <span className="pd-cover__tick" />
        <h1 className="pd-cover__doc">{docType}</h1>
        {has(title) && <div className="pd-cover__project">{title}</div>}
        {has(subtitle) && <p className="pd-cover__subtitle">{subtitle}</p>}
      </div>
      {shown.length > 0 && (
        <dl className="pd-cover__meta">
          {shown.map((d) => (
            <div key={d.label}>
              <dt>{d.label}</dt>
              <dd>
                {d.value}
                {has(d.sub) && <small>{d.sub}</small>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="pd-cover__rule" />
    </section>
  );
}

/* ------------------------------------------------------------ document */

/**
 * props:
 *  docType       "Client Brief" — cover title + header label
 *  title         project name (cover, header)
 *  subtitle      optional one-liner on the cover
 *  coverDetails  [{ label, value, sub }] — bottom band of the cover (empties hidden).
 *                If omitted it is built from preparedFor / site / reference / date / version / preparedBy.
 *  preparedFor, preparedBy, site, reference, date (preformatted string), version
 *  sections      [{ title, intro?, rows?: {cols, template, items, label?}, blocks: [node | {table} | {text}], newPage? }]
 *  numbered      number section headings 01, 02… (default true)
 *  footerNote    replaces "Prepared for X" in the footer
 *  capturing     remove page shadows (downloadDocumentPdf also toggles this automatically)
 */
const PrintDocument = forwardRef(function PrintDocument(
  {
    docType = "Document",
    title,
    subtitle,
    coverDetails,
    preparedFor,
    preparedBy,
    site,
    reference,
    date,
    version,
    sections,
    numbered = true,
    footerNote,
    capturing,
    className,
  },
  ref,
) {
  const flat = useMemo(() => flatten(sections, numbered), [sections, numbered]);
  const measureRef = useRef(null);
  const [pages, setPages] = useState(null);
  const [tick, setTick] = useState(0);

  useLayoutEffect(() => {
    let alive = true;
    (document.fonts?.ready || Promise.resolve()).then(() => alive && setTick((t) => t + 1));
    return () => {
      alive = false;
    };
  }, []);

  const measure = useCallback(() => {
    if (!measureRef.current) return;
    const els = Array.from(measureRef.current.children);
    const full = [];
    const content = [];
    els.forEach((el) => {
      const h = el.getBoundingClientRect().height;
      const pad = parseFloat(getComputedStyle(el).paddingBottom) || 0;
      full.push(h);
      content.push(h - pad);
    });
    setPages(paginate(full, content, flat));
  }, [flat]);

  useLayoutEffect(() => {
    measure();
  }, [measure, tick]);

  const details =
    coverDetails ||
    [
      { label: "Prepared for", value: preparedFor },
      { label: "Project", value: title },
      { label: "Site", value: site },
      { label: "Reference", value: reference },
      { label: "Date", value: date },
      { label: "Version", value: has(version) ? `Version ${version}` : "" },
      { label: "Prepared by", value: preparedBy || "Rippotai Architecture" },
    ];

  const totalPages = (pages?.length || 0) + 1;
  const headMeta = [reference, date, has(version) ? `v${version}` : ""].filter(has).join(" · ");
  const footMid = footerNote || (has(preparedFor || title) ? `Prepared for ${preparedFor || title}` : "");
  const blockClass = (b) => `pd-block ${b.tight ? "pd-block--tight" : ""} ${b.sectionEnd ? "pd-block--end" : ""}`;

  return (
    <div ref={ref} className={`pd-doc ${capturing ? "is-capturing" : ""} ${className || ""}`}>
      <Cover docType={docType} title={title} subtitle={subtitle} details={details} />

      {(pages || []).map((idxs, p) => (
        <section key={p} className="pd-page pd-inner">
          <header className="pd-head">
            <div className="pd-head__brand">
              <img src={mark} alt="" crossOrigin="anonymous" />
              <span>
                {docType}
                {has(title) && (
                  <>
                    {" · "}
                    <b>{title}</b>
                  </>
                )}
              </span>
            </div>
            <div className="pd-head__meta">{headMeta}</div>
          </header>
          <div className="pd-body">
            {idxs.map((i, k) => {
              const b = flat[i];
              const cont = k === 0 && !b.sectionStart && b.isRow && !b.tableStart && b.contHead;
              return (
                <div key={b.key} className={blockClass(b)}>
                  {cont && (
                    <div>
                      <span className="pd-label" style={{ marginBottom: "2.5mm" }}>
                        {b.contTitle || b.sectionTitle} (continued)
                      </span>
                      {b.contHead}
                    </div>
                  )}
                  {b.node}
                </div>
              );
            })}
          </div>
          <footer className="pd-foot">
            <span>{["Rippotai Architecture", footMid, "Confidential"].filter(has).join(" · ")}</span>
            <span className="pd-foot__page">
              {p + 2} / {totalPages}
            </span>
          </footer>
        </section>
      ))}

      {/* off-screen measuring rig (same width as the page body) */}
      <div className="pd-measure" ref={measureRef} aria-hidden onLoadCapture={() => setTick((t) => t + 1)}>
        {flat.map((b) => (
          <div key={b.key} className={blockClass(b)}>
            {b.node}
          </div>
        ))}
      </div>
    </div>
  );
});

export default PrintDocument;
