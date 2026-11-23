/**
 * Project planner ↔ uploaded documents / drawings.
 *
 * A Design (Consultancy) planner row such as "BATHROOM DETAILS" or
 * "ELECTRICAL LAYOUT" counts as done once the project has a matching document
 * or drawing ("Bathroom Details", "Tender – Electrical"). The row then shows
 * Completed with the upload date — also when it was uploaded before its
 * planned date, or when no date was set.
 *
 * Matching is by meaning words inside the same phase (generic words such as
 * layout / details / tender are ignored; numbers must agree).
 */

export interface EvidenceRow {
  phase_code: string | null;
  name: string | null;
  title: string | null;
  created_at: string | Date;
}

export interface PlannerEvidence {
  date: string; // YYYY-MM-DD
  title: string;
}

/** Consultancy phase title → document phase codes. */
const PHASE_CODES: Record<string, string[]> = {
  'PRE-DESIGN': ['03_PRE_DESIGN'],
  'PRE DESIGN': ['03_PRE_DESIGN'],
  DESIGN: ['05_DESIGN'],
  'MATERIAL SELECTION': ['05_DESIGN', 'B_MATERIAL'],
  'TENDER DRAWINGS': ['06_TENDER'],
  'WORKING DRAWINGS': ['07_WORKING'],
};

const GENERIC = new Set([
  'tender',
  'layout',
  'layouts',
  'detail',
  'details',
  'detailing',
  'drawing',
  'drawings',
  'design',
  'plan',
  'the',
  'and',
  'with',
  'of',
  'for',
  'a',
  'an',
  'to',
  'in',
  'schedule',
  'fixed',
  'furniture',
  'as',
  'built',
  'project',
  'document',
  'v1',
  'rev',
  'null',
]);

const stem = (w: string) =>
  w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;

export function coreWords(text: string | null | undefined): Set<string> {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((w) => w && !GENERIC.has(w))
      .map(stem),
  );
}

const subset = (a: Set<string>, b: Set<string>) =>
  a.size > 0 && [...a].every((w) => b.has(w));
const numbers = (s: Set<string>) => [...s].filter((w) => /\d/.test(w));

/** 0 = no match; higher = better. */
export function matchScore(item: Set<string>, cand: Set<string>): number {
  if (!item.size || !cand.size) return 0;
  const ni = numbers(item);
  const nc = numbers(cand);
  if (ni.length && nc.length && !ni.some((n) => nc.includes(n))) return 0;
  if (ni.length && !nc.length) return 0;
  if (subset(item, cand) || subset(cand, item)) {
    const overlap = [...item].filter((w) => cand.has(w)).length;
    return 10 + overlap;
  }
  return 0;
}

/** Old planner names for the same document. */
const ALIASES: [RegExp, string][] = [
  [/pitch\s*\/?\s*proposal/gi, 'pitch presentation'],
];
const alias = (text: string) =>
  ALIASES.reduce((t, [re, to]) => t.replace(re, to), text);

const day = (d: string | Date) => {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '' : x.toISOString().slice(0, 10);
};

/** Evidence (earliest matching upload) for one planner row, or null. */
export function evidenceFor(
  item: {
    work_name?: string | null;
    details?: string | null;
    phase?: { module?: string; title?: string } | null;
  },
  rows: EvidenceRow[],
): PlannerEvidence | null {
  if (item.phase?.module !== 'CONSULTANCY') return null;
  const codes =
    PHASE_CODES[
      String(item.phase?.title || '')
        .trim()
        .toUpperCase()
    ];
  if (!codes) return null;
  const words = coreWords(
    alias(`${item.work_name || ''} ${item.details || ''}`),
  );
  let best: { score: number; row: EvidenceRow } | null = null;
  for (const row of rows) {
    if (!codes.includes(String(row.phase_code || ''))) continue;
    const score = Math.max(
      matchScore(words, coreWords(row.name)),
      matchScore(words, coreWords(row.title)),
    );
    if (!score) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score &&
        new Date(row.created_at) < new Date(best.row.created_at))
    )
      best = { score, row };
  }
  if (!best) return null;
  return {
    date: day(best.row.created_at),
    title: best.row.name || best.row.title || '',
  };
}
