// Word template family — the user's original .docx forms (CLIENT BRIEF, SITE RECCE FORMAT,
// SCOPE OF WORK, PLAN OF ACTION, SPECIFICATION & BUDGET GUIDE, PAYMENT SCHEDULE, CLIENT
// CONSENT FORM). Values below come from those files' document.xml:
//   A4, margins 22.9 (top) / 19.4 (sides) / 21.2 mm (bottom), Lato Light throughout,
//   gold #D9B061, green #0D3D2F, sage label #7E9A92, field rules #D9D9D6 (0.5 pt),
//   section rule black 1 pt, sub-heading rule gold 0.75 pt.
// Use with <PrintDocument variant="word" wordCover={…} sections={…} />.
import React from 'react';
import './word.css';
import coverLogo from '../../assets/brand/word/rippotai-cover-logo.png';
import coverCube from '../../assets/brand/word/rippotai-cover-cube.png';
import { has } from './format';
import { checkedLabels } from './word-helpers';

const cx = (...c) => c.filter(Boolean).join(' ');
const shown = (v) => (has(v) || React.isValidElement(v) ? v : null);

/* ------------------------------------------------------------ cover */

/**
 * rows: [[{label, value, wide?, gold?}]] (see coverRows) · title: "CLIENT BRIEF"
 * logo: "full" (cube + RIPPŌTAI) | "cube" · logoWidth / logoTop (mm) · titleClass: extra class
 * subtitle: small line under the title · children: extra cover content (rendered after title)
 * after: content placed on the page itself (absolutely positioned by the caller)
 */
export function WordCover({
  title,
  rows,
  omitEmpty = false,
  logo = 'full',
  logoWidth = 39.7,
  logoTop = 61.7,
  titleClass,
  subtitle,
  rowsTop = 205,
  footerLabel,
  children,
  after,
  className,
  beforeTitle,
}) {
  const fields = omitEmpty
    ? (rows || []).map((row) => row.filter((field) => has(field.value))).filter((row) => row.length)
    : rows;
  return (
    <section className={cx('pd-page wd-cover', className)}>
      <div className="wd-cover__brand" style={{ paddingTop: `${logoTop - 22.9}mm` }}>
        <img
          src={logo === 'cube' ? coverCube : coverLogo}
          alt="Rippotai"
          style={{ width: `${logoWidth}mm` }}
        />
        {beforeTitle}
        {has(title) && <h1 className={cx('wd-cover__title', titleClass)}>{title}</h1>}
        {has(subtitle) && <p className="wd-cover__subtitle">{subtitle}</p>}
        {children}
      </div>
      {fields?.length > 0 && (
        <div className="wd-cover__rows" style={{ top: `${rowsTop}mm` }}>
          {fields.map((row, i) => (
            <div
              key={i}
              className={cx(
                'wd-cover__row',
                row.length === 1 && row[0].wide && 'wd-cover__row--wide',
              )}
            >
              {row.map((f) => (
                <div key={f.label} className="wd-cover__field">
                  <span className="wd-cover__label">{f.label}</span>
                  <span className={cx('wd-cover__value', f.gold && 'wd-cover__value--gold')}>
                    {shown(f.value)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {after}
      {has(footerLabel) && <footer className="wd-foot">{footerLabel}</footer>}
    </section>
  );
}

/* ------------------------------------------------------------ headings & text */

/** Spaced capitals sub-heading over a gold rule ("PROJECT TYPE & SITE TYPE"). */
export function WSub({ children, size, tail, rule = 'gold', style, className }) {
  return (
    <div
      className={cx('wd-sub', rule === 'none' && 'wd-sub--plain', className)}
      style={{ ...(size ? { fontSize: `${size}pt` } : null), ...style }}
    >
      {children}
      {tail && <span className="wd-sub__tail">{tail}</span>}
    </div>
  );
}

/** Small sage note under a heading ("Everyone who will use the space…"). */
export const WIntro = ({ children, style }) =>
  children ? (
    <p className="wd-intro" style={style}>
      {children}
    </p>
  ) : null;

/** Filled-in text, as typed into a template blank. */
export const WValue = ({ children, className, style }) =>
  shown(children) ? (
    <div className={cx('wd-value', className)} style={style}>
      {children}
    </div>
  ) : null;

/* ------------------------------------------------------------ fields */

/** One label + filled value + grey rule. */
export function WField({ label, value, labelSize, className, style }) {
  return (
    <div className={cx('wd-field', className)} style={style}>
      <span
        className="wd-field__label"
        style={labelSize ? { fontSize: `${labelSize}pt` } : undefined}
      >
        {label}
      </span>
      <div className="wd-field__value">{shown(value)}</div>
    </div>
  );
}

/**
 * Two (or n) column grid of fields; empties keep their blank line like the template.
 * items: [{ label, value, span? }]
 */
export function WFields({ items, cols = 2, labelSize, gap, style, omitEmpty = false }) {
  const list = (items || []).filter((field) => field && (!omitEmpty || has(field.value)));
  if (omitEmpty && !list.length) return null;
  return (
    <div
      className="wd-fields"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        ...(gap != null ? { rowGap: `${gap}mm` } : null),
        ...style,
      }}
    >
      {list.map((f, i) => (
        <WField
          key={`${f.label}-${i}`}
          label={f.label}
          value={f.value}
          labelSize={f.labelSize || labelSize}
          style={f.span ? { gridColumn: `span ${f.span}` } : undefined}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ tick boxes */

/** The template's ☐ box; ticked when `checked`. Plain CSS borders (html2canvas-safe). */
export function Box({ checked }) {
  return (
    <span className="wd-box" aria-hidden="true">
      {checked && <span className="wd-box__tick" />}
    </span>
  );
}

/**
 * ☐ Label. other: true renders "Other ______" (filled with `value` when given).
 * indent: nested option (Hotel under Hospitality).
 */
export function WCheck({ label, checked, other, value, indent, gap, style }) {
  return (
    <div className={cx('wd-check', indent && 'wd-check--indent')} style={style}>
      <Box checked={checked} />
      <span
        className="wd-check__label"
        style={gap != null ? { marginLeft: `${gap}mm` } : undefined}
      >
        {label}
        {other && (
          <span className={cx('wd-blank', has(value) && 'wd-blank--filled')}>
            {has(value) ? value : ''}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * The answer to an option question in a filled document: only the chosen
 * option(s), written on the template's ruled line. The full ☐ option list
 * belongs to the input form, not to the submitted document.
 * value: string | string[] (one per line)
 */
export function WAnswer({ value, style, className }) {
  const text = Array.isArray(value) ? value.filter(has).join('\n') : value;
  return (
    <div className={cx('wd-answer', className)} style={style}>
      <div className="wd-field__value">{shown(text)}</div>
    </div>
  );
}

/**
 * Options laid out row by row in `cols` equal columns (Word tables of ☐ cells).
 * A filled document shows only the chosen option(s) (WAnswer); pass
 * `answer={false}` to print the full ☐ list (blank template).
 */
export function WChecks({ items, cols = 3, widths, gap, style, className, answer = true }) {
  const list = (items || []).filter(Boolean);
  if (answer) {
    return (
      <WAnswer
        className={className}
        value={checkedLabels(list).join(', ')}
        style={{ marginBottom: style?.marginBottom ?? '8mm' }}
      />
    );
  }
  return (
    <div
      className={cx('wd-checks', className)}
      style={{
        gridTemplateColumns: widths || `repeat(${cols}, 1fr)`,
        ...style,
      }}
    >
      {list.map((it, i) =>
        it.empty ? <span key={i} /> : <WCheck key={`${it.label}-${i}`} gap={gap} {...it} />,
      )}
    </div>
  );
}

/**
 * Options in columns, each with an optional heading (plain text or a ☐ heading).
 * columns: [{ heading, headingBox?, headingChecked?, items:[{label, checked, indent, other, value}] }]
 * foot: [{…check}] — a last row aligned to the columns (e.g. "Other ____" under column 3)
 */
export function WCheckColumns({ columns, widths, gap, itemGap, style, foot }) {
  const tmpl = widths || `repeat(${columns.length}, 1fr)`;
  return (
    <div style={style}>
      <div className="wd-checkcols" style={{ gridTemplateColumns: tmpl }}>
        {columns.map((c, i) => (
          <div key={i} className="wd-checkcol">
            {c.heading &&
              (c.headingBox ? (
                <WCheck label={c.heading} checked={c.headingChecked} gap={gap} />
              ) : (
                <div className="wd-checkcol__head">{c.heading}</div>
              ))}
            {(c.items || []).map((it, k) => (
              <WCheck key={`${it.label}-${k}`} gap={itemGap ?? gap} {...it} />
            ))}
          </div>
        ))}
      </div>
      {foot && (
        <div className="wd-checkcols wd-checkcols--foot" style={{ gridTemplateColumns: tmpl }}>
          {foot.map((it, i) => (it ? <WCheck key={i} gap={gap} {...it} /> : <span key={i} />))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ ruled areas */

/**
 * n ruled lines; text (if any) is written on them. Lines are real borders (html2canvas does not
 * paint repeating gradients); extra lines are added when the text needs them.
 */
export function WLines({ value, count = 6, lineHeight = 7.7, charsPerLine = 105, style }) {
  const text = typeof value === 'string' ? value : '';
  const needed = text
    ? text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / charsPerLine)), 0)
    : 0;
  const lines = Math.max(count, needed);
  return (
    <div
      className="wd-lines"
      style={{
        '--wd-line': `${lineHeight}mm`,
        minHeight: `${lines * lineHeight}mm`,
        ...style,
      }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="wd-lines__rule" style={{ top: `${(i + 1) * lineHeight}mm` }} />
      ))}
      <div className="wd-lines__text">{shown(value)}</div>
    </div>
  );
}

/**
 * Two-column ruled table: label | value (Scope boundaries, Preferences, Site risks).
 * rows: [{ label, value, minHeight? }] · labelWidth: first column · labelClass: "green" | "small"
 */
export function WLabelTable({
  rows,
  labelWidth = '57mm',
  minHeight = 6,
  labelTone,
  top = true,
  style,
  omitEmpty = false,
}) {
  const list = (rows || []).filter((row) => row && (!omitEmpty || has(row.value)));
  if (omitEmpty && !list.length) return null;
  return (
    <div
      className={cx('wd-ltable', top && 'wd-ltable--top')}
      style={{ gridTemplateColumns: `${labelWidth} 1fr`, ...style }}
    >
      {list.map((r, i) => (
        <React.Fragment key={`${r.label}-${i}`}>
          <div
            className={cx('wd-ltable__label', labelTone && `wd-ltable__label--${labelTone}`)}
            style={{ minHeight: `${r.minHeight ?? minHeight}mm` }}
          >
            {r.label}
          </div>
          <div className="wd-ltable__value">{shown(r.value)}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Signature column: spaced caps label, signature rule, then "Name - …" / "Date - …" lines. */
export function WSign({ label, lines, ruleTone = 'dark', style }) {
  return (
    <div className="wd-sign" style={style}>
      {label && <div className="wd-sign__label">{label}</div>}
      <div className={cx('wd-sign__rule', `wd-sign__rule--${ruleTone}`)} />
      {(lines || []).map((l, i) => (
        <div key={i} className="wd-sign__line">
          {typeof l === 'string' ? (
            l
          ) : (
            <>
              {l.label}
              <span className="wd-sign__fill">{shown(l.value)}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
