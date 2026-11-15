// INOS UI primitives — thin React wrappers over styles/inos-theme.css.
// Use these for every new or redesigned screen so spacing, type and colour stay consistent.
import { useHeaderPresence, usePageTitle, usePageTitleState } from "@/components/shell/page-title";
import { buildCrumbs, parentOf } from "@/components/shell/breadcrumbs";
import React, { forwardRef, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronRight, Inbox } from "lucide-react";
import { SectionStatus } from "@/components/doc-list/SectionTick";
import { useSectionCompleteness } from "@/components/doc-list/useSectionCompleteness";

const cx = (...c) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------ layout */

export function Page({ children, width, className }) {
  return (
    <div className={cx("inos-page", width === "narrow" && "inos-page--narrow", width === "form" && "inos-page--form", className)}>
      {children}
    </div>
  );
}

// Decorative subtitles (sentences) are not shown; short facts are kept as the info line.
const isInfoLike = (s) => s != null && s !== false && (typeof s !== "string" || (s.trim().length <= 90 && !/[.!?]$/.test(s.trim())));

/**
 * Every page opens with this: breadcrumb (Home › App › Section › Item › … ›
 * Current, built automatically from the sidebar), a bold title, ONE info line
 * and one primary action on the right (secondary actions small / outline).
 *
 * title    – page or record name (string preferred; it also becomes the tab title)
 * info     – one line of facts, e.g. "BOQ-024 · Project: Nagpal Residence · v3 · Updated 14 Nov 2026"
 * crumbs   – optional extra links between the sidebar item and the title,
 *            e.g. [{ label: "PRJ-001 · Nagpal Residence", to: "/projects/…" }]
 * trail    – false: only "Home › Title" (app-independent pages)
 * actions  – the page's primary action (+ small secondary ones)
 */
export function PageHeader({ crumbs, trail = true, eyebrow, title, info, subtitle, actions, icon, auto = false }) {
  const ctx = usePageTitleState();
  const nav = useNavigate();
  const line = info ?? (isInfoLike(subtitle) ? subtitle : null);
  const titleText = typeof title === "string" ? title : null;
  usePageTitle(auto ? null : titleText, typeof line === "string" ? line : null);
  useHeaderPresence(!auto);
  const list = ctx
    ? buildCrumbs({ app: ctx.app, active: ctx.active, activeExact: ctx.activeExact, title: titleText, crumbs, trail })
    : crumbs?.length
      ? crumbs.map((c, i) => (i === crumbs.length - 1 ? { label: c.label, current: true } : c))
      : null;
  const back = () => {
    if ((window.history.state?.idx ?? 0) > 0) nav(-1);
    else nav(list ? parentOf(list) : "/dashboard");
  };
  return (
    <div className="inos-page-header" data-testid={auto ? "auto-page-header" : "page-header"}>
      <div className="inos-page-header__text">
        {list?.length ? (
          <nav className="inos-crumbs" aria-label="Breadcrumb">
            <ol>
              {list.map((c, i) => (
                <li key={i}>
                  {i > 0 && <ChevronRight size={12} aria-hidden />}
                  {c.current ? (
                    <span aria-current="page">{c.label}</span>
                  ) : c.to ? (
                    <Link to={c.to}>{c.label}</Link>
                  ) : (
                    <span className="inos-crumbs__text">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : eyebrow ? (
          <div className="inos-eyebrow">{eyebrow}</div>
        ) : null}
        <div className="inos-page-header__title-row">
          {ctx && (
            <button type="button" className="inos-page-header__back" onClick={back} aria-label="Back" title="Back">
              <ArrowLeft size={18} aria-hidden />
            </button>
          )}
          {icon && <span className="inos-icon-tile inos-icon-tile--lg">{icon}</span>}
          <h1 className="inos-title">{title}</h1>
        </div>
        {line && <p className="inos-page-header__info">{line}</p>}
      </div>
      {actions && <div className="inos-page-header__actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, actions, children, flush, inset, flat, className, footer, headerPlain, onClick, ...rest }) {
  return (
    <section
      className={cx("inos-card", inset && "inos-card--inset", flat && "inos-card--flat", onClick && "inos-card--interactive", className)}
      onClick={onClick}
      {...rest}
    >
      {(title || actions) && (
        <div className={cx("inos-card__header", headerPlain && "inos-card__header--plain")}>
          <div style={{ minWidth: 0 }}>
            {title && <h2 className="inos-section-title">{title}</h2>}
            {subtitle && <p className="inos-section-sub">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      <div className={cx("inos-card__body", flush && "inos-card__body--flush")}>{children}</div>
      {footer && <div className="inos-card__footer">{footer}</div>}
    </section>
  );
}

/* ------------------------------------------------------------ actions */

export const Button = forwardRef(function Button(
  { variant = "secondary", size, icon: Icon, iconRight: IconRight, children, className, type = "button", loading, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "inos-btn",
        `inos-btn--${variant}`,
        size && `inos-btn--${size}`,
        !children && Icon && "inos-btn--icon",
        className,
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {Icon && <Icon aria-hidden />}
      {children && <span>{loading ? "Working…" : children}</span>}
      {IconRight && <IconRight aria-hidden />}
    </button>
  );
});

/* ------------------------------------------------------------ status */

const TONE_BY_STATUS = {
  active: "ok", approved: "ok", completed: "ok", done: "ok", cleared: "ok", verified: "ok", paid: "ok", accepted: "ok", passed: "ok", open: "info",
  pending: "warn", pending_approval: "warn", awaiting: "warn", awaiting_approval: "warn", draft: "mute", in_progress: "info", "in progress": "info", on_hold: "peach", "on hold": "peach", review: "lilac", submitted: "lilac",
  rejected: "bad", failed: "bad", blocked: "bad", overdue: "bad", cancelled: "mute", canceled: "mute", archived: "mute", inactive: "mute", closed: "mute", expired: "bad", stalled: "peach", at_risk: "peach",
};

export function toneFor(status) {
  if (!status) return "mute";
  const k = String(status).toLowerCase().trim();
  return TONE_BY_STATUS[k] || TONE_BY_STATUS[k.replace(/\s+/g, "_")] || "mute";
}

export const prettyStatus = (s) =>
  String(s ?? "—")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

/** tone: ok | warn | bad | info | lilac | peach | brand | mute */
export function Pill({ tone = "mute", dot = true, size, children, title }) {
  return (
    <span className={cx("inos-pill", tone !== "mute" && `inos-pill--${tone}`, size === "sm" && "inos-pill--sm")} title={title}>
      {dot && <span className="inos-pill__dot" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusPill({ status, size }) {
  return (
    <Pill tone={toneFor(status)} size={size}>
      {prettyStatus(status)}
    </Pill>
  );
}

/* ------------------------------------------------------------ data */

export function StatTile({ label, value, meta, icon, tone, active, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={cx("inos-stat", active && "inos-stat--active")} onClick={onClick}>
      <div className="inos-stat__top">
        <span className="inos-stat__label">{label}</span>
        {icon && <span className={cx("inos-icon-tile inos-icon-tile--sm", tone && `inos-icon-tile--${tone}`)}>{icon}</span>}
      </div>
      <div className="inos-stat__value">{value ?? "—"}</div>
      {meta && <div className="inos-stat__meta">{meta}</div>}
    </Tag>
  );
}

export function Stats({ children }) {
  return <div className="inos-stats">{children}</div>;
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="inos-empty">
      <span className="inos-icon-tile inos-icon-tile--lg">
        <Icon aria-hidden />
      </span>
      {title && <p className="inos-empty__title">{title}</p>}
      {text && <p className="inos-empty__text">{text}</p>}
      {action}
    </div>
  );
}

export function Avatar({ name = "", src, size = 32 }) {
  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return src ? (
    <img src={src} alt="" className="inos-avatar" style={{ width: size, height: size, objectFit: "cover" }} />
  ) : (
    <span className="inos-avatar" style={{ width: size, height: size }} aria-hidden>
      {initials || "?"}
    </span>
  );
}

export function Progress({ value = 0, tone }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const bg = tone ? `var(--${tone}-dot)` : undefined;
  return (
    <div className="inos-progress" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${v}%`, background: bg }} />
    </div>
  );
}

/* ------------------------------------------------------------ toolbars */

export function Toolbar({ children }) {
  return <div className="inos-toolbar">{children}</div>;
}
export const ToolbarSpacer = () => <div className="inos-toolbar__spacer" />;

export function SearchInput({ value, onChange, placeholder = "Search…", id }) {
  return (
    <label className="inos-search">
      <Search aria-hidden />
      <input
        id={id}
        className="inos-input"
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

/** options: [{value, label, icon?, count?}] */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="inos-segmented" role="tablist">
      {options.map((o) => {
        const I = o.icon;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
            {I && <I aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="inos-tabs" role="tablist">
      {options.map((o) => {
        const I = o.icon;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
            {I && <I aria-hidden />}
            {o.label}
            {o.count != null && <span className="inos-count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ forms */

export function FormSection({ step, title, description, children, columns = 2, tick = true }) {
  const ref = React.useRef(null);
  const fill = useSectionCompleteness(ref, tick);
  return (
    <section className="inos-form-section" ref={ref} data-fill={tick ? fill : undefined}>
      {(title || description) && (
        <div className="inos-form-section__head">
          <SectionStatus state={fill} step={step} enabled={tick} />
          <div>
            {title && <h2 className="inos-form-section__title">{title}</h2>}
            {description && <p className="inos-form-section__desc">{description}</p>}
          </div>
        </div>
      )}
      <div className={cx("inos-form-grid", columns === 3 && "inos-form-grid--3")} style={columns === 1 ? { gridTemplateColumns: "1fr" } : undefined}>
        {children}
      </div>
    </section>
  );
}

/** Wraps any control with label / hint / error. Pass `full` to span both columns. */
export function Field({ label, required, optional, hint, error, children, full, htmlFor }) {
  return (
    <div className={cx("inos-field", full && "span-full")}>
      {label && (
        <label className="inos-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="req" aria-hidden>*</span>}
          {optional && <span className="opt">(optional)</span>}
        </label>
      )}
      {children}
      {error ? <span className="inos-error">{error}</span> : hint ? <span className="inos-hint">{hint}</span> : null}
    </div>
  );
}

export const TextInput = forwardRef(function TextInput({ className, invalid, ...p }, ref) {
  return <input ref={ref} className={cx("inos-input", className)} aria-invalid={invalid || undefined} {...p} />;
});
export const SelectInput = forwardRef(function SelectInput({ className, invalid, children, placeholder, ...p }, ref) {
  return (
    <select ref={ref} className={cx("inos-select", className)} aria-invalid={invalid || undefined} {...p}>
      {placeholder != null && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
});
export const TextArea = forwardRef(function TextArea({ className, invalid, ...p }, ref) {
  return <textarea ref={ref} className={cx("inos-textarea", className)} aria-invalid={invalid || undefined} {...p} />;
});

/** Big tap targets for small option sets (priority, type, status). options: [{value,label,icon?}] */
export function ChoiceGroup({ value, onChange, options, name }) {
  const gid = useId();
  return (
    <div className="inos-choices" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const I = o.icon;
        return (
          <button
            key={o.value}
            id={`${gid}-${o.value}`}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className="inos-choice"
            onClick={() => onChange(o.value)}
          >
            {I && <I size={16} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Sticky bar at the bottom of a form: note on the left, Cancel + primary on the right. */
export function FormActions({ note, onCancel, cancelLabel = "Cancel", submitLabel = "Save", submitting, submitDisabled, extra, onSubmit }) {
  return (
    <div className="inos-form-actions">
      {note && <span className="inos-form-actions__note">{note}</span>}
      <div className="inos-form-actions__buttons">
        {extra}
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button variant="primary" type={onSubmit ? "button" : "submit"} onClick={onSubmit} loading={submitting} disabled={submitDisabled}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ folder card */

const FOLDER_TONES = ["brand", "ok", "info", "lilac", "peach", "warn"];
export const folderToneFor = (key = "") => {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FOLDER_TONES[h % FOLDER_TONES.length];
};

export function FolderCard({ title, subtitle, tone, meta, badge, footer, onClick, children }) {
  return (
    <button type="button" className={cx("inos-folder", tone && `inos-folder--${tone}`)} onClick={onClick}>
      <div className="inos-folder__art" aria-hidden>
        <span className="inos-folder__sheet" />
        <span className="inos-folder__sheet" />
        <span className="inos-folder__sheet" />
        {badge && <span style={{ position: "absolute", top: 12, right: 12 }}>{badge}</span>}
      </div>
      <div className="inos-folder__pocket">
        <span className="inos-folder__tab" aria-hidden>
          <svg viewBox="0 0 200 18" preserveAspectRatio="none">
            <path d="M0 18 V8 Q0 0 10 0 H150 Q160 0 168 8 L178 18 Z" fill="currentColor" />
          </svg>
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="inos-folder__title">{title}</p>
          {subtitle && <p className="inos-folder__sub">{subtitle}</p>}
        </div>
        {children}
        {(meta || footer) && <div className="inos-folder__foot">{meta}{footer}</div>}
      </div>
    </button>
  );
}
