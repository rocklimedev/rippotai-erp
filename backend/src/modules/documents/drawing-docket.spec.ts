import { PDFDocument } from 'pdf-lib';
import { buildDocketPdf, docketEntries, latestRevision } from './drawing-docket';

const rev = (id: string, revision: string, at: string, file = `${id}.pdf`) => ({
  id, revision, createdAt: at, filename: file, storageFilename: file, mime: file.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
});

describe('drawing docket', () => {
  it('picks the latest version of each drawing', () => {
    const d = { id: 'd1', revisions: [rev('a', 'V0', '2026-01-01'), rev('b', 'V2', '2026-03-01'), rev('c', 'V1', '2026-02-01')] };
    expect(latestRevision(d)?.revision).toBe('V2');
    const entries = docketEntries([
      { id: 'x', drawingNumber: 'E-002', revisions: [rev('e', 'V0', '2026-01-01')] },
      { id: 'y', drawingNumber: 'E-001', revisions: [rev('f', 'V1', '2026-01-05')] },
      { id: 'z', drawingNumber: 'E-003', revisions: [] },
    ]);
    expect(entries.map((e) => e.drawing.drawingNumber)).toEqual(['E-001', 'E-002']);
  });

  it('merges every latest file into one PDF after an index page', async () => {
    const one = await PDFDocument.create();
    one.addPage([200, 200]);
    one.addPage([200, 200]);
    const bytes = Buffer.from(await one.save());
    const entries = docketEntries([
      { id: 'a', drawingNumber: 'E-001', title: 'Power', revisions: [rev('p1', 'V0', '2026-01-01'), rev('p2', 'V1', '2026-02-01')] },
      { id: 'b', drawingNumber: 'E-002', title: 'Lighting', revisions: [rev('l1', 'V0', '2026-01-01', 'l1.dwg')] },
    ]);
    const loaded: string[] = [];
    const out = await buildDocketPdf(entries, { project: 'Kapoor Farmhouse', trade: 'Tender – Electrical' }, async (f) => {
      loaded.push(f);
      return bytes;
    });
    const merged = await PDFDocument.load(out);
    // index + 2 pages of the V1 PDF + 1 placeholder for the DWG
    expect(merged.getPageCount()).toBe(4);
    expect(loaded).toEqual(['p2.pdf']);
  });
});
