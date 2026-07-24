import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectBrief } from './models/project-brief.model';
import { CreateProjectBriefDto } from './dto/create-project-brief.dto';
import {
  BRIEF_SECTIONS,
  BRIEF_DOC_PREFIX,
} from '@/common/constants/document-sections.constants';
import { ActivityLogForBriefService } from '../engagement/services/activity-log-brief.service';
import { NotificationForBriefService } from '../engagement/services/notification-brief.service';

@Injectable()
export class BriefService {
  constructor(
    @InjectModel(ProjectBrief)
    private readonly projectBriefModel: typeof ProjectBrief,

    private readonly activityLogService: ActivityLogForBriefService,
    private readonly notificationService: NotificationForBriefService,
  ) {}

  /**
   * Create a new project brief with activity log and notification
   */
  async create(dto: CreateProjectBriefDto, user?: any) {
    const doc_no = await this.generateDocNo();
    const pdfBuffer = await this.renderPdf(dto.sections);

    const brief = await this.projectBriefModel.create({
      project_id: dto.project_id,
      doc_no,
      sections: dto.sections,
      pdf_path: `briefs/${doc_no}.pdf`,
      pdf_size: pdfBuffer.length,
      created_by: user?.id ?? null,
    } as ProjectBrief);

    // Log activity and send notifications
    await this.activityLogService.logBriefCreated(brief, user);
    await this.notificationService.notifyBriefCreated(brief, user?.id);

    // Return shape expected by frontend
    return {
      id: brief.id,
      doc_no: brief.doc_no,
      pdf_size: brief.pdf_size,
      project_id: brief.project_id,
    };
  }

  /**
   * List all briefs (with optional project filter)
   */
  async findAll(filters: { project_id?: string } = {}) {
    const where: Record<string, unknown> = {};
    if (filters.project_id) where.project_id = filters.project_id;

    const briefs = await this.projectBriefModel.findAll({
      where,
      include: [{ association: 'project' }, { association: 'creator' }],
      order: [['createdAt', 'DESC']],
    });

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

  /**
   * Get single brief by ID
   */
  async findOne(id: string) {
    const brief = await this.projectBriefModel.findByPk(id, {
      include: [{ association: 'project' }, { association: 'creator' }],
    });

    if (!brief) {
      throw new NotFoundException('Project brief not found');
    }

    return brief;
  }

  /**
   * Generate unique document number (e.g., BRF-2026-0001)
   */
  private async generateDocNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.projectBriefModel.count();
    return `${BRIEF_DOC_PREFIX}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Render PDF (placeholder - replace with real PDF generation later)
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
