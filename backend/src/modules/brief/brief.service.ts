// brief.service.ts
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

  // NEW: list endpoint backing ProjectBriefList.jsx / useGetProjectBriefsQuery.
  // Optional project_id filter, most recent first.
  async findAll(filters: { project_id?: string } = {}) {
    const where: Record<string, unknown> = {};
    if (filters.project_id) where.project_id = filters.project_id;

    const briefs = await this.projectBriefModel.findAll({
      where,
      include: [{ association: 'project' }, { association: 'creator' }],
      order: [['createdAt', 'DESC']],
    });

    // Reshaped to match what the list page reads: project_name, sections
    // length, createdByName, createdAt/updatedAt — same spirit as create()
    // reshaping its return value for the frontend that consumes it.
    return briefs.map((b) => ({
      id: b.id,
      doc_no: b.doc_no,
      project_id: b.project_id,
      project_name: b.project?.name ?? null,
      sections: b.sections,
      createdByName: b.creator?.name ?? null,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
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
