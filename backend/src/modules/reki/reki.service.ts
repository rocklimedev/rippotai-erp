import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SiteReki } from './models/site-reki.model';
import { SiteRekiAttachment } from './models/site-attachment.model';
import { CreateSiteRekiDto } from './dto/create-site-reki.dto';
import { MAX_ATTACHMENT_BYTES } from './dto/attachment.dto';
import {
  REKI_SECTIONS,
  REKI_DOC_PREFIX,
} from '@/common/constants/document-sections.constants';

@Injectable()
export class RekiService {
  constructor(
    @InjectModel(SiteReki)
    private readonly siteRekiModel: typeof SiteReki,
    @InjectModel(SiteRekiAttachment)
    private readonly attachmentModel: typeof SiteRekiAttachment,
  ) {}

  async create(dto: CreateSiteRekiDto, userId?: string) {
    const doc_no = await this.generateDocNo();
    const pdfBuffer = await this.renderPdf(dto.sections);

    const reki = await this.siteRekiModel.create({
      project_id: dto.project_id,
      doc_no,
      sections: dto.sections,
      pdf_path: `site-rekis/${doc_no}.pdf`,
      pdf_size: pdfBuffer.length,
      created_by: userId ?? null,
    } as SiteReki);

    const attachments = await this.saveAttachments(
      reki.id,
      dto.attachments ?? [],
    );

    // Shape matches SectionForm.submit(): data.doc_no, data.pdf_size, data.id,
    // data.attachments (used to build the "· N attachment(s)" toast + nav)
    return {
      id: reki.id,
      doc_no: reki.doc_no,
      pdf_size: reki.pdf_size,
      project_id: reki.project_id,
      attachments: attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        mime: a.mime,
        size: a.size,
        remark: a.remark,
      })),
    };
  }

  async findOne(id: string) {
    const reki = await this.siteRekiModel.findByPk(id, {
      include: [
        { association: 'project' },
        { association: 'creator' },
        { association: 'attachments' },
      ],
    });
    if (!reki) {
      throw new NotFoundException('Site reki not found');
    }
    return reki;
  }

  private async saveAttachments(
    site_reki_id: string,
    attachments: NonNullable<CreateSiteRekiDto['attachments']>,
  ) {
    if (!attachments.length) {
      return [];
    }

    const records = attachments.map((a) => {
      const buffer = Buffer.from(a.content_b64, 'base64');
      if (buffer.length > MAX_ATTACHMENT_BYTES) {
        throw new BadRequestException(`${a.filename}: max 8 MB`);
      }
      return {
        site_reki_id,
        filename: a.filename,
        mime: a.mime ?? null,
        size: buffer.length,
        remark: a.remark ?? null,
        content: buffer,
      };
    });

    return this.attachmentModel.bulkCreate(records as SiteRekiAttachment[]);
  }

  private async generateDocNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.siteRekiModel.count();
    return `${REKI_DOC_PREFIX}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * TODO: replace with the real "Noto-Sans PDF with rooms table" renderer
   * referenced in SiteRekiForm's subtitle, driven by REKI_SECTIONS labels
   * (in particular a proper table for rooms_measured). Left as a plain-text
   * stub so this module compiles and returns a realistic pdf_size on its own.
   */
  private async renderPdf(
    sections: Record<string, Record<string, string>>,
  ): Promise<Buffer> {
    const content = REKI_SECTIONS.map((section) => {
      const values = sections[section.title] || {};
      const lines = section.fields
        .map((f) => `${f.label}: ${values[f.key] ?? ''}`)
        .join('\n');
      return `${section.title}\n${lines}`;
    }).join('\n\n');

    return Buffer.from(content, 'utf-8');
  }
}
