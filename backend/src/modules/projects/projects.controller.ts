import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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
import { UpdateProjectTeamMemberDto } from './dto/update-project-team-member.dto';
import { AddProjectTeamMemberDto } from './dto/project-team-member.dto';
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
  @RequirePermission('projects:create')
  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user?: User) {
    return this.projectsService.create(dto, user);
  }

  // =========================
  // GET ALL
  // =========================
  @RequirePermission('projects:read')
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
  @RequirePermission('projects:read')
  @Get('summary')
  getSummary() {
    return this.dashboardService.getProjectsSummary();
  }

  @RequirePermission('projects:read')
  @Get('full')
  getFull() {
    return this.dashboardService.getProjectsFull();
  }

  @RequirePermission('projects:read')
  @Get('progress')
  getProgress() {
    return this.dashboardService.getProjectsProgress();
  }

  @RequirePermission('projects:read')
  @Get('upcoming-milestones')
  getUpcomingMilestones(@Query('limit') limit = '4') {
    return this.dashboardService.getUpcomingMilestones(Number(limit));
  }

  @RequirePermission('projects:read')
  @Get('progress-trend')
  getProgressTrend(@Query('months') months = '6') {
    return this.dashboardService.getProjectsProgressTrend(Number(months));
  }

  @RequirePermission('projects:read')
  @Get('phase-mix')
  getPhaseMix() {
    return this.dashboardService.getProjectsPhaseMix();
  }

  @RequirePermission('projects:read')
  @Get('variance-by-project')
  getVarianceByProject(@Query('limit') limit = '6') {
    return this.dashboardService.getProjectsVarianceByProject(Number(limit));
  }

  @RequirePermission('projects:read')
  @Get('milestones/upcoming')
  getUpcomingMilestonesGlobal(@Query('limit') limit = '5') {
    return this.dashboardService.getUpcomingMilestonesGlobal(Number(limit));
  }

  @RequirePermission('projects:read')
  @Get('activity/recent')
  getRecentActivity(@Query('limit') limit = '10') {
    return this.dashboardService.getRecentActivity(Number(limit));
  }

  // =========================
  // GET ONE
  // =========================
  @RequirePermission('projects:read')
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
  @RequirePermission('projects:update')
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
  @RequirePermission('projects:update')
  @Patch(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: User) {
    return this.projectsService.archive(id, user);
  }

  // =========================
  // RESTORE
  // =========================
  @RequirePermission('projects:restore')
  @Patch(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: User) {
    return this.projectsService.restore(id, user);
  }

  // =========================
  // DELETE
  // =========================
  @RequirePermission('projects:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: User,
  ): Promise<void> {
    return this.projectsService.remove(id, user);
  }

  @RequirePermission('projects:create')
  @Post(':id/team')
  addTeamMember(
    @Param('id') projectId: string,
    @Body() dto: AddProjectTeamMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.addTeamMember(projectId, dto, user);
  }

  @RequirePermission('projects:read')
  @Get(':id/team')
  getTeam(@Param('id') projectId: string) {
    return this.projectsService.getTeam(projectId);
  }

  @RequirePermission('projects:update')
  @Patch(':id/team/:teamMemberId')
  updateTeamMember(
    @Param('id') projectId: string,
    @Param('teamMemberId') teamMemberId: string,
    @Body() dto: UpdateProjectTeamMemberDto,
  ) {
    return this.projectsService.updateTeamMember(projectId, teamMemberId, dto);
  }

  @RequirePermission('projects:delete')
  @Delete(':id/team/:teamMemberId')
  removeTeamMember(
    @Param('id') projectId: string,
    @Param('teamMemberId') teamMemberId: string,
  ) {
    return this.projectsService.removeTeamMember(projectId, teamMemberId);
  }
}
