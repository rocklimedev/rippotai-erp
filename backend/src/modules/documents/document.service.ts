import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Document, DocumentCategory } from './models/document.model';
import { DocumentAttachment } from './models/document-attachment.model';
import { Project } from '@/modules/projects/models/projects.model';
import { CdnService } from '@/modules/cdn/cdn.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SectionFormDto } from './dto/section-form.dto';
import { User } from '@/modules/users/models/user.model';

export const CATEGORIES: DocumentCategory[] = [
  'Agreements',
  'Pitch',
  'Scope of Work',
  'Time and Cost',
  'Project Brief',
  'Site Reki',
  'BOQs',
  'Quotations',
  'Drawings',
  'GFC Drawings',
  '3D Views',
  'Approvals',
  'Other',
  'Handover Documents',
];

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document) private readonly documentModel: typeof Document,
    @InjectModel(DocumentAttachment)
    private readonly attachmentModel: typeof DocumentAttachment,
    private readonly cdnService: CdnService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  /* ---------------------------------------------------------------- */
  /* All Documents / list + filters                                    */
  /* ---------------------------------------------------------------- */

  async findAll(query: { q?: string; category?: string; project_id?: string }) {
    const where: Record<string, any> = {};
    if (query.q) where.title = { [Op.like]: `%${query.q}%` };
    if (query.category) where.category = query.category;
    if (query.project_id) where.projectId = query.project_id;

    const rows = await this.documentModel.findAll({
      where,
      include: [{ model: Project, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    // Flatten project_name onto each row for the frontend's grouping logic.
    return rows.map((r) => ({
      ...r.toJSON(),
      project_name: (r as any).project?.name || null,
    }));
  }

  private async getOrThrow(id: string): Promise<Document> {
    const doc = await this.documentModel.findByPk(id, {
      include: [
        { model: Project, attributes: ['id', 'name'] },
        DocumentAttachment,
      ],
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  /* ---------------------------------------------------------------- */
  /* Upload / Edit / Replace / Delete                                   */
  /* ---------------------------------------------------------------- */

  async create(
    dto: CreateDocumentDto,
    file: Express.Multer.File,
    user?: User,
    transaction?: Transaction,
  ) {
    if (!file) throw new BadRequestException('file is required');

    const { filename: storageFilename, url } =
      await this.cdnService.uploadFile(file);

    return this.documentModel.create(
      {
        projectId: dto.project_id,
        category: dto.category as DocumentCategory,
        title: dto.title,
        visibility: dto.visibility || 'internal',
        remarks: dto.remarks || null,
        filename: file.originalname,
        storageFilename,
        url,
        mime: file.mimetype,
        size: file.size,
        version: 'V1',
        status: 'draft',
        docType: 'upload',
        sourceApp: 'Manual Upload',
        documentDate: new Date().toISOString().slice(0, 10),
        uploadedBy: user?.id || null,
        uploadedByName: user?.name || null,
      } as any,
      {
        transaction,
      },
    );
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const doc = await this.getOrThrow(id);
    if (doc.isLocked) {
      throw new ForbiddenException('Document is approved — unapprove to edit.');
    }
    await doc.update({
      title: dto.title ?? doc.title,
      category: (dto.category as DocumentCategory) ?? doc.category,
      remarks: dto.remarks ?? doc.remarks,
      projectId:
        dto.project_id === '' ? null : (dto.project_id ?? doc.projectId),
    });
    return doc;
  }

  async replaceFile(id: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    const doc = await this.getOrThrow(id);
    if (doc.isLocked) {
      throw new ForbiddenException('Document is approved — unapprove to edit.');
    }

    const oldStorageFilename = doc.storageFilename;
    const { filename: storageFilename, url } =
      await this.cdnService.uploadFile(file);

    const nextVersionNumber =
      Number((doc.version || 'V1').replace(/\D/g, '') || '1') + 1;

    await doc.update({
      filename: file.originalname,
      storageFilename,
      url,
      mime: file.mimetype,
      size: file.size,
      version: `V${nextVersionNumber}`,
    });

    if (oldStorageFilename) {
      await this.cdnService.deleteFile(oldStorageFilename);
    }
    return doc;
  }

  async remove(id: string) {
    const doc = await this.getOrThrow(id);
    if (doc.isLocked) {
      throw new ForbiddenException(
        'Document is approved — unapprove to delete.',
      );
    }
    if (doc.storageFilename) {
      await this.cdnService.deleteFile(doc.storageFilename);
    }
    for (const att of doc.attachments || []) {
      if (att.storageFilename)
        await this.cdnService.deleteFile(att.storageFilename);
    }
    await doc.destroy();
    return { deleted: true };
  }

  async lock(id: string, user?: User) {
    const doc = await this.getOrThrow(id);
    await doc.update({
      isLocked: true,
      lockedBy: user?.name || user?.id || 'admin',
      lockedAt: new Date(),
      status: 'approved',
    });
    return doc;
  }

  async unlock(id: string) {
    const doc = await this.getOrThrow(id);
    await doc.update({ isLocked: false, lockedBy: null, lockedAt: null });
    return doc;
  }

  /* ---------------------------------------------------------------- */
  /* Download (proxied through the API so the JWT-protected route      */
  /* never exposes the CDN's public URL/credentials directly)          */
  /* ---------------------------------------------------------------- */

  async download(id: string) {
    const doc = await this.getOrThrow(id);
    if (!doc.storageFilename) throw new NotFoundException('File not stored');
    const buffer = await this.cdnService.downloadFile(doc.storageFilename);
    return {
      buffer,
      mime: doc.mime || 'application/octet-stream',
      filename: doc.filename || `document-${doc.id}`,
    };
  }

  async downloadAttachment(documentId: string, attachmentId: string) {
    const att = await this.attachmentModel.findOne({
      where: { id: attachmentId, documentId },
    });
    if (!att || !att.storageFilename)
      throw new NotFoundException('Attachment not found');
    const buffer = await this.cdnService.downloadFile(att.storageFilename);
    return {
      buffer,
      mime: att.mime || 'application/octet-stream',
      filename: att.filename,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Project Documents workspace                                        */
  /* ---------------------------------------------------------------- */

  async getWorkspace(projectId: string) {
    const rows = await this.documentModel.findAll({
      where: { projectId },
      order: [['createdAt', 'DESC']],
    });
    const categories: Record<string, any[]> = {};
    for (const cat of CATEGORIES) categories[cat] = [];
    for (const r of rows) {
      const bucket = categories[r.category] || (categories[r.category] = []);
      bucket.push({
        id: r.id,
        title: r.title,
        filename: r.filename,
        source_app: r.sourceApp || 'Manual Upload',
        version: r.version,
        created_at: r.get('createdAt'),
      });
    }
    return { categories };
  }

  /* ---------------------------------------------------------------- */
  /* Project Brief / Site Reki generated forms                         */
  /* ---------------------------------------------------------------- */

  private async generateDocNo(prefix: string) {
    const year = new Date().getFullYear();
    const count = await this.documentModel.count({
      where: { docType: prefix === 'PB' ? 'project_brief' : 'site_reki' },
    });
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async createProjectBrief(dto: SectionFormDto, project: Project, user?: User) {
    const docNo = await this.generateDocNo('PB');
    const pdfBuffer = await this.pdfGenerator.renderSectionsPdf({
      docTitle: 'Project Brief',
      docNo,
      projectName: project.name,
      sections: dto.sections,
    });
    const { filename: storageFilename, url } =
      await this.cdnService.uploadBuffer(pdfBuffer, `${docNo}.pdf`);

    const doc = await this.documentModel.create({
      projectId: dto.project_id,
      category: 'Project Brief',
      title: `Project Brief — ${docNo}`,
      filename: `${docNo}.pdf`,
      storageFilename,
      url,
      mime: 'application/pdf',
      size: pdfBuffer.length,
      docType: 'project_brief',
      docNo,
      sections: dto.sections,
      sourceApp: 'Project Brief Form',
      documentDate: new Date().toISOString().slice(0, 10),
      uploadedBy: user?.id || null,
      uploadedByName: user?.name || null,
    } as any);

    return { id: doc.id, doc_no: docNo, pdf_size: pdfBuffer.length };
  }

  async createSiteReki(dto: SectionFormDto, project: Project, user?: User) {
    const docNo = await this.generateDocNo('SR');

    const attachmentsSummary = (dto.attachments || []).map((a) => ({
      filename: a.filename,
      remark: a.remark,
    }));

    const pdfBuffer = await this.pdfGenerator.renderSectionsPdf({
      docTitle: 'Site Reki',
      docNo,
      projectName: project.name,
      sections: dto.sections,
      attachmentsSummary,
    });
    const { filename: storageFilename, url } =
      await this.cdnService.uploadBuffer(pdfBuffer, `${docNo}.pdf`);

    const doc = await this.documentModel.create({
      projectId: dto.project_id,
      category: 'Site Reki',
      title: `Site Reki — ${docNo}`,
      filename: `${docNo}.pdf`,
      storageFilename,
      url,
      mime: 'application/pdf',
      size: pdfBuffer.length,
      docType: 'site_reki',
      docNo,
      sections: dto.sections,
      sourceApp: 'Site Reki Form',
      documentDate: new Date().toISOString().slice(0, 10),
      uploadedBy: user?.id || null,
      uploadedByName: user?.name || null,
    } as any);

    for (const a of dto.attachments || []) {
      const buffer = Buffer.from(a.content_b64, 'base64');
      const { filename: storageFilename, url } =
        await this.cdnService.uploadBuffer(buffer, a.filename);
      await this.attachmentModel.create({
        documentId: doc.id,
        filename: a.filename,
        storageFilename,
        url,
        mime: a.mime || null,
        size: buffer.length,
        remark: a.remark || null,
      } as any);
    }

    return {
      id: doc.id,
      doc_no: docNo,
      pdf_size: pdfBuffer.length,
      attachments: dto.attachments || [],
    };
  }

  async getReki(id: string) {
    const doc = await this.documentModel.findByPk(id, {
      include: [DocumentAttachment],
    });
    if (!doc) throw new NotFoundException('Site Reki not found');
    return doc;
  }
}
