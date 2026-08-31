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

  /**
   * GET /documents/dashboard/stats
   *
   * Overall dashboard statistics
   */
  @Get('dashboard/stats')
  getDashboardStats() {
    return this.documentsDashboardService.getDashboardStats();
  }

  /**
   * GET /documents/dashboard/recent
   * GET /documents/dashboard/recent?limit=10
   *
   * Recent documents, drawings, project briefs and site recce
   */
  @Get('dashboard/recent')
  getRecentDocuments(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 6;

    return this.documentsDashboardService.getRecentDocuments(
      Number.isFinite(parsedLimit) ? parsedLimit : 6,
    );
  }

  /**
   * GET /documents/dashboard/pending
   *
   * Pending documents, drawings and site recce
   */
  @Get('dashboard/pending')
  getPendingDocuments() {
    return this.documentsDashboardService.getPendingDocuments();
  }

  /**
   * GET /documents/dashboard/expiring-quotations
   * GET /documents/dashboard/expiring-quotations?withinDays=14
   *
   * Quotations expiring within the specified number of days
   */
  @Get('dashboard/expiring-quotations')
  getExpiringQuotations(@Query('withinDays') withinDays?: string) {
    const parsedDays = withinDays ? Number(withinDays) : 7;

    return this.documentsDashboardService.getExpiringQuotations(
      Number.isFinite(parsedDays) ? parsedDays : 7,
    );
  }

  /**
   * GET /documents/dashboard/boq-variance
   *
   * BOQ vs quotation variance
   */
  @Get('dashboard/boq-variance')
  getBoqVariance() {
    return this.documentsDashboardService.getBoqVariance();
  }

  /**
   * GET /documents/dashboard/draft-estimates
   *
   * Draft and submitted quotation/estimate counts
   */
  @Get('dashboard/draft-estimates')
  getDraftEstimates() {
    return this.documentsDashboardService.getDraftEstimates();
  }

  /**
   * GET /documents/dashboard/project-wise
   * GET /documents/dashboard/project-wise?limit=10
   *
   * Project-wise document, drawing and quotation summary
   */
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
   * Create a document with optional file upload
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
   * GET /documents?projectId=<uuid>
   *
   * Get all documents for a project
   */
  @Get()
  findAllForProject(
    @Query('projectId', ParseUUIDPipe) projectId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('documentTypeId') documentTypeId?: string,
  ) {
    return this.documentsService.findAllForProject(projectId, {
      status,
      category,
      documentTypeId,
    });
  }

  /**
   * GET /documents/:id
   *
   * Get a single document
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  /**
   * PATCH /documents/:id
   *
   * Update document details
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
   *
   * Replace the document's main file
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
   *
   * Download document file
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

  /**
   * PATCH /documents/:id/lock
   *
   * Lock document for a user
   */
  @Patch(':id/lock')
  lock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.documentsService.lock(id, userId);
  }

  /**
   * PATCH /documents/:id/unlock
   *
   * Unlock document
   */
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

  /**
   * DELETE /documents/:id
   *
   * Delete document
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }

  // ============================================================
  // DOCUMENT VERSIONS
  // ============================================================

  /**
   * POST /documents/:id/versions
   *
   * Add a new document version
   */
  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  addVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentVersionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.addVersion(id, dto, file);
  }

  /**
   * GET /documents/:id/versions
   *
   * List document versions
   */
  @Get(':id/versions')
  listVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.listVersions(id);
  }

  /**
   * DELETE /documents/:id/versions/:versionId
   *
   * Delete a document version
   */
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

  /**
   * POST /documents/:id/attachments
   *
   * Add attachment to document
   */
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentAttachmentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.addAttachment(id, dto, file);
  }

  /**
   * GET /documents/:id/attachments
   *
   * List document attachments
   */
  @Get(':id/attachments')
  listAttachments(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.listAttachments(id);
  }

  /**
   * DELETE /documents/:id/attachments/:attachmentId
   *
   * Delete document attachment
   */
  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    return this.documentsService.removeAttachment(id, attachmentId);
  }
}
