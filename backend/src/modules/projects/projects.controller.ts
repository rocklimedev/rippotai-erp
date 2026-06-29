import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

type AuthUser = {
  id: string;
  email?: string;
  role?: string;
};

type AuthRequest = Request & {
  user?: AuthUser;
};

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req: AuthRequest) {
    return this.projectsService.create(dto, req.user?.id);
  }

  @Get()
  findAll(
    @Query('status') status?: ProjectStatus,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.projectsService.findAll({
      status,
      includeArchived: includeArchived === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: AuthRequest,
  ) {
    return this.projectsService.update(id, dto, req.user?.id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.projectsService.archive(id, req.user?.id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.projectsService.restore(id, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.projectsService.remove(id, req.user?.id);
  }
}
