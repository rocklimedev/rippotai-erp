/**
 * Drawing docket: one PDF per trade (drawing category) of a project with the
 * LATEST version of every drawing — e.g. 25 electrical drawings where some are
 * at V0, some V1, some V2 come out as one set, each at its newest version.
 *
 * Page 1 is an index (No. · Drawing no. · Title · Version · Issued). PDF files
 * are copied page for page, JPG/PNG become one page each, and files a browser
 * cannot render (DWG/DXF) get a placeholder page so nothing silently goes missing.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';

export interface DocketRevision {
  id: string;
  revision: string | null;
  issueDate?: string | null;
  filename?: string | null;
  mime?: string | null;
  storageFilename?: string | null;
  createdAt?: Date | string | null;
}

export interface DocketDrawing {
  id: string;
  drawingNumber?: string | null;
  title?: string | null;
  sequence?: number | null;
  revisions?: DocketRevision[];
}

const versionRank = (label: string | null | undefined) => {
  const m = /^V(\d+)$/i.exec(String(label || ''));
  if (m) return Number(m[1]);
  if (/^[A-Z]$/.test(String(label || '')))
    return String(label).charCodeAt(0) - 65;
  return -1;
};

/** Newest revision of a drawing (by upload time, then by version label). */
export function latestRevision(d: DocketDrawing): DocketRevision | null {
  const list = [...(d.revisions || [])].filter((r) => r.storageFilename);
  if (!list.length) return null;
  list.sort((a, b) => {
    const t =
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime();
    return t || versionRank(b.revision) - versionRank(a.revision);
  });
  return list[0];
}

/** Drawings in docket order with their latest revision (drawings without a file are left out). */
export function docketEntries(drawings: DocketDrawing[]) {
  return drawings
    .map((d) => ({ drawing: d, revision: latestRevision(d) }))
    .filter(
      (e): e is { drawing: DocketDrawing; revision: DocketRevision } =>
        !!e.revision,
    )
    .sort(
      (a, b) =>
        Number(a.drawing.sequence ?? 0) - Number(b.drawing.sequence ?? 0) ||
        String(a.drawing.drawingNumber || '').localeCompare(
          String(b.drawing.drawingNumber || ''),
          undefined,
          {
            numeric: true,
          },
        ),
    );
}

const kindOf = (r: DocketRevision) => {
  const name = String(r.filename || r.storageFilename || '').toLowerCase();
  const mime = String(r.mime || '').toLowerCase();
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (mime.includes('png') || name.endsWith('.png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg') || /\.jpe?g$/.test(name))
    return 'jpg';
  return 'other';
};

const A3L: [number, number] = [1190.55, 841.89];
const GREEN = rgb(0.05, 0.24, 0.18);
const GREY = rgb(0.45, 0.5, 0.48);

// Helvetica (WinAnsi) cannot print every character; keep the index readable.
const safe = (s: unknown) =>
  String(s ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();

function fit(font: PDFFont, text: string, size: number, width: number) {
  let t = safe(text);
  while (t && font.widthOfTextAtSize(t, size) > width) t = t.slice(0, -1);
  return t;
}

function indexPages(
  doc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  meta: { project: string; trade: string; date: string },
  rows: string[][],
) {
  const [W, H] = A3L;
  const cols = [50, 140, 620, 110, 120];
  const xs: number[] = [];
  cols.reduce((x, w) => (xs.push(x), x + w), 60);
  const heads = ['No.', 'Drawing no.', 'Title', 'Version', 'Issued'];
  let page: PDFPage | null = null;
  let y = 0;
  const newPage = (first: boolean) => {
    page = doc.addPage(A3L);
    y = H - 70;
    if (first) {
      page.drawText('RIPPOTAI', {
        x: 60,
        y,
        size: 14,
        font: bold,
        color: GREEN,
      });
      y -= 40;
      page.drawText(fit(bold, `${meta.trade} - Drawing docket`, 26, W - 120), {
        x: 60,
        y,
        size: 26,
        font: bold,
        color: GREEN,
      });
      y -= 26;
      page.drawText(
        fit(
          font,
          `${meta.project}  |  ${rows.length} drawings  |  latest version of each  |  ${meta.date}`,
          12,
          W - 120,
        ),
        {
          x: 60,
          y,
          size: 12,
          font,
          color: GREY,
        },
      );
      y -= 40;
    }
    heads.forEach((h, i) =>
      page!.drawText(h, { x: xs[i], y, size: 10, font: bold, color: GREEN }),
    );
    y -= 8;
    page.drawLine({
      start: { x: 60, y },
      end: { x: W - 60, y },
      thickness: 1,
      color: GREEN,
    });
    y -= 18;
  };
  newPage(true);
  rows.forEach((r) => {
    if (y < 60) newPage(false);
    r.forEach((c, i) => {
      if (!c) return;
      page!.drawText(fit(font, c, 11, cols[i] - 10), {
        x: xs[i],
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    });
    y -= 6;
    page!.drawLine({
      start: { x: 60, y },
      end: { x: W - 60, y },
      thickness: 0.4,
      color: rgb(0.85, 0.87, 0.86),
    });
    y -= 16;
  });
}

export async function buildDocketPdf(
  entries: { drawing: DocketDrawing; revision: DocketRevision }[],
  meta: { project: string; trade: string },
  load: (storageFilename: string) => Promise<Buffer>,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.setTitle(`${meta.trade} - Drawing docket - ${meta.project}`);
  indexPages(
    doc,
    font,
    bold,
    { ...meta, date },
    entries.map((e, i) => [
      String(i + 1),
      e.drawing.drawingNumber || '',
      e.drawing.title || '',
      e.revision.revision || '',
      e.revision.issueDate ? String(e.revision.issueDate).slice(0, 10) : '',
    ]),
  );

  for (const { drawing, revision } of entries) {
    const label =
      `${drawing.drawingNumber || ''} ${drawing.title || ''} - ${revision.revision || ''}`.trim();
    const kind = kindOf(revision);
    try {
      if (kind === 'other') throw new Error('not printable');
      const bytes = await load(revision.storageFilename!);
      if (kind === 'pdf') {
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await doc.copyPages(src, src.getPageIndices());
        pages.forEach((p) => doc.addPage(p));
      } else {
        const img =
          kind === 'png'
            ? await doc.embedPng(bytes)
            : await doc.embedJpg(bytes);
        const landscape = img.width >= img.height;
        const [W, H] = landscape ? A3L : [A3L[1], A3L[0]];
        const scale = Math.min((W - 60) / img.width, (H - 80) / img.height, 1);
        const page = doc.addPage([W, H]);
        page.drawImage(img, {
          x: (W - img.width * scale) / 2,
          y: (H - img.height * scale) / 2 - 10,
          width: img.width * scale,
          height: img.height * scale,
        });
        page.drawText(fit(font, label, 10, W - 60), {
          x: 30,
          y: H - 30,
          size: 10,
          font,
          color: GREY,
        });
      }
    } catch {
      const page = doc.addPage(A3L);
      page.drawText(fit(bold, label, 18, A3L[0] - 120), {
        x: 60,
        y: A3L[1] - 120,
        size: 18,
        font: bold,
        color: GREEN,
      });
      page.drawText(
        fit(
          font,
          `${revision.filename || 'This file'} cannot be shown in a PDF (CAD or unreadable file) - download it from INOS.`,
          12,
          A3L[0] - 120,
        ),
        { x: 60, y: A3L[1] - 150, size: 12, font, color: GREY },
      );
    }
  }
  return doc.save();
}
