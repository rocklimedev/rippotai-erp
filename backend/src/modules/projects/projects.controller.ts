import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
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
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @Body('archived_by') archived_by?: string) {
    return this.projectsService.archive(id, archived_by);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.projectsService.restore(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
