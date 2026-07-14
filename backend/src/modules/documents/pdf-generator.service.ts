import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

interface RenderOptions {
  docTitle: string;
  docNo: string;
  projectName: string;
  sections: Record<string, Record<string, string>>;
  attachmentsSummary?: { filename: string; remark?: string }[];
}

/**
 * Renders the section answers captured by the SectionForm component
 * (Project Brief / Site Reki) into a PDF buffer, ready to hand to
 * CdnService.uploadBuffer(). Kept intentionally simple (no external
 * template engine) — swap in a proper templating/HTML-to-PDF pipeline
 * later if the design needs richer layout.
 */
@Injectable()
export class PdfGeneratorService {
  async renderSectionsPdf(opts: RenderOptions): Promise<Buffer> {
    const { docTitle, docNo, projectName, sections, attachmentsSummary } = opts;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(docTitle, { align: 'center' });
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .fillColor('#6B7B7C')
        .text(`${docNo} · ${projectName}`, { align: 'center' });
      doc.moveDown(1.2);
      doc.fillColor('#333333');

      for (const [sectionTitle, fields] of Object.entries(sections || {})) {
        doc
          .fontSize(13)
          .fillColor('#1F453B')
          .text(sectionTitle, { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#333333');
        for (const [key, value] of Object.entries(fields || {})) {
          if (!value) continue;
          doc.font('Helvetica-Bold').text(`${key}: `, { continued: true });
          doc.font('Helvetica').text(String(value));
        }
        doc.moveDown(0.8);
      }

      if (attachmentsSummary?.length) {
        doc
          .fontSize(13)
          .fillColor('#1F453B')
          .text('Attachments', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#333333');
        for (const a of attachmentsSummary) {
          doc.text(`• ${a.filename}${a.remark ? ` — ${a.remark}` : ''}`);
        }
      }

      doc.end();
    });
  }
}
