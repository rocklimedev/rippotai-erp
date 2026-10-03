// Shared building blocks for commercial / procurement / inventory forms.
// Thin wrappers over the INOS primitives + commerce-forms.css (tokens only).
import React from "react";
import { Plus, Trash2, Loader2, AlertCircle, Info, CheckCircle2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/inos";
import { formatINR } from "@/lib/format";
import "./commerce-forms.css";

const cx = (...c) => c.filter(Boolean).join(" ");

/** ₹ with Indian grouping, 2 decimals. */
export const inr = (n, decimals = 2) => formatINR(Number.isFinite(Number(n)) ? Number(n) : 0, decimals);

/** Today as yyyy-mm-dd in local time (for date defaults). */
export const todayISO = () => {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Numbered form section with optional right-side actions, flush body (for tables) and footer. */
export function DocSection({ step, title, description, actions, children, flush, footer, className, id }) {
  return (
    <section id={id} className={cx("inos-form-section cf-section", flush && "cf-section--flush", className)}>
      {(title || actions) && (
        <div className="cf-section__head">
          <div className="inos-form-section__head">
            {step != null && <span className="inos-form-section__step">{step}</span>}
            <div>
              {title && <h2 className="inos-form-section__title">{title}</h2>}
              {description && <p className="inos-form-section__desc">{description}</p>}
            </div>
          </div>
          {actions && <div className="cf-section__actions">{actions}</div>}
        </div>
      )}
      {flush ? <div className="cf-section__body">{children}</div> : children}
      {footer && <div className="cf-section__footer">{footer}</div>}
    </section>
  );
}

/** Field grid: cols 2 (default) | 3 | 4 | 1 */
export function Grid({ cols = 2, children, className }) {
  const cls =
    cols === 4 ? "cf-grid-4" : cols === 3 ? "inos-form-grid inos-form-grid--3" : "inos-form-grid";
  return (
    <div className={cx(cls, className)} style={cols === 1 ? { gridTemplateColumns: "1fr" } : undefined}>
      {children}
    </div>
  );
}

/** Main column + sticky summary aside on wide screens. */
export function DocLayout({ aside, children }) {
  return (
    <div className={cx("cf-doc", aside && "cf-doc--aside")}>
      <div className="cf-doc__main">{children}</div>
      {aside && <aside className="cf-doc__aside">{aside}</aside>}
    </div>
  );
}

/** Editable line-item table shell. */
export function LineTable({ children, minWidth, className }) {
  return (
    <div className="inos-table-wrap cf-lines">
      <table className={cx("inos-table cf-table", className)} style={minWidth ? { minWidth } : undefined}>
        {children}
      </table>
    </div>
  );
}

export function IconAction({ icon: Icon = Trash2, label, danger, onClick, disabled }) {
  return (
    <button
      type="button"
      className={cx("cf-icon-btn", danger && "cf-icon-btn--danger")}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <Icon aria-hidden />
    </button>
  );
}

export const RemoveRow = ({ onClick, disabled, label = "Remove line" }) => (
  <IconAction icon={Trash2} danger label={label} onClick={onClick} disabled={disabled} />
);

export function AddRow({ onClick, children = "Add item", disabled }) {
  return (
    <Button variant="ghost" size="sm" icon={Plus} onClick={onClick} disabled={disabled} className="cf-add-row">
      {children}
    </Button>
  );
}

/** Input with a ₹ / % affix. */
export function Affix({ pre, post, children }) {
  return (
    <span className={cx("cf-affix", pre && "cf-affix--pre", post && "cf-affix--post")}>
      {pre && <span aria-hidden>{pre}</span>}
      {children}
      {post && <span aria-hidden>{post}</span>}
    </span>
  );
}

/** Running totals card. rows: [{label, value, control?}] */
export function TotalsCard({ title = "Summary", rows = [], totalLabel = "Total", total, meta, children, plain }) {
  return (
    <div className={cx("cf-totals", plain && "cf-totals--plain")}>
      {title && <h3 className="cf-totals__title">{title}</h3>}
      {rows.map((r, i) => (
        <div className="cf-totals__row" key={i}>
          <span>{r.label}</span>
          {r.control ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {r.control}
              {r.value != null && <span className="tabular" style={{ minWidth: 88, textAlign: "right" }}>{r.value}</span>}
            </span>
          ) : (
            <span>{r.value}</span>
          )}
        </div>
      ))}
      {total != null && (
        <div className="cf-totals__grand">
          <span>{totalLabel}</span>
          <strong>{total}</strong>
        </div>
      )}
      {meta && <div className="cf-totals__meta">{meta}</div>}
      {children}
    </div>
  );
}

const CALLOUT_ICON = { warn: AlertCircle, bad: AlertCircle, info: Info, ok: CheckCircle2, brand: Info, mute: Info };

export function Callout({ tone = "info", title, children, icon }) {
  const I = icon || CALLOUT_ICON[tone] || Info;
  return (
    <div className={cx("cf-callout", `cf-callout--${tone}`)} role={tone === "bad" || tone === "warn" ? "alert" : undefined}>
      <I aria-hidden />
      <div style={{ minWidth: 0 }}>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }) {
  return (
    <div className="cf-loading">
      <Loader2 aria-hidden />
      {label}
    </div>
  );
}

export function Check({ checked, onChange, children, disabled }) {
  return (
    <label className="cf-check">
      <input type="checkbox" checked={Boolean(checked)} onChange={onChange} disabled={disabled} />
      <span>{children}</span>
    </label>
  );
}

/** Compact key-value readout tiles. items: [{label, value}] */
export function Readout({ items }) {
  return (
    <dl className="cf-readout">
      {items.map((it, i) => (
        <div key={i}>
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "Before saving" checklist note for FormActions. */
export function pendingNote(list) {
  const missing = list.filter(Boolean);
  if (!missing.length) return null;
  return `To save: ${missing.join(" · ")}`;
}

/** Collapsible sub-block for secondary / auto-filled details. */
export function Disclosure({ title, icon: Icon, summary, defaultOpen, children }) {
  return (
    <details className="cf-block" open={defaultOpen || undefined}>
      <summary>
        <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span className="cf-block__title">
            {Icon && <Icon size={15} aria-hidden />}
            {title}
          </span>
          {summary && <span className="cf-summary-text">{summary}</span>}
        </span>
        <ChevronDown className="cf-chev" aria-hidden />
      </summary>
      <div className="cf-block__body">{children}</div>
    </details>
  );
}

/** Simple modal: single section, footer = ghost Cancel + primary. */
export function Modal({ title, subtitle, onClose, children, footer, size, testId, closeTestId }) {
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="cf-modal-overlay" onClick={onClose}>
      <div
        className={cx("cf-modal", size === "lg" && "cf-modal--lg")}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        data-testid={testId}
      >
        <div className="cf-modal__head">
          <div>
            <h2 className="cf-modal__title">{title}</h2>
            {subtitle && <p className="cf-modal__sub">{subtitle}</p>}
          </div>
          {onClose && (
            <button type="button" className="cf-icon-btn" onClick={onClose} aria-label="Close" title="Close" data-testid={closeTestId}>
              <X aria-hidden />
            </button>
          )}
        </div>
        <div className="cf-modal__body">{children}</div>
        {footer && <div className="cf-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
