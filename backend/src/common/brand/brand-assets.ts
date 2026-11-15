// Official Rippotai brand assets + colour tokens for server-generated documents
// (PDF, Excel, Word). Source of truth: docs/BRAND-DOCUMENTS.md. Never recolour or
// redraw the logo files; only these colours may appear in a document.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const BRAND = {
  green: '#0D3D2F', // titles, section headings, table header rows, key totals
  gold: '#D9B061', // thin accent rules only — never text
  ink: '#1A1A1A', // body text
  grey: '#4D4D4D', // labels / secondary text (never lighter)
  rule: '#8C8C8C', // outer / section rules
  ruleSoft: '#BDBDBD', // inner cell lines
  fill: '#F2F2F2', // label columns / totals
  white: '#FFFFFF',
} as const;

export const COMPANY_NAME = 'Rippotai Architecture';

export type BrandLogo = 'logo' | 'monogram' | 'wordmark';

const cache = new Map<string, Buffer>();

function firstExisting(candidates: string[]): string {
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) throw new Error(`Brand asset not found: ${candidates[0]}`);
  return hit;
}

/** backend/assets/brand/rippotai-<name>.png (works from src/ under ts-jest and from dist/). */
export function brandLogo(name: BrandLogo): Buffer {
  const file = `rippotai-${name}.png`;
  const key = `logo:${file}`;
  if (!cache.has(key)) {
    const path = firstExisting([
      resolve(process.cwd(), 'assets', 'brand', file),
      resolve(__dirname, '..', '..', '..', 'assets', 'brand', file),
      resolve(__dirname, '..', '..', '..', '..', 'assets', 'brand', file),
    ]);
    cache.set(key, readFileSync(path));
  }
  return cache.get(key)!;
}

/** Lato (OFL) shipped with the Crucial Work template — regular / bold. */
export function brandFont(weight: 'regular' | 'bold'): Buffer {
  const file = `lato-${weight}.woff`;
  const key = `font:${file}`;
  if (!cache.has(key)) {
    const path = firstExisting([
      join(__dirname, '..', '..', 'modules', 'tasks', 'templates', file),
      resolve(process.cwd(), 'src', 'modules', 'tasks', 'templates', file),
      resolve(
        process.cwd(),
        'dist',
        'src',
        'modules',
        'tasks',
        'templates',
        file,
      ),
    ]);
    cache.set(key, readFileSync(path));
  }
  return cache.get(key)!;
}

export const dataUri = (buffer: Buffer, mime: string) =>
  `data:${mime};base64,${buffer.toString('base64')}`;

/** @font-face rules embedding Lato for headless-Chromium HTML → PDF. */
export function latoFontFaces(): string {
  const face = (weight: number, buf: Buffer) =>
    `@font-face{font-family:'Lato';font-style:normal;font-weight:${weight};src:url(${dataUri(buf, 'font/woff')}) format('woff');}`;
  return face(400, brandFont('regular')) + face(700, brandFont('bold'));
}

/** Escape text for HTML templates. */
export const esc = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
