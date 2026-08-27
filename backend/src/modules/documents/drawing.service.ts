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
  ) {}

  async create(dto: CreateDrawingDto): Promise<Drawing> {
    try {
      return await this.drawingModel.create({ ...dto } as any);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Drawing number "${dto.drawingNumber}" already exists on this project`,
        );
      }
      throw error;
    }
  }

  async findAllForProject(
    projectId: string,
    filters: { discipline?: string; status?: string; phaseCode?: string },
  ): Promise<Drawing[]> {
    const where: Record<string, unknown> = { projectId };

    if (filters.discipline) where.discipline = filters.discipline;
    if (filters.status) where.status = filters.status;
    if (filters.phaseCode) where.phaseCode = filters.phaseCode;

    return this.drawingModel.findAll({
      where,
      include: DRAWING_INCLUDES,
      order: [
        ['sequence', 'ASC'],
        ['createdAt', 'DESC'],
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
    const { filename, url } = await this.cdnService.uploadFile(file);

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
      status: dto.status ?? drawing.status,
      issuePurpose: dto.issuePurpose ?? drawing.issuePurpose,
    } as any);

    return revision;
  }

  async listRevisions(drawingId: string): Promise<DrawingRevision[]> {
    await this.findOne(drawingId);

    return this.revisionModel.findAll({
      where: { drawingId },
      order: [['createdAt', 'DESC']],
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

  // ---- Helpers ----

  private computeNextRevisionLabel(drawing: Drawing): string {
    const revisions = drawing.revisions ?? [];

    if (revisions.length === 0) {
      return 'A';
    }

    const letters = revisions
      .map((r) => r.revision)
      .filter((label) => /^[A-Z]$/.test(label))
      .sort();

    const last = letters[letters.length - 1];

    if (!last) {
      return `Rev-${revisions.length + 1}`;
    }

    const nextCharCode = last.charCodeAt(0) + 1;
    return String.fromCharCode(nextCharCode);
  }
}
