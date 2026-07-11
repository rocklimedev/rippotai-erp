import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';

type AuthUser = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  role_id?: string;
};

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return this.projectsService.create(dto, user);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    let parsedStatus: ProjectStatus | undefined;

    if (status) {
      if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
        throw new BadRequestException(
          `Invalid status "${status}". Expected one of: ${Object.values(
            ProjectStatus,
          ).join(', ')}`,
        );
      }
      parsedStatus = status as ProjectStatus;
    }

    return this.projectsService.findAll({
      status: parsedStatus,
      includeArchived: includeArchived === 'true',
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.projectsService.findOne(id, includeDeleted === 'true');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @Patch(':id/archive')
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.archive(id, user);
  }

  @Patch(':id/restore')
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.restore(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.projectsService.remove(id, user);
  }
}
