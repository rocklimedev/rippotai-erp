import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';

import { DocumentsService } from './document.service';
import { DocumentsDashboardService } from './documents-dashboard.service';

import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { CreateDocumentAttachmentDto } from './dto/create-document-attachment.dto';

const FILE_UPLOAD_OPTIONS = {
  storage: memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
};

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentsDashboardService: DocumentsDashboardService,
  ) {}

  // ============================================================
  // DOCUMENT DASHBOARD
  // ============================================================

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.documentsDashboardService.getDashboardStats();
  }

  @Get('dashboard/recent')
  getRecentDocuments(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 6;

    return this.documentsDashboardService.getRecentDocuments(
      Number.isFinite(parsedLimit) ? parsedLimit : 6,
    );
  }

  @Get('dashboard/pending')
  getPendingDocuments() {
    return this.documentsDashboardService.getPendingDocuments();
  }

  @Get('dashboard/expiring-quotations')
  getExpiringQuotations(@Query('withinDays') withinDays?: string) {
    const parsedDays = withinDays ? Number(withinDays) : 7;

    return this.documentsDashboardService.getExpiringQuotations(
      Number.isFinite(parsedDays) ? parsedDays : 7,
    );
  }

  @Get('dashboard/boq-variance')
  getBoqVariance() {
    return this.documentsDashboardService.getBoqVariance();
  }

  @Get('dashboard/draft-estimates')
  getDraftEstimates() {
    return this.documentsDashboardService.getDraftEstimates();
  }

  @Get('dashboard/project-wise')
  getProjectWiseDocuments(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 5;

    return this.documentsDashboardService.getProjectWiseDocuments(
      Number.isFinite(parsedLimit) ? parsedLimit : 5,
    );
  }

  // ============================================================
  // DOCUMENTS
  // ============================================================

  /**
   * POST /documents
   *
   * Create a document with optional file upload.
   */
  @Post()
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  create(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.create(dto, file);
  }

  /**
   * GET /documents
   *
   * Get all documents.
   *
   * Optional:
   * ?projectId=<uuid>
   * ?status=<status>
   * ?category=<category>
   * ?documentTypeId=<uuid>
   *
   * Examples:
   *
   * GET /documents
   * GET /documents?projectId=<uuid>
   * GET /documents?documentTypeId=<uuid>
   */
  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('documentTypeId') documentTypeId?: string,
  ) {
    return this.documentsService.findAll({
      projectId,
      status,
      category,
      documentTypeId,
    });
  }

  /**
   * GET /documents/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  /**
   * PATCH /documents/:id
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  /**
   * POST /documents/:id/file
   */
  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  replaceFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.replaceFile(id, file);
  }

  /**
   * GET /documents/:id/download
   */
  @Get(':id/download')
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const document = await this.documentsService.findOne(id);

    if (!document.storageFilename) {
      return res.status(404).send({
        message: 'No file on this document',
      });
    }

    const buffer = await this.documentsService.downloadFile(
      document.storageFilename,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.filename ?? document.storageFilename}"`,
    );

    res.setHeader('Content-Type', document.mime ?? 'application/octet-stream');

    res.send(buffer);
  }

  // ============================================================
  // DOCUMENT LOCKING
  // ============================================================

  @Patch(':id/lock')
  lock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.documentsService.lock(id, userId);
  }

  @Patch(':id/unlock')
  unlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.documentsService.unlock(id, userId);
  }

  // ============================================================
  // DELETE DOCUMENT
  // ============================================================

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }

  // ============================================================
  // DOCUMENT VERSIONS
  // ============================================================

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentVersionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.addVersion(id, dto, file);
  }

  @Get(':id/versions')
  listVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.listVersions(id);
  }

  @Delete(':id/versions/:versionId')
  removeVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.documentsService.removeVersion(id, versionId);
  }

  // ============================================================
  // DOCUMENT ATTACHMENTS
  // ============================================================

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentAttachmentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.addAttachment(id, dto, file);
  }

  @Get(':id/attachments')
  listAttachments(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.listAttachments(id);
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.documentsService.removeAttachment(id, attachmentId);
  }
}
