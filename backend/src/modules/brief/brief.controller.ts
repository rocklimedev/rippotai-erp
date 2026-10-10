import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUserPayload } from '@/common/interfaces/current-user-payload.interface';
import { UpdateBriefStatusDto } from './dto/update-brief-status.dto';
import {
  Body,
  Req,
  UseGuards,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CdnService } from '../cdn/cdn.service';

import { ProjectBriefsService } from './brief.service';

import { CreateProjectBriefDto } from './dto/create-project-brief.dto';
import { UpdateProjectBriefDto } from './dto/update-project-brief.dto';

@UseGuards(JwtAuthGuard)
@Controller('project-briefs')
export class ProjectBriefsController {
  constructor(private readonly projectBriefsService: ProjectBriefsService, private readonly cdnService: CdnService) {}

  @RequirePermission('project-briefs:upload')
  @Post('reference-images')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadReferenceImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      throw new BadRequestException('Upload a JPG, PNG, WebP or GIF image.');
    }
    const extensions: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    return this.cdnService.uploadFile({ ...file, originalname: `reference${extensions[file.mimetype]}` });
  }

  // =========================================================
  // CREATE
  // =========================================================

  @RequirePermission('project-briefs:create')
  @Post()
  create(@Body() dto: CreateProjectBriefDto) {
    return this.projectBriefsService.create(dto);
  }

  // =========================================================
  // LIST
  // =========================================================

  @RequirePermission('project-briefs:read')
  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.projectBriefsService.findAll(projectId);
  }

  // =========================================================
  // LATEST BY PROJECT
  // =========================================================

  @RequirePermission('project-briefs:read')
  @Get('project/:projectId/latest')
  findLatestByProject(@Param('projectId') projectId: string) {
    return this.projectBriefsService.findLatestByProject(projectId);
  }

  // =========================================================
  // DETAIL
  // =========================================================

  @RequirePermission('project-briefs:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectBriefsService.findOne(id);
  }

  // =========================================================
  // UPDATE
  // =========================================================

  @RequirePermission('project-briefs:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectBriefDto) {
    return this.projectBriefsService.update(id, dto);
  }

  // =========================================================
  // STATUS
  // =========================================================

  @RequirePermission('project-briefs:update')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateBriefStatusDto,
    @Req() req: { user: CurrentUserPayload },
  ) {
    return this.projectBriefsService.updateStatus(id, body.status, req.user.id, req.user.permissions);
  }

  // =========================================================
  // NEW VERSION
  // =========================================================

  @RequirePermission('project-briefs:create')
  @Post(':id/new-version')
  createNewVersion(@Param('id') id: string) {
    return this.projectBriefsService.createNewVersion(id);
  }

  // =========================================================
  // DELETE
  // =========================================================

  @RequirePermission('project-briefs:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectBriefsService.remove(id);
  }
}
