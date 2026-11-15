// Helpers for the Word template family (word.jsx).
import { has } from "./format";

/**
 * Labels of the options that were chosen in a list of check items
 * ("Other: <text>" for a filled Other item).
 */
export const checkedLabels = (items) =>
  (items || [])
    .filter((it) => it && !it.empty && (it.checked || (it.other && has(it.value))))
    .map((it) => (it.other ? (has(it.value) ? `Other: ${it.value}` : "Other") : it.label));

/** Default cover lines: PROJECT / ADDRESS · CLIENT / PRINCIPAL ARCHITECT · PROJECT LEAD. */
export function coverRows({ project, address, client, architect, lead }) {
  return [
    [{ label: "PROJECT:", value: project, wide: true }],
    [
      { label: "ADDRESS:", value: address },
      { label: "CLIENT:", value: client },
    ],
    [
      { label: "PRINCIPAL ARCHITECT:", value: architect, gold: true },
      { label: "PROJECT LEAD:", value: lead },
    ],
  ];
}

/** Pads a list of table rows with blank rows up to `min` (the template's empty lines). */
export function padRows(items, min, cols) {
  const out = [...(items || [])];
  for (let i = out.length; i < min; i++)
    out.push({ key: `blank-${i}`, cells: Array.from({ length: cols }, () => "") });
  return out;
}

