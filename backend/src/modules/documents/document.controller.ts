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
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { CreateDocumentAttachmentDto } from './dto/create-document-attachment.dto';

const FILE_UPLOAD_OPTIONS = {
  storage: memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
};

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  create(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.documentsService.create(dto, file);
  }

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

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @Post(':id/file')
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  replaceFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.replaceFile(id, file);
  }

  @Get(':id/download')
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const document = await this.documentsService.findOne(id);

    if (!document.storageFilename) {
      return res.status(404).send({ message: 'No file on this document' });
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

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }

  // ---- Versions ----

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

  // ---- Attachments ----

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
