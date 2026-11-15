// Presentational building blocks for printable documents. All render inside <PrintDocument>.
import React from "react";
import { has, inr, money } from "./format";

const cx = (...c) => c.filter(Boolean).join(" ");

/** Selected values as plain comma-separated text (no pills, no tick boxes). */
export function Pills({ items }) {
  const list = (items || []).filter(has);
  if (!list.length) return null;
  return (
    <div className="pd-list">{[...new Set(list.map(String))].join(", ")}</div>
  );
}

/**
 * Key / value grid. items: [{ label, value, strong?, wide?, sub? }]
 * Empty values are hidden; array values render as pills. cols: 2 | 3.
 */
export function KV({ items, cols = 2 }) {
  const shown = (items || []).filter(
    (i) => i && (React.isValidElement(i.value) || has(i.value)),
  );
  if (!shown.length) return null;
  return (
    <div
      className={cx(
        "pd-kv",
        cols === 3 && "pd-kv--3",
        cols === 1 && "pd-kv--1",
      )}
    >
      {shown.map((i) => (
        <div
          key={i.label}
          className={cx("pd-kv__item", i.wide && "pd-kv__item--wide")}
        >
          <span className="pd-label">{i.label}</span>
          {Array.isArray(i.value) ? (
            <Pills items={i.value} />
          ) : (
            <div className={cx("pd-value", i.strong && "pd-value--strong")}>
              {i.value}
              {has(i.sub) && <span className="pd-value__sub">{i.sub}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
/** true when a KV items array has anything to show. */
export const kvHas = (items) =>
  (items || []).some(
    (i) => i && (React.isValidElement(i.value) || has(i.value)),
  );

/** Labelled paragraph text (keeps line breaks). */
export const TextItem = ({ label, value }) =>
  has(value) ? (
    <div>
      {label && <span className="pd-label">{label}</span>}
      <p className="pd-text">{value}</p>
    </div>
  ) : null;

/** Column header row for a table. Columns starting with "#" are right-aligned (numbers). */
export function RowsHead({ cols, template, skin, className }) {
  return (
    <div
      className={cx(skin === "word" ? "wd-thead" : "pd-rows__head", className)}
      style={{ gridTemplateColumns: template }}
    >
      {cols.map((c, i) => (
        <span
          key={i}
          style={String(c).startsWith("#") ? { textAlign: "right" } : undefined}
        >
          {String(c).replace(/^#/, "")}
        </span>
      ))}
    </div>
  );
}

/**
 * One table row. cells: array of string | number | node | { text, sub, strong }.
 * The first column is bold by default; "#"-columns are right-aligned tabular numbers.
 */
export function Row({
  cols,
  template,
  cells,
  variant,
  last,
  skin,
  className,
}) {
  const word = skin === "word";
  return (
    <div
      className={cx(
        word ? "wd-row" : "pd-row",
        className,
        variant && `pd-row--${variant}`,
        last && "pd-row--last",
      )}
      style={{ gridTemplateColumns: template }}
    >
      {cells.map((c, i) => {
        const numeric = String(cols?.[i] || "").startsWith("#");
        const obj =
          c &&
          typeof c === "object" &&
          !React.isValidElement(c) &&
          !Array.isArray(c)
            ? c
            : null;
        const text = obj ? obj.text : c;
        const strong = obj?.strong ?? (!word && i === 0);
        return (
          <span
            key={i}
            className={cx(
              strong && (word ? "wd-row__strong" : "pd-row__title"),
              numeric && "pd-row__num",
              obj?.className,
            )}
          >
            {text}
            {obj && has(obj.sub) && (
              <span className={word ? "wd-row__sub" : "pd-row__sub"}>
                {obj.sub}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** A whole (unpaginated) table — use inside a block when you know it's short. */
export function Rows({ cols, template, items }) {
  return (
    <div>
      <RowsHead cols={cols} template={template} />
      {items.map((it, i) => (
        <Row
          key={it?.key ?? i}
          cols={cols}
          template={template}
          cells={Array.isArray(it) ? it : it.cells}
          variant={it?.variant}
          last={i === items.length - 1}
        />
      ))}
    </div>
  );
}

/** Big highlighted amount / number. value: number (₹) or string. */
export function Figure({ label, value, exact, note }) {
  let big = value;
  let small = exact;
  if (
    typeof value === "number" ||
    (typeof value === "string" && /^\d+(\.\d+)?$/.test(value))
  ) {
    const m = inr(value, { allowZero: true });
    if (!m) return null;
    big = m.short;
    small = exact ?? (m.short !== m.exact ? m.exact : null);
  }
  if (!has(big)) return null;
  return (
    <div>
      {label && <span className="pd-label">{label}</span>}
      <div className="pd-figure">
        <span className="pd-figure__value">{big}</span>
        {has(small) && <span className="pd-figure__exact">{small}</span>}
      </div>
      {note && (
        <p className="pd-note" style={{ marginTop: "3mm" }}>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * Totals block for commercial documents, right-aligned under a table.
 * lines: [{ label, value (number → ₹), strong?, muted? }]; the last `grand` line is emphasised.
 * Shorthand: <Totals subtotal={..} gst={..} gstLabel="GST @ 18%" discount={..} total={..} words="..." />
 */
export function Totals({
  lines,
  subtotal,
  discount,
  gst,
  gstLabel = "GST",
  total,
  words,
  decimals = 0,
}) {
  const rows = lines
    ? lines
    : [
        has(subtotal) && { label: "Subtotal", value: subtotal },
        Number(discount) > 0 && {
          label: "Discount",
          value: -Math.abs(Number(discount)),
        },
        has(gst) && Number(gst) !== 0 && { label: gstLabel, value: gst },
        has(total) && { label: "Grand total", value: total, grand: true },
      ].filter(Boolean);
  const fmt = (v) => {
    if (typeof v !== "number" && !/^-?\d+(\.\d+)?$/.test(String(v))) return v;
    const n = Number(v);
    return (n < 0 ? "− " : "") + money(Math.abs(n), decimals);
  };
  if (!rows.length) return null;
  return (
    <div className="pd-totals">
      {rows.map((r, i) => (
        <div
          key={i}
          className={cx(
            "pd-totals__line",
            r.grand && "pd-totals__line--grand",
            r.muted && "pd-totals__line--muted",
          )}
        >
          <span>{r.label}</span>
          <span className="pd-totals__val">{fmt(r.value)}</span>
        </div>
      ))}
      {has(words) && <div className="pd-totals__words">{words}</div>}
    </div>
  );
}

/** Muted side-ruled note. */
export const Note = ({ children, style }) =>
  children ? (
    <p className="pd-note" style={style}>
      {children}
    </p>
  ) : null;

/** Small uppercase sub-heading inside a section. */
export const SubHead = ({ children }) => (
  <div className="pd-subhead">{children}</div>
);

/**
 * Two signature lines. left / right: { name, role, date }.
 */
export function SignOff({ left, right, note, before }) {
  const side = (s) => (
    <div>
      <div className="pd-sign__line" />
      <div className="pd-sign__who">{s?.name || " "}</div>
      <div className="pd-sign__role">
        {[s?.role, s?.date].filter(has).join(" · ")}
      </div>
    </div>
  );
  return (
    <div>
      {before}
      {note && (
        <p className="pd-note" style={{ marginBottom: "4mm" }}>
          {note}
        </p>
      )}
      <div className="pd-sign">
        {side(
          left || {
            name: "Rippotai Architecture",
            role: "Authorised signatory",
          },
        )}
        {side(right || { name: "Client", role: "Client · Date" })}
      </div>
    </div>
  );
}

/** Numbered list of terms / conditions. */
export function Terms({ items }) {
  const list = (items || []).filter(has);
  if (!list.length) return null;
  return (
    <ol className="pd-terms">
      {list.map((t, i) => (
        <li key={i}>
          <span className="pd-terms__n">{i + 1}.</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  );
}

/** Row of big numbers. items: [{ value, label }] (empties hidden). */
export function Stats({ items }) {
  const list = (items || []).filter((i) => i && has(i.value));
  if (!list.length) return null;
  return (
    <div
      className="pd-stats"
      style={{
        gridTemplateColumns: `repeat(${Math.min(Math.max(list.length, 2), 4)}, 1fr)`,
      }}
    >
      {list.map((i) => (
        <div key={i.label}>
          <div className="pd-stat__value">{i.value}</div>
          {i.label && <div className="pd-stat__label">{i.label}</div>}
        </div>
      ))}
    </div>
  );
}

/**
 * Terms from stored HTML / text. Accepts <ol><li>, <h3>+<p> pairs, <p> paragraphs or plain text lines.
 * Renders a numbered list; h3 titles are bold lead-ins.
 */
export function HtmlTerms({ html, items: suppliedItems, start = 1 }) {
  const items = suppliedItems ?? htmlToTerms(html);
  if (!items.length) return null;
  return (
    <ol className="pd-terms" start={start}>
      {items.map((t, i) => (
        <li key={i}>
          <span className="pd-terms__n">{start + i}.</span>
          <span>
            {t.title && (
              <b style={{ color: "var(--pd-ink)", fontWeight: 700 }}>
                {t.title}
                {t.body ? ". " : ""}
              </b>
            )}
            {t.body}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function htmlToTerms(html) {
  if (!has(html)) return [];
  const src = String(html);
  if (!/<[a-z][\s\S]*>/i.test(src))
    return src
      .split(/\n+/)
      .map((l) => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim())
      .filter(Boolean)
      .map((body) => ({ body }));
  try {
    const doc = new DOMParser().parseFromString(src, "text/html");
    const items = [];
    let cur = null;
    const walk = (nodes) =>
      nodes.forEach((node) => {
        const tag = node.tagName?.toLowerCase();
        const text = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (!tag || tag === "h1" || tag === "h2") return;
        if (tag === "ol" || tag === "ul" || tag === "div" || tag === "section")
          return walk(Array.from(node.children));
        if (!text) return;
        if (tag === "h3" || tag === "h4" || tag === "h5") {
          cur = { title: text.replace(/^\d+[.)]\s*/, ""), body: "" };
          items.push(cur);
        } else if (tag === "li") {
          cur = null;
          items.push({ body: text });
        } else if (cur) {
          cur.body = [cur.body, text].filter(Boolean).join(" ");
        } else items.push({ body: text.replace(/^\d+[.)]\s*/, "") });
      });
    walk(Array.from(doc.body.children));
    return items;
  } catch {
    return [];
  }
}

/**
 * Inline status / flag after a title, printed as plain bold text (" · Paid"). Brand rule: no
 * colour-coded pills in documents — `tone` is accepted for compatibility and ignored.
 */
export const Pill = ({ children }) =>
  has(children) ? <span className="pd-pill"> · {children}</span> : null;
