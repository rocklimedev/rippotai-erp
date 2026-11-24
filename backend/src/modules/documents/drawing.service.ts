import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { Drawing } from './models/drawing.model';
import { DrawingRevision } from './models/drawing-revision.model';
import { DocumentType } from '../documents/models/document-type.model';
import { DocumentRequirement } from '../documents/models/document-requirement.model';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { UpdateDrawingDto } from './dto/update-drawing.dto';
import { CreateDrawingRevisionDto } from './dto/create-drawing-revision.dto';
import { CdnService } from '../cdn/cdn.service';
import { GateEngineService } from '../gates/gate-engine.service';

import { buildDocketPdf, docketEntries } from './drawing-docket';

const DRAWING_INCLUDES = [
  { model: DocumentType },
  { model: DocumentRequirement },
  { model: DrawingRevision },
];

@Injectable()
export class DrawingsService {
  constructor(
    @InjectModel(Drawing)
    private readonly drawingModel: typeof Drawing,
    @InjectModel(DrawingRevision)
    private readonly revisionModel: typeof DrawingRevision,
    private readonly cdnService: CdnService,
    @InjectModel(DocumentType)
    private readonly documentTypeModel: typeof DocumentType,
    @InjectModel(DocumentRequirement)
    private readonly requirementModel: typeof DocumentRequirement,
    private readonly gateEngine: GateEngineService,
  ) {}

  async create(dto: CreateDrawingDto): Promise<Drawing> {
    let requirementId = dto.requirementId;
    if (dto.documentTypeId) {
      const type = await this.documentTypeModel.findByPk(dto.documentTypeId);
      if (!type) throw new NotFoundException('Drawing document type not found');
      if (type.targetType !== 'DRAWING') {
        throw new BadRequestException('Select a drawing checklist type');
      }
      const [requirement] = await this.requirementModel.findOrCreate({
        where: { projectId: dto.projectId, documentTypeId: dto.documentTypeId },
        defaults: { projectId: dto.projectId, documentTypeId: dto.documentTypeId, requirementType: type.requirementType } as any,
      });
      if (requirementId && requirementId !== requirement.id) {
        throw new BadRequestException('Requirement does not match the selected project and drawing type');
      }
      requirementId = requirement.id;
    }
    try {
      return await this.drawingModel.create({ ...dto, requirementId } as any);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Drawing number "${dto.drawingNumber}" already exists on this project`,
        );
      }
      throw error;
    }
  }

  async findAll(
    projectId: string | undefined,
    filters: { discipline?: string; status?: string; phaseCode?: string },
  ): Promise<Drawing[]> {
    const where: Record<string, unknown> = {};

    if (projectId) where.projectId = projectId;
    if (filters.discipline) where.discipline = filters.discipline;
    if (filters.status) where.status = filters.status;
    if (filters.phaseCode) where.phaseCode = filters.phaseCode;

    return this.drawingModel.findAll({
      where,
      include: DRAWING_INCLUDES,
      order: [
        ['sequence', 'ASC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  async findOne(id: string): Promise<Drawing> {
    const drawing = await this.drawingModel.findByPk(id, {
      include: DRAWING_INCLUDES,
    });

    if (!drawing) {
      throw new NotFoundException(`Drawing ${id} not found`);
    }

    return drawing;
  }

  async update(id: string, dto: UpdateDrawingDto): Promise<Drawing> {
    const drawing = await this.findOne(id);

    try {
      return await drawing.update({ ...dto } as any);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Drawing number "${dto.drawingNumber}" already exists on this project`,
        );
      }
      throw error;
    }
  }

  async approveUploaded(id: string, approvedBy: string): Promise<Drawing> {
    const drawing = await this.findOne(id);
    if (drawing.status === 'Superseded') {
      throw new BadRequestException('Superseded drawings cannot be approved');
    }
    const revision = await this.revisionModel.findOne({
      where: { drawingId: id }, order: [['created_at', 'DESC'], ['id', 'DESC']],
    });
    if (!revision || (!revision.storageFilename && !revision.url)) {
      throw new BadRequestException('Upload a revision file before approving this drawing');
    }
    await revision.update({ status: 'Approved' });
    await drawing.update({ status: 'Approved', approvedBy });
    if (drawing.requirementId && drawing.documentTypeId) {
      const sheets = await this.drawingModel.findAll({
        where: { projectId: drawing.projectId, documentTypeId: drawing.documentTypeId },
        attributes: ['status'],
      });
      const current = sheets.filter((sheet) => sheet.status !== 'Superseded');
      const completed = current.length > 0 && current.every((sheet) => sheet.status === 'Approved');
      const requirement = await this.requirementModel.findByPk(drawing.requirementId);
      await requirement?.update({ isCompleted: completed, completedAt: completed ? new Date() : null });
    }
    await this.gateEngine.invalidateReadinessCache(drawing.projectId);
    return drawing;
  }

  async remove(id: string): Promise<void> {
    const drawing = await this.findOne(id);

    const storageFilenames = drawing.revisions
      .map((r) => r.storageFilename)
      .filter((name): name is string => Boolean(name));

    await drawing.destroy();

    await Promise.all(
      storageFilenames.map((name) => this.cdnService.deleteFile(name)),
    );
  }

  // ---- Revisions ----

  async addRevision(
    drawingId: string,
    dto: CreateDrawingRevisionDto,
    file: Express.Multer.File,
  ): Promise<DrawingRevision> {
    if (!file) {
      throw new BadRequestException('A file is required to create a revision');
    }

    const drawing = await this.findOne(drawingId);

    const revisionLabel =
      dto.revision ?? this.computeNextRevisionLabel(drawing);
    const { filename, url } = await this.cdnService.uploadFile(
      file,
      'drawings',
    );

    let revision: DrawingRevision;

    try {
      revision = await this.revisionModel.create({
        drawingId,
        revision: revisionLabel,
        issueDate: dto.issueDate ?? new Date().toISOString().slice(0, 10),
        issuePurpose: dto.issuePurpose,
        status: dto.status ?? 'Draft',
        filename: file.originalname,
        storageFilename: filename,
        url,
        mime: file.mimetype,
        size: file.size,
        remarks: dto.remarks,
        uploadedBy: dto.uploadedBy,
        uploadedByName: dto.uploadedByName,
      } as any);
    } catch (error) {
      await this.cdnService.deleteFile(filename);

      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Revision "${revisionLabel}" already exists for this drawing`,
        );
      }
      throw error;
    }

    // Keep the drawing's headline status/purpose in sync with its latest revision.
    await drawing.update({
      status: dto.status ?? 'Draft',
      approvedBy: null,
      issuePurpose: dto.issuePurpose ?? drawing.issuePurpose,
    } as any);
    if (drawing.requirementId && dto.status !== 'Approved') {
      const requirement = await this.requirementModel.findByPk(drawing.requirementId);
      await requirement?.update({ isCompleted: false, completedAt: null });
    }
    await this.gateEngine.invalidateReadinessCache(drawing.projectId);

    return revision;
  }

  async listRevisions(drawingId: string): Promise<DrawingRevision[]> {
    await this.findOne(drawingId);

    return this.revisionModel.findAll({
      where: { drawingId },
      order: [['created_at', 'DESC']],
    });
  }

  async removeRevision(drawingId: string, revisionId: string): Promise<void> {
    const revision = await this.revisionModel.findOne({
      where: { id: revisionId, drawingId },
    });

    if (!revision) {
      throw new NotFoundException(
        `Revision ${revisionId} not found for drawing ${drawingId}`,
      );
    }

    const storageFilename = revision.storageFilename;
    await revision.destroy();

    if (storageFilename) {
      await this.cdnService.deleteFile(storageFilename);
    }
  }

  async downloadFile(storageFilename: string): Promise<Buffer> {
    return this.cdnService.downloadFile(storageFilename);
  }

  async streamFile(
    storageFilename: string,
    destination: import('stream').Writable,
  ) {
    return this.cdnService.streamFile(storageFilename, destination);
  }

  // ---- Helpers ----

  /**
   * Drawing versions: the first upload is V0, then V1, V2…
   * Older drawings that used letters (A, B…) keep counting in letters.
   */
  /** One PDF with the latest version of every drawing of a project's trade (drawing category). */
  async buildDocket(projectId: string, documentTypeId: string) {
    const drawings = await this.drawingModel.findAll({
      where: { projectId, documentTypeId },
      include: DRAWING_INCLUDES,
    });
    const entries = docketEntries(drawings.map((d) => d.get({ plain: true }) as any));
    if (!entries.length) throw new NotFoundException('No uploaded drawings in this category yet');
    const type = await this.documentTypeModel.findByPk(documentTypeId);
    const [rows] = await this.drawingModel.sequelize!.query('SELECT name FROM projects WHERE id = :id', {
      replacements: { id: projectId },
    });
    const project = String((rows as any[])[0]?.name || 'Project');
    const trade = String(type?.name || 'Drawings');
    const bytes = await buildDocketPdf(entries, { project, trade }, (f) => this.cdnService.downloadFile(f));
    const filename = `${trade}-docket-${project}`.replace(/[^\w-]+/g, '-').replace(/-+/g, '-') + '.pdf';
    return { buffer: Buffer.from(bytes), filename, count: entries.length };
  }

  private computeNextRevisionLabel(drawing: Drawing): string {
    const labels = (drawing.revisions ?? []).map((r) => String(r.revision || ''));
    if (labels.length === 0) return 'V0';
    const numbered = labels
      .map((l) => /^V(\d+)$/i.exec(l))
      .filter(Boolean)
      .map((m) => Number(m![1]));
    if (numbered.length) return `V${Math.max(...numbered) + 1}`;
    const letters = labels.filter((l) => /^[A-Y]$/.test(l)).sort();
    const last = letters[letters.length - 1];
    if (last) return String.fromCharCode(last.charCodeAt(0) + 1);
    return `V${labels.length}`;
  }

}
