// Small shared pieces for Design Studio drawing pages.
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, FileText, Image as ImageIcon, PenTool, Search } from "lucide-react";
import { KIND_TONE, fileKind, extOf } from "./drawingUtils";
import "./drawings.css";

const cx = (...c) => c.filter(Boolean).join(" ");

/** Thumbnail tile: real image preview for images, a labelled sheet for PDF / DWG / DXF. */
export function FileThumb({ name, mime, src, size = "md" }) {
  const kind = fileKind({ name, mime });
  const [broken, setBroken] = useState(false);
  const ext = (extOf(name) || kind).toUpperCase().slice(0, 4);
  if (kind === "image" && src && !broken) {
    return (
      <span className={cx("ds-thumb", `ds-thumb--${size}`, "ds-thumb--img")}>
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
      </span>
    );
  }
  const Icon = kind === "image" ? ImageIcon : kind === "dwg" || kind === "dxf" ? PenTool : FileText;
  return (
    <span className={cx("ds-thumb", `ds-thumb--${size}`, `ds-thumb--${KIND_TONE[kind] || "mute"}`)}>
      <span className="ds-thumb__sheet" aria-hidden>
        <Icon />
      </span>
      <span className="ds-thumb__ext">{ext}</span>
    </span>
  );
}

/** Searchable project picker. projects: [{id, name, site_location?, client?}] */
export function ProjectPicker({ projects = [], value, onChange, invalid, placeholder = "Search projects…", id }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const ref = useRef(null);
  const selected = projects.find((p) => p.id === value);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return projects;
    return projects.filter((p) =>
      [p.name, p.site_location, p.client?.name].filter(Boolean).some((t) => String(t).toLowerCase().includes(s)),
    );
  }, [projects, q]);

  const pick = (p) => {
    onChange?.(p.id);
    setOpen(false);
    setQ("");
  };

  return (
    <div className="ds-picker" ref={ref}>
      <button
        id={id}
        type="button"
        className="inos-input ds-picker__btn"
        aria-invalid={invalid || undefined}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setHi(0);
        }}
      >
        {selected ? (
          <span className="ds-picker__value">
            <strong>{selected.name}</strong>
            {selected.site_location && <span>{selected.site_location}</span>}
          </span>
        ) : (
          <span className="ds-picker__ph">Select a project</span>
        )}
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && (
        <div className="ds-picker__pop" role="listbox">
          <label className="ds-picker__search">
            <Search size={15} aria-hidden />
            <input
              autoFocus
              value={q}
              placeholder={placeholder}
              onChange={(e) => {
                setQ(e.target.value);
                setHi(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHi((h) => Math.min(h + 1, list.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHi((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (list[hi]) pick(list[hi]);
                } else if (e.key === "Escape") setOpen(false);
              }}
            />
          </label>
          <div className="ds-picker__list">
            {list.length === 0 && <div className="ds-picker__none">No project matches “{q}”</div>}
            {list.map((p, i) => (
              <button
                type="button"
                key={p.id}
                role="option"
                aria-selected={p.id === value}
                className={cx("ds-picker__opt", i === hi && "is-hi")}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(p)}
              >
                <span className="ds-picker__value">
                  <strong>{p.name}</strong>
                  <span>{[p.client?.name, p.site_location].filter(Boolean).join(" · ") || "—"}</span>
                </span>
                {p.id === value && <Check size={15} aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact chip group for short option lists (sheet size, discipline). */
export function Chips({ value, onChange, options, mixed, allowEmpty }) {
  return (
    <div className={cx("ds-chips", mixed && "is-mixed")} role="radiogroup">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            className="ds-chip"
            onClick={() => onChange(allowEmpty && value === v ? "" : v)}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
