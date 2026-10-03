// Admin Console helpers — thin pieces layered on @/components/inos so every
// admin page (and its modals) shares one look. Styles: ./_admin-ui.css
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, ShieldAlert, X } from "lucide-react";
import { Button, EmptyState, Page, PageHeader } from "@/components/inos";
import "./_admin-ui.css";

export const ADMIN_ROOT = { label: "Admin Console", to: "/console" };
export const adminCrumbs = (label) => [ADMIN_ROOT, { label }];

/** Title-case an ALL_CAPS / snake value for display ("SITE_ENGINEER" -> "Site engineer"). */
export const humanize = (v) => {
  const s = String(v ?? "").replace(/[_-]+/g, " ").trim().toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
};

export const initialsOf = (name = "") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/* ------------------------------------------------------------ access */

export function AdminAccessDenied({ title = "Admin access required", text = "Only administrators can open this part of the Admin Console.", crumb, action }) {
  return (
    <Page>
      {crumb && <PageHeader crumbs={adminCrumbs(crumb)} title={crumb} />}
      <section className="inos-card">
        <EmptyState icon={ShieldAlert} title={title} text={text} action={action} />
      </section>
    </Page>
  );
}

/* ------------------------------------------------------------ modal */

/**
 * Centered dialog (bottom sheet on phones). Footer: pass `footer` node,
 * usually <ModalActions/>. Wrap body in <form> via `as="form"` + onSubmit.
 */
export function AdminModal({ open = true, onClose, icon: Icon, tone, title, subtitle, children, footer, width = 560, busy, as = "div", onSubmit, testId }) {
  const close = useCallback(() => {
    if (!busy) onClose?.();
  }, [busy, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open) return null;
  const Shell = as;

  return createPortal(
    <div className="adm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <Shell
        className="adm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        style={{ "--adm-w": `${width}px` }}
        onSubmit={onSubmit}
        noValidate={as === "form" ? true : undefined}
        data-testid={testId}
      >
        <div className="adm-modal__head">
          {Icon && (
            <span className={`inos-icon-tile${tone ? ` inos-icon-tile--${tone}` : ""}`}>
              <Icon aria-hidden />
            </span>
          )}
          <div className="adm-modal__titles">
            <h2 className="adm-modal__title">{title}</h2>
            {subtitle && <p className="adm-modal__sub">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" icon={X} onClick={close} aria-label="Close" disabled={busy} />
        </div>
        <div className="adm-modal__body">{children}</div>
        {footer && <div className="adm-modal__foot">{footer}</div>}
      </Shell>
    </div>,
    document.body,
  );
}

/** Ghost Cancel + primary action. Primary is type=submit unless onSubmit is given. */
export function ModalActions({ onCancel, cancelLabel = "Cancel", submitLabel = "Save", submitting, submittingLabel, disabled, onSubmit, icon, note, danger }) {
  return (
    <>
      {note && <span className="adm-modal__foot-note">{note}</span>}
      <Button variant="ghost" onClick={onCancel} disabled={submitting}>
        {cancelLabel}
      </Button>
      <Button
        variant={danger ? "danger" : "primary"}
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        icon={icon}
        disabled={disabled || submitting}
      >
        {submitting ? submittingLabel || "Saving…" : submitLabel}
      </Button>
    </>
  );
}

/* ------------------------------------------------------------ row menu */

/**
 * items: [{ label, icon, onClick, disabled, title, danger } | "sep"]
 * Rendered in a portal so it never gets clipped by scrolling tables.
 */
export function RowMenu({ items, label = "Actions", busy, icon: Icon = MoreHorizontal, className, testId }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = menuRef.current?.offsetHeight || 0;
    const below = r.bottom + 6;
    const top = menuH && below + menuH > window.innerHeight - 8 ? Math.max(8, r.top - menuH - 6) : below;
    setPos({ top, right: Math.max(8, window.innerWidth - r.right) });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <Button
        ref={btnRef}
        variant="ghost"
        size="sm"
        icon={Icon}
        className={className}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        data-testid={testId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      />
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="adm-menu"
            role="menu"
            style={pos ? { top: pos.top, right: pos.right } : { visibility: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.filter(Boolean).map((it, i) => {
              if (it === "sep") return <div key={`s${i}`} className="adm-menu__sep" />;
              const I = it.icon;
              return (
                <button
                  key={it.label}
                  type="button"
                  role="menuitem"
                  className={`adm-menu__item${it.danger ? " adm-menu__item--danger" : ""}`}
                  disabled={it.disabled}
                  title={it.title}
                  onClick={() => {
                    setOpen(false);
                    it.onClick?.();
                  }}
                >
                  {I && <I aria-hidden />}
                  {it.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

/* ------------------------------------------------------------ bits */

export function Switch({ checked, onChange, disabled, label, testId }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      className="adm-switch"
      disabled={disabled}
      data-testid={testId}
      onClick={() => onChange?.(!checked)}
    />
  );
}

export function ToggleRow({ label, hint, checked, onChange, disabled }) {
  return (
    <div className="adm-toggle-row">
      <div>
        <div className="adm-toggle-row__label">{label}</div>
        {hint && <div className="adm-toggle-row__hint">{hint}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}

/** Skeleton rows while a table loads. */
export function SkeletonRows({ cols, rows = 3 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c}>
          <div className="adm-skel" style={{ width: c === 0 ? "60%" : "40%" }} />
        </td>
      ))}
    </tr>
  ));
}

/** Full-width table cell for empty/error states. */
export function TableEmpty({ cols, ...props }) {
  return (
    <tr className="adm-empty-row">
      <td colSpan={cols} style={{ height: "auto", padding: 0 }}>
        <EmptyState {...props} />
      </td>
    </tr>
  );
}

/** created -> ok, updated -> info, deleted -> bad … */
export const actionTone = (action = "") => {
  const a = String(action).toLowerCase();
  if (/(delete|remove|revoke|reject|fail)/.test(a)) return "bad";
  if (/(create|add|grant|approve|invite|restore)/.test(a)) return "ok";
  if (/(update|edit|change|move|rename)/.test(a)) return "info";
  if (/(login|logout|sign)/.test(a)) return "lilac";
  return "mute";
};

/** `changes` arrives as an object or a JSON string — return [[key, value]]. */
export const changeEntries = (changes) => {
  let c = changes;
  if (typeof c === "string") {
    try {
      c = JSON.parse(c);
    } catch {
      return c.trim() ? [["", c]] : [];
    }
  }
  if (!c || typeof c !== "object") return [];
  return Object.entries(c).filter(([, v]) => v !== null && v !== undefined && v !== "");
};

export const fmtValue = (v) =>
  typeof v === "boolean" ? (v ? "Yes" : "No") : typeof v === "object" ? JSON.stringify(v) : String(v);

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
