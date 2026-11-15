// Section completeness for every document input form. Reads the section's own
// controls (inputs, selects, textareas, Radix comboboxes, checkbox/radio
// groups) so no form has to wire per-field state:
//   done    – every field filled  → green tick
//   partial – some fields filled  → yellow (pending) tick
//   empty   – nothing filled      → grey / none
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { evaluateSection } from "./doc-utils";

/**
 * Live completeness of the element in `ref` (see resolveFill in doc-utils).
 * `ruleDone` — optional form rule (true/false/undefined) for required lists.
 */
export function useSectionCompleteness(ref, enabled = true, ruleDone) {
  const [state, setState] = useState("empty");
  const ruleRef = useRef(ruleDone);
  // Re-evaluate after every render of the owning section (controlled inputs).
  useLayoutEffect(() => {
    ruleRef.current = ruleDone;
    if (!enabled) return;
    const next = evaluateSection(ref.current, ruleDone);
    setState((s) => (s === next ? s : next));
  });
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = evaluateSection(el, ruleRef.current);
        setState((s) => (s === next ? s : next));
      });
    };
    el.addEventListener("input", run, true);
    el.addEventListener("change", run, true);
    el.addEventListener("click", run, true);
    const mo = new MutationObserver(run);
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-placeholder", "value", "aria-checked", "data-state"] });
    run();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("input", run, true);
      el.removeEventListener("change", run, true);
      el.removeEventListener("click", run, true);
      mo.disconnect();
    };
  }, [ref, enabled]);
  return state;
}

