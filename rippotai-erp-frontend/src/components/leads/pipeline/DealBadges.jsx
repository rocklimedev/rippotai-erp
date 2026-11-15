// Lead temperature (Hot / Warm / Cold) and service (Design / Build) for the
// pipeline. Rippotai brand colours only: green #0D3D2F, gold #D9B061, grey #8C8C8C.

import { TEMPERATURES } from './dealMeta';

/** Solid temperature badge (Hot = brand green, Warm = gold, Cold = grey). */
export function TempBadge({ tag, size }) {
  if (!tag || !TEMPERATURES.some((t) => t.value === tag)) return null;
  return (
    <span
      className={`crm-temp crm-temp--${tag.toLowerCase()} ${size === 'lg' ? 'crm-temp--lg' : ''}`}
      data-testid="temp-badge"
      title={`${tag} lead`}
    >
      {tag}
    </span>
  );
}

/** Small DESIGN / BUILD label. */
export function ServiceLabel({ service }) {
  const v = service === 'BUILD' ? 'BUILD' : 'DESIGN';
  return (
    <span className={`crm-service crm-service--${v.toLowerCase()}`} data-testid="service-label">
      {v}
    </span>
  );
}

/**
 * One-click temperature marker: H / W / C. Clicking the active one clears it.
 * Stops pointer events so it never starts a card drag or opens the drawer.
 */
export function TempMarker({ tag, onChange, compact }) {
  const stop = (e) => e.stopPropagation();
  return (
    <span
      className={`crm-tempmark ${compact ? 'crm-tempmark--compact' : ''}`}
      role="radiogroup"
      aria-label="Lead temperature"
      onPointerDown={stop}
      onMouseDown={stop}
      onKeyDown={stop}
      onClick={stop}
      data-testid="temp-marker"
    >
      {TEMPERATURES.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={tag === t.value}
          className={`crm-tempmark__btn crm-tempmark__btn--${t.value.toLowerCase()}`}
          title={tag === t.value ? `Clear ${t.label}` : `Mark ${t.label}`}
          onClick={() => onChange(tag === t.value ? null : t.value)}
          data-temp={t.value}
        >
          {compact ? t.label[0] : t.label}
        </button>
      ))}
    </span>
  );
}
