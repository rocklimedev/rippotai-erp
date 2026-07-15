import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectBrief } from './models/project-brief.model';
import { CreateProjectBriefDto } from './dto/create-project-brief.dto';
import {
  BRIEF_SECTIONS,
  BRIEF_DOC_PREFIX,
} from '@/common/constants/document-sections.constants';

@Injectable()
export class BriefService {
  constructor(
    @InjectModel(ProjectBrief)
    private readonly projectBriefModel: typeof ProjectBrief,
  ) {}

  async create(dto: CreateProjectBriefDto, userId?: string) {
    const doc_no = await this.generateDocNo();
    const pdfBuffer = await this.renderPdf(dto.sections);

    const brief = await this.projectBriefModel.create({
      project_id: dto.project_id,
      doc_no,
      sections: dto.sections,
      pdf_path: `briefs/${doc_no}.pdf`,
      pdf_size: pdfBuffer.length,
      created_by: userId ?? null,
    } as ProjectBrief);

    // Shape matches what the frontend SectionForm.submit() expects back:
    // data.doc_no, data.pdf_size, data.id
    return {
      id: brief.id,
      doc_no: brief.doc_no,
      pdf_size: brief.pdf_size,
      project_id: brief.project_id,
    };
  }

  async findOne(id: string) {
    const brief = await this.projectBriefModel.findByPk(id, {
      include: [{ association: 'project' }, { association: 'creator' }],
    });
    if (!brief) {
      throw new NotFoundException('Project brief not found');
    }
    return brief;
  }

  private async generateDocNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.projectBriefModel.count();
    return `${BRIEF_DOC_PREFIX}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * TODO: replace with a real PDF rendering pipeline (e.g. Puppeteer/PDFKit
   * against a template) driven by BRIEF_SECTIONS labels. Left as a plain-text
   * stub so this module compiles and returns a realistic pdf_size on its own.
   */
  private async renderPdf(
    sections: Record<string, Record<string, string>>,
  ): Promise<Buffer> {
    const content = BRIEF_SECTIONS.map((section) => {
      const values = sections[section.title] || {};
      const lines = section.fields
        .map((f) => `${f.label}: ${values[f.key] ?? ''}`)
        .join('\n');
      return `${section.title}\n${lines}`;
    }).join('\n\n');

    return Buffer.from(content, 'utf-8');
  }
}
