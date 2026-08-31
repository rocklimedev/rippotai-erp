import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Document } from './models/document.model';
import { DocumentType } from './models/document-type.model';
import { DocumentRequirement } from './models/document-requirement.model';
import { DocumentVersion } from './models/document-version.model';
import { DocumentAttachment } from './models/document-attachment.model';

import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { CreateDocumentAttachmentDto } from './dto/create-document-attachment.dto';

import { CdnService } from '../cdn/cdn.service';

const DOCUMENT_INCLUDES = [
  { model: DocumentType },
  { model: DocumentRequirement },
  { model: DocumentVersion },
  { model: DocumentAttachment },
];

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document)
    private readonly documentModel: typeof Document,

    @InjectModel(DocumentVersion)
    private readonly versionModel: typeof DocumentVersion,

    @InjectModel(DocumentAttachment)
    private readonly attachmentModel: typeof DocumentAttachment,

    private readonly cdnService: CdnService,
  ) {}

  // ============================================================
  // FIND DOCUMENTS
  // ============================================================

  /**
   * Get documents.
   *
   * Supports:
   *
   * findAll({})
   *
   * findAll({
   *   projectId: 'uuid'
   * })
   *
   * findAll({
   *   projectId: 'uuid',
   *   status: 'draft'
   * })
   */
  async findAll(filters: {
    projectId?: string;
    status?: string;
    category?: string;
    documentTypeId?: string;
  }): Promise<Document[]> {
    const where: Record<string, unknown> = {};

    // Only filter by project when supplied.
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.documentTypeId) {
      where.documentTypeId = filters.documentTypeId;
    }

    return this.documentModel.findAll({
      where,
      include: DOCUMENT_INCLUDES,
      order: [['created_at', 'DESC']],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string): Promise<Document> {
    const document = await this.documentModel.findByPk(id, {
      include: DOCUMENT_INCLUDES,
    });

    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return document;
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    dto: CreateDocumentDto,
    file?: Express.Multer.File,
  ): Promise<Document> {
    let fileFields: Partial<Document> = {};

    if (file) {
      const { filename, url } = await this.cdnService.uploadFile(file);

      fileFields = {
        filename: file.originalname,
        storageFilename: filename,
        url,
        mime: file.mimetype,
        size: file.size,
      };
    }

    return this.documentModel.create({
      ...dto,
      ...fileFields,
    } as any);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);

    this.assertNotLocked(document);

    await document.update({
      ...dto,
    } as any);

    return this.findOne(id);
  }

  // ============================================================
  // REPLACE FILE
  // ============================================================

  async replaceFile(id: string, file: Express.Multer.File): Promise<Document> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const document = await this.findOne(id);

    this.assertNotLocked(document);

    const previousStorageFilename = document.storageFilename;

    const { filename, url } = await this.cdnService.uploadFile(file);

    const updated = await document.update({
      filename: file.originalname,
      storageFilename: filename,
      url,
      mime: file.mimetype,
      size: file.size,
    });

    if (previousStorageFilename) {
      await this.cdnService.deleteFile(previousStorageFilename);
    }

    return updated;
  }

  // ============================================================
  // LOCK
  // ============================================================

  async lock(id: string, userId: string): Promise<Document> {
    const document = await this.findOne(id);

    if (document.isLocked && document.lockedBy !== userId) {
      throw new ForbiddenException(
        'Document is already locked by another user',
      );
    }

    return document.update({
      isLocked: true,
      lockedBy: userId,
      lockedAt: new Date(),
    });
  }

  // ============================================================
  // UNLOCK
  // ============================================================

  async unlock(id: string, userId: string): Promise<Document> {
    const document = await this.findOne(id);

    if (document.isLocked && document.lockedBy !== userId) {
      throw new ForbiddenException('Document is locked by another user');
    }

    return document.update({
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
    } as any);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);

    this.assertNotLocked(document);

    const storageFilenames = [
      document.storageFilename,

      ...document.versions.map((version) => version.storageFilename),

      ...document.attachments.map((attachment) => attachment.storageFilename),
    ].filter((name): name is string => Boolean(name));

    await document.destroy();

    await Promise.all(
      storageFilenames.map((name) => this.cdnService.deleteFile(name)),
    );
  }

  // ============================================================
  // VERSIONS
  // ============================================================

  async addVersion(
    documentId: string,
    dto: CreateDocumentVersionDto,
    file: Express.Multer.File,
  ): Promise<DocumentVersion> {
    if (!file) {
      throw new BadRequestException('A file is required to create a version');
    }

    const document = await this.findOne(documentId);

    this.assertNotLocked(document);

    const { filename, url } = await this.cdnService.uploadFile(file);

    const nextVersionLabel =
      dto.version ?? this.computeNextVersionLabel(document);

    const version = await this.versionModel.create({
      documentId,
      version: nextVersionLabel,
      filename: file.originalname,
      storageFilename: filename,
      url,
      mime: file.mimetype,
      size: file.size,
      status: dto.status ?? 'draft',
      remarks: dto.remarks,
      uploadedBy: dto.uploadedBy,
      uploadedByName: dto.uploadedByName,
    } as any);

    await document.update({
      version: nextVersionLabel,
      filename: file.originalname,
      storageFilename: filename,
      url,
      mime: file.mimetype,
      size: file.size,
      status: dto.status ?? document.status,
    } as any);

    return version;
  }

  async listVersions(documentId: string): Promise<DocumentVersion[]> {
    await this.findOne(documentId);

    return this.versionModel.findAll({
      where: { documentId },
      order: [['created_at', 'DESC']],
    });
  }

  async removeVersion(documentId: string, versionId: string): Promise<void> {
    const version = await this.versionModel.findOne({
      where: {
        id: versionId,
        documentId,
      },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${versionId} not found for document ${documentId}`,
      );
    }

    const storageFilename = version.storageFilename;

    await version.destroy();

    if (storageFilename) {
      await this.cdnService.deleteFile(storageFilename);
    }
  }

  // ============================================================
  // ATTACHMENTS
  // ============================================================

  async addAttachment(
    documentId: string,
    dto: CreateDocumentAttachmentDto,
    file: Express.Multer.File,
  ): Promise<DocumentAttachment> {
    if (!file) {
      throw new BadRequestException('A file is required for an attachment');
    }

    await this.findOne(documentId);

    const { filename, url } = await this.cdnService.uploadFile(file);

    return this.attachmentModel.create({
      documentId,
      filename: file.originalname,
      storageFilename: filename,
      url,
      mime: file.mimetype,
      size: file.size,
      remark: dto.remark,
    } as any);
  }

  async listAttachments(documentId: string): Promise<DocumentAttachment[]> {
    await this.findOne(documentId);

    return this.attachmentModel.findAll({
      where: { documentId },
      order: [['created_at', 'DESC']],
    });
  }

  async removeAttachment(
    documentId: string,
    attachmentId: string,
  ): Promise<void> {
    const attachment = await this.attachmentModel.findOne({
      where: {
        id: attachmentId,
        documentId,
      },
    });

    if (!attachment) {
      throw new NotFoundException(
        `Attachment ${attachmentId} not found for document ${documentId}`,
      );
    }

    const storageFilename = attachment.storageFilename;

    await attachment.destroy();

    if (storageFilename) {
      await this.cdnService.deleteFile(storageFilename);
    }
  }

  // ============================================================
  // DOWNLOAD
  // ============================================================

  async downloadFile(storageFilename: string): Promise<Buffer> {
    return this.cdnService.downloadFile(storageFilename);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private assertNotLocked(document: Document): void {
    if (document.isLocked) {
      throw new ForbiddenException('Document is locked and cannot be modified');
    }
  }

  private computeNextVersionLabel(document: Document): string {
    const current = document.version ?? 'V0';

    const match = /^V(\d+)$/i.exec(current);

    if (!match) {
      return 'V1';
    }

    const next = parseInt(match[1], 10) + 1;

    return `V${next}`;
  }
}
