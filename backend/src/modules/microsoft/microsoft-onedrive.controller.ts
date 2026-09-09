// microsoft/services/microsoft-onedrive.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';

import { MicrosoftOneDriveService } from './microsoft-onedrive.service';

@Controller('onedrive')
@UseGuards(JwtAuthGuard)
export class MicrosoftOneDriveController {
  constructor(private readonly oneDriveService: MicrosoftOneDriveService) {}

  // ============================================================
  // CENTRAL DRIVE
  // ============================================================

  @Get()
  async getDrive(@Req() req: RequestWithUser) {
    return this.oneDriveService.getDrive(req.user.id);
  }

  // ============================================================
  // ROOT
  // ============================================================

  @Get('root')
  async getRoot(@Req() req: RequestWithUser) {
    return this.oneDriveService.getRoot(req.user.id);
  }

  // ============================================================
  // LIST FILES
  // ============================================================

  @Get('files')
  async listFiles(
    @Req() req: RequestWithUser,

    @Query('folderPath')
    folderPath?: string,
  ) {
    return this.oneDriveService.listFiles(req.user.id, folderPath || 'root');
  }

  // ============================================================
  // SEARCH
  // ============================================================

  @Get('search')
  async search(
    @Req() req: RequestWithUser,

    @Query('q')
    query?: string,
  ) {
    if (!query?.trim()) {
      throw new BadRequestException('Search query is required');
    }

    return this.oneDriveService.search(req.user.id, query);
  }

  // ============================================================
  // FILE METADATA
  // ============================================================

  @Get('files/:itemId')
  async getFileMetadata(
    @Req() req: RequestWithUser,

    @Param('itemId')
    itemId: string,
  ) {
    if (!itemId) {
      throw new BadRequestException('File ID is required');
    }

    return this.oneDriveService.getFileMetadata(req.user.id, itemId);
  }

  // ============================================================
  // DOWNLOAD
  // ============================================================

  @Get('files/:itemId/download')
  async downloadFile(
    @Req() req: RequestWithUser,

    @Param('itemId')
    itemId: string,

    @Res()
    res: Response,
  ) {
    if (!itemId) {
      throw new BadRequestException('File ID is required');
    }

    const content = await this.oneDriveService.downloadFile(
      req.user.id,
      itemId,
    );

    const metadata = await this.oneDriveService.getFileMetadata(
      req.user.id,
      itemId,
    );

    const fileName = metadata?.name || 'download';

    const contentType = metadata?.file?.mimeType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.sanitizeFileName(fileName)}"`,
    );

    res.setHeader('Content-Length', content.length);

    return res.send(content);
  }

  // ============================================================
  // UPLOAD SMALL
  // ============================================================

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: RequestWithUser,

    @UploadedFile()
    file: Express.Multer.File,

    @Query('folderPath')
    folderPath?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size === 0) {
      throw new BadRequestException('Cannot upload an empty file');
    }

    const result = await this.oneDriveService.uploadFile(
      req.user.id,

      folderPath || 'root',

      file.originalname,

      file.buffer,

      file.mimetype || 'application/octet-stream',
    );

    return {
      success: true,
      file: result,
    };
  }

  // ============================================================
  // UPLOAD LARGE
  // ============================================================

  @Post('upload-large')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLargeFile(
    @Req() req: RequestWithUser,

    @UploadedFile()
    file: Express.Multer.File,

    @Query('folderPath')
    folderPath?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size === 0) {
      throw new BadRequestException('Cannot upload an empty file');
    }

    const result = await this.oneDriveService.uploadLargeFile(
      req.user.id,

      folderPath || 'root',

      file.originalname,

      file.buffer,

      file.mimetype || 'application/octet-stream',
    );

    return {
      success: true,
      file: result,
    };
  }

  // ============================================================
  // CREATE FOLDER
  // ============================================================

  @Post('folders')
  async createFolder(
    @Req() req: RequestWithUser,

    @Query('parentPath')
    parentPath?: string,

    @Query('folderName')
    folderName?: string,
  ) {
    if (!folderName?.trim()) {
      throw new BadRequestException('Folder name is required');
    }

    return this.oneDriveService.createFolder(
      req.user.id,

      parentPath || 'root',

      folderName.trim(),
    );
  }

  // ============================================================
  // RENAME
  // ============================================================

  @Patch('files/:itemId')
  async renameFile(
    @Req() req: RequestWithUser,

    @Param('itemId')
    itemId: string,

    @Query('name')
    name?: string,
  ) {
    if (!itemId) {
      throw new BadRequestException('File ID is required');
    }

    if (!name?.trim()) {
      throw new BadRequestException('Name is required');
    }

    return this.oneDriveService.renameFile(req.user.id, itemId, name.trim());
  }

  // ============================================================
  // MOVE
  // ============================================================

  @Patch('files/:itemId/move')
  async moveFile(
    @Req() req: RequestWithUser,

    @Param('itemId')
    itemId: string,

    @Query('parentId')
    parentId?: string,
  ) {
    if (!itemId) {
      throw new BadRequestException('File ID is required');
    }

    if (!parentId) {
      throw new BadRequestException('Destination folder ID is required');
    }

    return this.oneDriveService.moveFile(req.user.id, itemId, parentId);
  }

  // ============================================================
  // DELETE
  // ============================================================

  @Delete('files/:itemId')
  async deleteFile(
    @Req() req: RequestWithUser,

    @Param('itemId')
    itemId: string,
  ) {
    if (!itemId) {
      throw new BadRequestException('File ID is required');
    }

    await this.oneDriveService.deleteFile(req.user.id, itemId);

    return {
      success: true,
      deleted: true,
      itemId,
    };
  }

  // ============================================================
  // HELPER
  // ============================================================

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[\r\n"]/g, '').replace(/[\\/:*?<>|]/g, '_');
  }
}
