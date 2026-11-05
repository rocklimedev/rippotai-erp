import { BadRequestException } from '@nestjs/common';
import { INDEX_MAPPINGS } from './mappings/index-templates';
import { SHARED_ANALYSIS } from './mappings/analyzers';

type Clause = Record<string, any>;
const list = (value: any): Clause[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];
const normalize = (value: any): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
const tokens = (value: any): string[] =>
  normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];
const fieldValue = (doc: Clause, field: string) =>
  doc[field.replace(/\.keyword$/, '')];

/** Compile the supported private query vocabulary. Unknown clauses fail closed. */
export function compileSearchFilter(query: Clause, params: Clause): string {
  const bind = (value: any) => {
    const name = `filter${Object.keys(params).length}`;
    params[name] = value;
    return `:${name}`;
  };
  const field = (name: string) => {
    if (!/^[a-z][a-z0-9_]*(\.keyword)?$/.test(name))
      throw new BadRequestException('Unsupported search field');
    return name === 'project_id'
      ? 'project_id'
      : `NULLIF(JSON_UNQUOTE(JSON_EXTRACT(document, '$.${name.replace(/\.keyword$/, '')}')), 'null')`;
  };
  const compile = (q: Clause, textAllowed = true): string => {
    if (q.match_all) return '1=1';
    if (q.match_none) return '1=0';
    if (q.multi_match && textAllowed) return '1=1'; // Text evaluated in bounded batches.
    if (q.term || q.terms)
      return Object.entries(q.term ?? q.terms)
        .map(([key, value]) => {
          const values = q.terms ? (value as any[]) : [value];
          if (!Array.isArray(values) || !values.length) return '1=0';
          return `COALESCE(${field(key)} IN (${values.map((v) => bind(typeof v === 'boolean' ? String(v) : v)).join(',')}), 0)`;
        })
        .join(' AND ');
    if (q.range)
      return Object.entries(q.range)
        .map(([key, bounds]: any) =>
          Object.entries(bounds)
            .map(([op, value]) => {
              const operators = { gte: '>=', lte: '<=', gt: '>', lt: '<' };
              if (!operators[op])
                throw new BadRequestException('Unsupported search range');
              return `COALESCE(${field(key)} ${operators[op]} ${bind(value)}, 0)`;
            })
            .join(' AND '),
        )
        .join(' AND ');
    if (q.bool) {
      const b = q.bool;
      const conditions = [...list(b.must), ...list(b.filter)].map((c) =>
        compile(c, textAllowed),
      );
      conditions.push(
        ...list(b.must_not).map((c) => `NOT (${compile(c, false)})`),
      );
      const should = list(b.should);
      const minimum =
        b.minimum_should_match ??
        (conditions.length ? 0 : should.length ? 1 : 0);
      if (minimum)
        conditions.push(
          `(${should.map((c) => `(${compile(c, textAllowed)})`).join(' + ')}) >= ${Number(minimum)}`,
        );
      return conditions.length
        ? conditions.map((c) => `(${c})`).join(' AND ')
        : '1=1';
    }
    throw new BadRequestException('Unsupported search query');
  };
  return compile(query);
}

/** Bounded edit distance with adjacent transpositions, matching AUTO typo limits. */
function distance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prevPrev: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        current[j] = Math.min(current[j], prevPrev[j - 2] + 1);
    }
    if (Math.min(...current) > max) return false;
    prevPrev = previous;
    previous = current;
  }
  return previous[b.length] <= max;
}

function analyzedTokens(value: any, field: string, index?: string): string[] {
  const properties = index
    ? INDEX_MAPPINGS[index]?.mappings.properties
    : undefined;
  const analyzer = (properties?.[field] as any)?.analyzer;
  const filter =
    analyzer === 'address_analyzer'
      ? SHARED_ANALYSIS.filter.address_synonym
      : analyzer === 'material_analyzer'
        ? SHARED_ANALYSIS.filter.material_synonym
        : undefined;
  let text = normalize(value);
  // Canonicalize equivalent words/phrases on both query and document sides.
  for (const group of filter?.synonyms ?? []) {
    const alternatives = group.split(',').map((word) => word.trim());
    const pattern = alternatives
      .sort((a, b) => b.length - a.length)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    text = text.replace(
      new RegExp(`\\b(?:${pattern})\\b`, 'g'),
      group.split(',')[0].trim(),
    );
  }
  return tokens(text);
}

function textScore(doc: Clause, match: Clause, index?: string): number | null {
  if (!tokens(match.query).length) return null;
  const scores = (match.fields ?? ['title', 'searchable_text']).map(
    (spec: string) => {
      const [field, rawBoost] = spec.split('^');
      const terms = analyzedTokens(match.query, field, index);
      const words = analyzedTokens(fieldValue(doc, field), field, index);
      let score = 0;
      const matched = terms.map((term, index) => {
        const prefix =
          match.type === 'bool_prefix' && index === terms.length - 1;
        const exact = words.some((word) =>
          prefix ? word.startsWith(term) : word === term,
        );
        const max = match.fuzziness
          ? term.length < 3
            ? 0
            : term.length < 6
              ? 1
              : 2
          : 0;
        const fuzzy =
          !exact && max > 0 && words.some((word) => distance(term, word, max));
        if (exact || fuzzy) score += exact ? 1 : 0.5;
        return exact || fuzzy;
      });
      if (
        (match.type === 'bool_prefix' || match.operator === 'and') &&
        !matched.every(Boolean)
      )
        return 0;
      return score * Number(rawBoost ?? 1);
    },
  );
  const score = Math.max(0, ...scores);
  return score > 0 ? score : null;
}

/** Null means no match; numeric scores preserve weighted best-field ranking. */
export function evaluateSearch(
  doc: Clause,
  q: Clause,
  index?: string,
): number | null {
  if (q.match_all) return 1;
  if (q.match_none) return null;
  if (q.multi_match) return textScore(doc, q.multi_match, index);
  if (q.term || q.terms)
    return Object.entries(q.term ?? q.terms).every(([key, value]) => {
      const actual = fieldValue(doc, key);
      return (
        actual != null &&
        (q.terms ? (value as any[]) : [value]).some(
          (v) => String(v) === String(actual),
        )
      );
    })
      ? 0
      : null;
  if (q.range)
    return Object.entries(q.range).every(([key, bounds]: any) => {
      const actual = fieldValue(doc, key);
      if (actual == null) return false;
      const compare = (v: any) =>
        key.endsWith('_at') ? new Date(v).getTime() : v;
      return Object.entries(bounds).every(([op, value]) => {
        const a = compare(actual),
          b = compare(value);
        return op === 'gte'
          ? a >= b
          : op === 'lte'
            ? a <= b
            : op === 'gt'
              ? a > b
              : op === 'lt'
                ? a < b
                : false;
      });
    })
      ? 0
      : null;
  if (q.bool) {
    const b = q.bool;
    const must = list(b.must).map((c) => evaluateSearch(doc, c, index));
    if (
      must.some((s) => s === null) ||
      list(b.filter).some((c) => evaluateSearch(doc, c, index) === null) ||
      list(b.must_not).some((c) => evaluateSearch(doc, c, index) !== null)
    )
      return null;
    const should = list(b.should).map((c) => evaluateSearch(doc, c, index));
    const minimum =
      b.minimum_should_match ??
      (list(b.must).length || list(b.filter).length
        ? 0
        : should.length
          ? 1
          : 0);
    if (should.filter((s) => s !== null).length < minimum) return null;
    return [...must, ...should].reduce<number>((sum, s) => sum + (s ?? 0), 0);
  }
  throw new BadRequestException('Unsupported search query');
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

export function highlightSearch(
  doc: Clause,
  query: Clause,
  config: Clause,
): Clause {
  const terms: string[] = [];
  const collect = (q: Clause) => {
    if (q.multi_match) terms.push(...tokens(q.multi_match.query));
    if (q.bool) [...list(q.bool.must), ...list(q.bool.should)].forEach(collect);
  };
  collect(query ?? {});
  const result: Clause = {};
  for (const [field, options] of Object.entries(config.fields ?? {}) as [
    string,
    any,
  ][]) {
    const text = String(fieldValue(doc, field) ?? '');
    const ranges = [...text.matchAll(/[\p{L}\p{N}]+/gu)].filter((m) =>
      terms.includes(normalize(m[0])),
    );
    if (!ranges.length) continue;
    const length = options.fragment_size ?? 160;
    const start = Math.max(0, ranges[0].index! - Math.floor(length / 3));
    const fragment = text.slice(start, start + length);
    result[field] = [
      fragment
        .split(/([\p{L}\p{N}]+)/gu)
        .map((word) =>
          terms.includes(normalize(word))
            ? `<em>${escapeHtml(word)}</em>`
            : escapeHtml(word),
        )
        .join(''),
    ];
  }
  return result;
}
