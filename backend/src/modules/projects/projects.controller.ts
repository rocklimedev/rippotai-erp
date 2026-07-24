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
import { ProjectDashboardService } from './project-dashboard.service';

import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectStatus } from '../../common/enums';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly dashboardService: ProjectDashboardService,
  ) {}

  // =========================
  // CREATE
  // =========================
  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user?: User) {
    return this.projectsService.create(dto, user);
  }

  // =========================
  // GET ALL
  // =========================
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('client_id') clientId?: string,
  ) {
    let parsedStatus: ProjectStatus | undefined;

    if (status) {
      if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
        throw new BadRequestException(
          `Invalid status "${status}". Expected one of: ${Object.values(ProjectStatus).join(', ')}`,
        );
      }
      parsedStatus = status as ProjectStatus;
    }

    return this.projectsService.findAll({
      status: parsedStatus,
      includeArchived: includeArchived === 'true',
      includeDeleted: includeDeleted === 'true',
      client_id: clientId,
    });
  }

  // =========================
  // DASHBOARD ROUTES
  // =========================
  @Get('summary')
  getSummary() {
    return this.dashboardService.getProjectsSummary();
  }

  @Get('full')
  getFull() {
    return this.dashboardService.getProjectsFull();
  }

  @Get('progress')
  getProgress() {
    return this.dashboardService.getProjectsProgress();
  }

  @Get('upcoming-milestones')
  getUpcomingMilestones(@Query('limit') limit = '4') {
    return this.dashboardService.getUpcomingMilestones(Number(limit));
  }

  @Get('progress-trend')
  getProgressTrend(@Query('months') months = '6') {
    return this.dashboardService.getProjectsProgressTrend(Number(months));
  }

  @Get('phase-mix')
  getPhaseMix() {
    return this.dashboardService.getProjectsPhaseMix();
  }

  @Get('variance-by-project')
  getVarianceByProject(@Query('limit') limit = '6') {
    return this.dashboardService.getProjectsVarianceByProject(Number(limit));
  }

  @Get('milestones/upcoming')
  getUpcomingMilestonesGlobal(@Query('limit') limit = '5') {
    return this.dashboardService.getUpcomingMilestonesGlobal(Number(limit));
  }

  @Get('activity/recent')
  getRecentActivity(@Query('limit') limit = '10') {
    return this.dashboardService.getRecentActivity(Number(limit));
  }

  // =========================
  // GET ONE
  // =========================
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.projectsService.findOne(id, includeDeleted === 'true');
  }

  // =========================
  // UPDATE
  // =========================
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user?: User,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  // =========================
  // ARCHIVE
  // =========================
  @Patch(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: User) {
    return this.projectsService.archive(id, user);
  }

  // =========================
  // RESTORE
  // =========================
  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: User) {
    return this.projectsService.restore(id, user);
  }

  // =========================
  // DELETE
  // =========================
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: User,
  ): Promise<void> {
    return this.projectsService.remove(id, user);
  }
}
