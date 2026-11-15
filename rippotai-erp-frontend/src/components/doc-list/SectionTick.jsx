import { Check } from "lucide-react";
import { fillLabel } from "./doc-utils";
import "./doc-list.css";

/** Round completeness tick: green = complete, light yellow = partly filled, grey = not started. */
export function SectionTick({ state, className }) {
  const label = fillLabel(state);
  return (
    <span className={`sec-tick sec-tick--${state}${className ? ` ${className}` : ""}`} title={label} aria-label={label} role="img" data-tick={state}>
      <Check aria-hidden />
    </span>
  );
}

/**
 * Section header badge shared by every document form: the step number while
 * the section is empty, a light-yellow tick when partly filled and a green tick
 * only when every field is filled. Without a step it is a plain SectionTick.
 */
export function SectionStatus({ state = "empty", step, enabled = true }) {
  if (step == null) return enabled ? <SectionTick state={state} /> : null;
  const shown = enabled && state !== "empty";
  return (
    <span
      className={`inos-form-section__step${shown ? ` is-${state}` : ""}`}
      title={enabled ? fillLabel(state) : undefined}
      data-tick={enabled ? state : undefined}
    >
      {shown ? <Check size={14} aria-label={fillLabel(state)} /> : step}
    </span>
  );
}
