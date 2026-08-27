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
import { DrawingsService } from './drawing.service';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { UpdateDrawingDto } from './dto/update-drawing.dto';
import { CreateDrawingRevisionDto } from './dto/create-drawing-revision.dto';

const FILE_UPLOAD_OPTIONS = {
  storage: memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
};

@Controller('drawings')
export class DrawingsController {
  constructor(private readonly drawingsService: DrawingsService) {}

  @Post()
  create(@Body() dto: CreateDrawingDto) {
    return this.drawingsService.create(dto);
  }

  @Get()
  findAllForProject(
    @Query('projectId', ParseUUIDPipe) projectId: string,
    @Query('discipline') discipline?: string,
    @Query('status') status?: string,
    @Query('phaseCode') phaseCode?: string,
  ) {
    return this.drawingsService.findAllForProject(projectId, {
      discipline,
      status,
      phaseCode,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawingsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDrawingDto,
  ) {
    return this.drawingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawingsService.remove(id);
  }

  // ---- Revisions ----

  @Post(':id/revisions')
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  addRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDrawingRevisionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.drawingsService.addRevision(id, dto, file);
  }

  @Get(':id/revisions')
  listRevisions(@Param('id', ParseUUIDPipe) id: string) {
    return this.drawingsService.listRevisions(id);
  }

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

    const buffer = await this.drawingsService.downloadFile(
      revision.storageFilename,
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${revision.filename ?? revision.storageFilename}"`,
    );
    res.setHeader('Content-Type', revision.mime ?? 'application/octet-stream');
    res.send(buffer);
  }

  @Delete(':id/revisions/:revisionId')
  removeRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('revisionId', ParseUUIDPipe) revisionId: string,
  ) {
    return this.drawingsService.removeRevision(id, revisionId);
  }
}
