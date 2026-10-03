// Shared building blocks for the CRM document forms (brief, recce, plan of
// action, scope of work, proposal). Thin layer over components/inos so long
// forms get a section navigator, row cards, chips and an autosave note.
import React, { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Info, AlertTriangle, AlertCircle, Plus, Trash2, Inbox } from "lucide-react";
import { Page, PageHeader, Progress, EmptyState, SelectInput, Field, Button } from "@/components/inos";
import "./crm-forms.css";

const cx = (...c) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------ helpers */

export const isFilled = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "boolean") return true;
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "object") return Object.values(v).some(isFilled);
  return Boolean(v);
};

export const slugId = (s, i) =>
  `sec-${String(s ?? i)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || i}`;

export function relativeTime(date) {
  if (!date) return "";
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} h ago`;
}

/** Tracks when `values` last changed (debounced like useAutoSave) → "Autosaved 2 min ago". */
export function useAutosaveNote(values, { enabled = true, label = "Draft autosaved on this device" } = {}) {
  const [savedAt, setSavedAt] = useState(null);
  const [, tick] = useState(0);
  // Compare against the first snapshot (StrictMode runs effects twice, so a
  // "first run" flag would report a save that never happened).
  const snapshot = React.useRef(null);
  let serialized = "";
  try {
    serialized = JSON.stringify(values ?? null);
  } catch {
    serialized = String(Date.now());
  }
  if (snapshot.current === null) snapshot.current = serialized;
  useEffect(() => {
    if (!enabled || serialized === snapshot.current) return;
    const t = setTimeout(() => setSavedAt(new Date()), 550);
    return () => clearTimeout(t);
  }, [serialized, enabled]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  if (!enabled) return null;
  return (
    <span className="crmf-actions-note">
      <CheckCircle2 aria-hidden />
      {savedAt ? `Autosaved ${relativeTime(savedAt)}` : label}
    </span>
  );
}

/** Highlights the section currently in view. */
export function useSectionSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join("|");
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const seen = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
        const visible = ids.filter((id) => seen.get(id) != null);
        if (visible.length) setActive(visible[0]);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [active, setActive];
}

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ------------------------------------------------------------ layout */

/**
 * Page frame for long, multi-section forms.
 * nav: [{ id, label, done, count }]
 */
export function DocFormLayout({ crumbs, title, subtitle, actions, nav = [], children, narrow }) {
  const ids = nav.map((n) => n.id);
  const [active, setActive] = useSectionSpy(ids);
  const done = nav.filter((n) => n.done).length;
  const listRef = React.useRef(null);
  // On narrow screens the navigator is a horizontal strip: keep the active step in view.
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const btn = list.querySelector('[aria-current="step"]');
    if (btn) list.scrollTo({ left: Math.max(0, btn.parentElement.offsetLeft - 8), behavior: "smooth" });
  }, [active]);
  return (
    <Page className={cx("crmf", narrow && "crmf--narrow")}>
      <PageHeader crumbs={crumbs} title={title} subtitle={subtitle} actions={actions} />
      <div className={nav.length ? "crmf-layout" : undefined}>
        {nav.length > 0 && (
          <nav className="crmf-nav" aria-label="Form sections">
            <div className="crmf-nav__head">
              <div className="crmf-nav__meta">
                <span>Progress</span>
                <span>
                  {done} of {nav.length} sections
                </span>
              </div>
              <Progress value={(done / nav.length) * 100} />
            </div>
            <ol className="crmf-nav__list" ref={listRef}>
              {nav.map((n, i) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cx("crmf-nav__item", active === n.id && "is-active", n.done && "is-done")}
                    aria-current={active === n.id ? "step" : undefined}
                    onClick={() => {
                      setActive(n.id);
                      scrollToId(n.id);
                    }}
                  >
                    <span className="crmf-nav__dot">{n.done ? <Check aria-label="Complete" /> : i + 1}</span>
                    <span className="crmf-nav__label">{n.label}</span>
                    {n.count > 0 && <span className="crmf-nav__count">{n.count}</span>}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="crmf-main inos-form">{children}</div>
      </div>
    </Page>
  );
}

/** A numbered white form section with an anchor id. `grid` wraps children in the 2-col field grid. */
export function DocSection({ id, step, title, description, done, actions, grid, children }) {
  return (
    <section id={id} className={cx("inos-form-section crmf-section", done && "is-done")}>
      <div className="crmf-section__head">
        <div className="inos-form-section__head">
          {step != null && <span className="inos-form-section__step">{done ? <Check size={14} aria-label="Complete" /> : step}</span>}
          <div>
            <h2 className="inos-form-section__title">{title}</h2>
            {description && <p className="inos-form-section__desc">{description}</p>}
          </div>
        </div>
        {actions && <div className="crmf-section__head-actions">{actions}</div>}
      </div>
      {grid ? <div className="inos-form-grid">{children}</div> : <div className="crmf-body">{children}</div>}
    </section>
  );
}

export function SubHead({ title, text, actions }) {
  return (
    <div className="crmf-sub">
      <div>
        <h3 className="crmf-sub__title">{title}</h3>
        {text && <p className="crmf-sub__text">{text}</p>}
      </div>
      {actions}
    </div>
  );
}

/* ------------------------------------------------------------ inputs */

const optVal = (o) => (typeof o === "object" && o !== null ? o.value : o);
const optLabel = (o) => (typeof o === "object" && o !== null ? o.label : o);

/** Single-select choice cards. Compares by String so boolean/number values work; emits the option's raw value. */
export function Choices({ value, onChange, options = [], name, columns }) {
  return (
    <div
      className="inos-choices"
      role="radiogroup"
      aria-label={name}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((o) => {
        const v = optVal(o);
        const checked = value !== undefined && value !== null && value !== "" && String(value) === String(v);
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={checked}
            className="inos-choice"
            onClick={() => onChange(v)}
          >
            {optLabel(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Multi-select chips. value = array. */
export function ChipSelect({ value = [], onChange, options = [], name }) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div className="crmf-chips" role="group" aria-label={name}>
      {options.map((o) => {
        const v = optVal(o);
        const on = selected.includes(v);
        return (
          <button
            key={String(v)}
            type="button"
            role="checkbox"
            aria-checked={on}
            className="crmf-chip"
            onClick={() => onChange(on ? selected.filter((x) => x !== v) : [...selected, v])}
          >
            {on && <Check aria-hidden />}
            {optLabel(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Native select that maps String(value) back to the option's raw value. */
export function OptionSelect({ value, onChange, options = [], placeholder = "Select…", ...rest }) {
  const strVal = value === null || value === undefined ? "" : String(value);
  return (
    <SelectInput
      value={strVal}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        const hit = options.find((o) => String(optVal(o)) === raw);
        onChange(hit !== undefined ? optVal(hit) : raw);
      }}
      {...rest}
    >
      {options.map((o, i) => (
        <option key={`${String(optVal(o))}-${i}`} value={String(optVal(o))}>
          {optLabel(o)}
        </option>
      ))}
    </SelectInput>
  );
}

/** Project picker used at the top of every document form. */
export function ProjectPicker({ projects = [], value, onChange, onAdd, loading, required = true, hint, error, disabled }) {
  return (
    <div className="inos-form-grid">
      <Field
        label="Project"
        required={required}
        htmlFor="crmf-project"
        hint={hint || "The document is filed under this project."}
        error={error}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SelectInput
              id="crmf-project"
              value={value || ""}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={loading ? "Loading projects…" : projects.length ? "Select a project" : "No projects yet"}
              invalid={Boolean(error)}
              disabled={disabled}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectInput>
          </div>
          {onAdd && (
            <Button variant="soft" icon={Plus} onClick={onAdd}>
              New
            </Button>
          )}
        </div>
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------ rows */

export function RowCard({ index, title, meta, actions, onRemove, removeLabel = "Remove", selected, children }) {
  return (
    <div className={cx("crmf-row", selected && "crmf-row--selected")}>
      <div className="crmf-row__head">
        {index != null && <span className="crmf-row__index">{index}</span>}
        <div className="crmf-row__title">
          {title}
          {meta && <small>{meta}</small>}
        </div>
        <div className="crmf-row__actions">
          {actions}
          {onRemove && (
            <IconButton danger label={removeLabel} onClick={onRemove}>
              <Trash2 />
            </IconButton>
          )}
        </div>
      </div>
      {children && <div className="crmf-row__body">{children}</div>}
    </div>
  );
}

export function IconButton({ label, onClick, danger, disabled, children }) {
  return (
    <button
      type="button"
      className={cx("crmf-icon-btn", danger && "crmf-icon-btn--danger")}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function AddRowButton({ onClick, children, disabled }) {
  return (
    <button type="button" className="crmf-add" onClick={onClick} disabled={disabled}>
      <Plus aria-hidden />
      {children}
    </button>
  );
}

export function EmptyRows({ icon = Inbox, title, text, action }) {
  return (
    <div className="crmf-empty">
      <EmptyState icon={icon} title={title} text={text} action={action} />
    </div>
  );
}

export function Callout({ tone = "info", title, children, actions }) {
  const Icon = tone === "bad" ? AlertCircle : tone === "warn" ? AlertTriangle : tone === "ok" ? CheckCircle2 : Info;
  return (
    <div className={cx("crmf-callout", tone !== "info" && `crmf-callout--${tone}`)} role={tone === "bad" ? "alert" : undefined}>
      <Icon aria-hidden />
      <div className="crmf-callout__body">
        {title && <strong>{title}</strong>}
        {children}
        {actions && <div className="crmf-callout__actions">{actions}</div>}
      </div>
    </div>
  );
}

export function KV({ items }) {
  const list = useMemo(() => items.filter(Boolean), [items]);
  return (
    <div className="crmf-kv">
      {list.map(([label, value]) => {
        const empty = value === null || value === undefined || String(value).trim() === "";
        return (
          <div key={label} className="crmf-kv__item">
            <div className="crmf-kv__label">{label}</div>
            <div className={cx("crmf-kv__value", empty && "is-empty")}>{empty ? "Not recorded" : value}</div>
          </div>
        );
      })}
    </div>
  );
}

export const todayISODate = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};
