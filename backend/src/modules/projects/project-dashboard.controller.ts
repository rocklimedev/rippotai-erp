import { RequirePermission } from '@/common/decorator/require-permission.decorator';
// project-dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ProjectDashboardService } from './project-dashboard.service';

@Controller()
export class ProjectDashboardController {
  constructor(private readonly dashboardService: ProjectDashboardService) {}

  @RequirePermission('project-dashboard:read')
  @Get('/projects/summary')
  getSummary() {
    return this.dashboardService.getProjectsSummary();
  }

  @RequirePermission('project-dashboard:read')
  @Get('/projects/full')
  getFull() {
    return this.dashboardService.getProjectsFull();
  }

  @RequirePermission('project-dashboard:read')
  @Get('/dashboards/projects/progress')
  getProgress() {
    return this.dashboardService.getProjectsProgress();
  }

  @RequirePermission('project-dashboard:read')
  @Get('/dashboards/projects/upcoming-milestones')
  getUpcomingMilestones(@Query('limit') limit = 4) {
    return this.dashboardService.getUpcomingMilestones(+limit);
  }

  @RequirePermission('project-dashboard:read')
  @Get('/dashboards/projects/progress-trend')
  getProgressTrend(@Query('months') months = 6) {
    return this.dashboardService.getProjectsProgressTrend(+months);
  }

  @RequirePermission('project-dashboard:read')
  @Get('/dashboards/projects/phase-mix')
  getPhaseMix() {
    return this.dashboardService.getProjectsPhaseMix();
  }

  @RequirePermission('project-dashboard:read')
  @Get('/dashboards/projects/variance-by-project')
  getVarianceByProject(@Query('limit') limit = 6) {
    return this.dashboardService.getProjectsVarianceByProject(+limit);
  }

  @RequirePermission('project-dashboard:read')
  @Get('/milestones/upcoming')
  getUpcomingMilestonesGlobal(@Query('limit') limit = 5) {
    return this.dashboardService.getUpcomingMilestonesGlobal(+limit);
  }

  @RequirePermission('project-dashboard:read')
  @Get('/activity/recent')
  getRecentActivity(@Query('limit') limit = 10) {
    return this.dashboardService.getRecentActivity(+limit);
  }
}
