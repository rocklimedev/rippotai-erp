import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { DiskUploadInterceptor, UploadRateGuard } from '../cdn/upload-security';

import type { Response } from 'express';
import { DrawingsService } from './drawing.service';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { UpdateDrawingDto } from './dto/update-drawing.dto';
import { CreateDrawingRevisionDto } from './dto/create-drawing-revision.dto';

@Controller('drawings')
export class DrawingsController {
  constructor(private readonly drawingsService: DrawingsService) {}

  @RequirePermission('drawings:create')
  @Post()
  create(@Body() dto: CreateDrawingDto) {
    return this.drawingsService.create(dto);
  }

  @RequirePermission('drawings:read')
  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('discipline') discipline?: string,
    @Query('status') status?: string,
    @Query('phaseCode') phaseCode?: string,
  ) {
    return this.drawingsService.findAll(projectId, {
      discipline,
      status,
      phaseCode,
    });
  }

  @RequirePermission('drawings:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawingsService.findOne(id);
  }

  @RequirePermission('documents:approve')
  @Post(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.drawingsService.approveUploaded(id, req.user.id);
  }

  @RequirePermission('drawings:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDrawingDto,
  ) {
    return this.drawingsService.update(id, dto);
  }

  @RequirePermission('drawings:delete')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawingsService.remove(id);
  }

  // ---- Revisions ----

  @RequirePermission('drawings:create')
  @Post(':id/revisions')
  @UseGuards(UploadRateGuard)
  @UseInterceptors(DiskUploadInterceptor)
  addRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDrawingRevisionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.drawingsService.addRevision(id, dto, file);
  }

  @RequirePermission('drawings:read')
  @Get(':id/revisions')
  listRevisions(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawingsService.listRevisions(id);
  }

  @RequirePermission('drawings:read')
  @Get(':id/revisions/:revisionId/download')
  async downloadRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
    @Res() res: Response,
  ) {
    const revisions = await this.drawingsService.listRevisions(id);
    const revision = revisions.find((r) => r.id === revisionId);

    if (!revision || !revision.storageFilename) {
      return res.status(404).send({ message: 'Revision file not found' });
    }

    if (res.destroyed || res.writableEnded) return;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${(revision.filename ?? revision.storageFilename).replace(/["\r\n\\]/g, '_')}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Content-Type', revision.mime ?? 'application/octet-stream');
    try {
      await this.drawingsService.streamFile(revision.storageFilename, res);
    } catch (error) {
      // An aborted preview has no response left to send an exception to.
      if (res.destroyed || res.writableEnded) return;
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.removeHeader('Content-Type');
      res.removeHeader('Content-Disposition');
      if (['ENOENT', 2].includes((error as { code?: string | number }).code!)) {
        return res.status(404).json({ message: 'Revision file not found' });
      }
      throw error;
    }
  }

  @RequirePermission('drawings:delete')
  @Delete(':id/revisions/:revisionId')
  removeRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
  ) {
    return this.drawingsService.removeRevision(id, revisionId);
  }
}
