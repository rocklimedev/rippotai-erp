// microsoft/services/microsoft-onedrive.controller.ts

import {
  Controller,
  Get,
  Post,
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
  // GET DRIVE
  // ============================================================

  /**
   * Get the currently connected user's OneDrive information.
   *
   * GET /onedrive
   */
  @Get()
  async getDrive(@Req() req: RequestWithUser) {
    return this.oneDriveService.getDrive(req.user.id);
  }

  // ============================================================
  // LIST FILES
  // ============================================================

  /**
   * List files/folders.
   *
   * GET /onedrive/files
   *
   * Root:
   * GET /onedrive/files
   *
   * Folder:
   * GET /onedrive/files?folderPath=Documents
   *
   * Nested folder:
   * GET /onedrive/files?folderPath=Documents/Projects
   */
  @Get('files')
  async listFiles(
    @Req() req: RequestWithUser,
    @Query('folderPath') folderPath?: string,
  ) {
    return this.oneDriveService.listFiles(req.user.id, folderPath || 'root');
  }

  // ============================================================
  // FILE METADATA
  // ============================================================

  /**
   * Get file/folder metadata.
   *
   * GET /onedrive/files/:itemId
   */
  @Get('files/:itemId')
  async getFileMetadata(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
  ) {
    if (!itemId) {
      throw new BadRequestException('File ID is required');
    }

    return this.oneDriveService.getFileMetadata(req.user.id, itemId);
  }

  // ============================================================
  // DOWNLOAD FILE
  // ============================================================

  /**
   * Download a file from OneDrive.
   *
   * GET /onedrive/files/:itemId/download
   */
  @Get('files/:itemId/download')
  async downloadFile(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
    @Res() res: Response,
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
  // UPLOAD SMALL FILE
  // ============================================================

  /**
   * Upload a file to OneDrive.
   *
   * POST /onedrive/upload
   *
   * multipart/form-data:
   *
   * file       -> actual file
   * folderPath -> optional folder path
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('folderPath') folderPath?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size === 0) {
      throw new BadRequestException('Cannot upload an empty file');
    }

    /**
     * Small-file upload.
     *
     * Keep this endpoint for files that are
     * within the simple upload limit.
     */
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
  // UPLOAD LARGE FILE
  // ============================================================

  /**
   * Upload a large file using resumable upload.
   *
   * POST /onedrive/upload-large
   *
   * multipart/form-data:
   *
   * file       -> actual file
   * folderPath -> optional folder path
   */
  @Post('upload-large')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLargeFile(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('folderPath') folderPath?: string,
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

  /**
   * Create a folder.
   *
   * POST /onedrive/folders
   *
   * Query:
   *
   * parentPath=root
   * folderName=INOS
   *
   * Example:
   *
   * POST /onedrive/folders
   *   ?parentPath=root
   *   &folderName=INOS
   */
  @Post('folders')
  async createFolder(
    @Req() req: RequestWithUser,

    @Query('parentPath')
    parentPath?: string,

    @Query('folderName')
    folderName?: string,
  ) {
    if (!folderName) {
      throw new BadRequestException('Folder name is required');
    }

    return this.oneDriveService.createFolder(
      req.user.id,

      parentPath || 'root',

      folderName,
    );
  }

  // ============================================================
  // DELETE FILE
  // ============================================================

  /**
   * Delete a file/folder.
   *
   * DELETE /onedrive/files/:itemId
   */
  @Delete('files/:itemId')
  async deleteFile(
    @Req() req: RequestWithUser,
    @Param('itemId') itemId: string,
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

  /**
   * Prevent invalid characters from being
   * placed inside Content-Disposition.
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[\r\n"]/g, '').replace(/[\\/:*?<>|]/g, '_');
  }
}
