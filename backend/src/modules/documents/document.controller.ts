import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/sequelize';
import { DocumentsService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SectionFormDto } from './dto/section-form.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard'; // assumes existing auth guard
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';
import { Project } from '@/modules/projects/models/projects.model';

const UPLOAD_LIMITS = { fileSize: 25 * 1024 * 1024 }; // 25 MB, matches "Upload Document" copy

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    @InjectModel(Project) private readonly projectModel: typeof Project,
  ) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('project_id') project_id?: string,
  ) {
    return this.documentsService.findAll({ q, category, project_id });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: UPLOAD_LIMITS,
    }),
  )
  create(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.create(dto, file, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Post(':id/replace')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: UPLOAD_LIMITS,
    }),
  )
  replace(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.documentsService.replaceFile(id, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/lock')
  lock(@Param('id') id: string, @CurrentUser() user: User) {
    return this.documentsService.lock(id, user);
  }

  @Post(':id/unlock')
  unlock(@Param('id') id: string) {
    return this.documentsService.unlock(id);
  }

  // Proxied download — the frontend deliberately calls this via axios with
  // an Authorization header rather than a raw <a href>, since the CDN's
  // public URL/anonymous access would otherwise return a 401 JSON body.
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mime, filename } = await this.documentsService.download(id);
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    });
    res.send(buffer);
  }

  @Get(':id/attachments/:attachmentId')
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { buffer, mime, filename } =
      await this.documentsService.downloadAttachment(id, attachmentId);
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
    });
    res.send(buffer);
  }

  @Get(':id/reki')
  getReki(@Param('id') id: string) {
    return this.documentsService.getReki(id);
  }

  @Post('forms/project-brief')
  async createProjectBrief(
    @Body() dto: SectionFormDto,
    @CurrentUser() user: User,
  ) {
    const project = await this.projectModel.findByPk(dto.project_id);
    if (!project) throw new NotFoundException('Project not found');
    return this.documentsService.createProjectBrief(dto, project, user);
  }

  @Post('forms/site-reki')
  async createSiteReki(@Body() dto: SectionFormDto, @CurrentUser() user: User) {
    const project = await this.projectModel.findByPk(dto.project_id);
    if (!project) throw new NotFoundException('Project not found');
    return this.documentsService.createSiteReki(dto, project, user);
  }
}

/**
 * Separate controller so the route path matches the frontend's
 * `/projects/:id/documents-workspace` call (nested under /projects
 * rather than /documents).
 */
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectDocumentsWorkspaceController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get(':id/documents-workspace')
  getWorkspace(@Param('id') id: string) {
    return this.documentsService.getWorkspace(id);
  }
}
