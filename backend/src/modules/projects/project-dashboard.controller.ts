// project-dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ProjectDashboardService } from './project-dashboard.service';

@Controller()
export class ProjectDashboardController {
  constructor(private readonly dashboardService: ProjectDashboardService) {}

  @Get('/projects/summary')
  getSummary() {
    return this.dashboardService.getProjectsSummary();
  }

  @Get('/projects/full')
  getFull() {
    return this.dashboardService.getProjectsFull();
  }

  @Get('/dashboards/projects/progress')
  getProgress() {
    return this.dashboardService.getProjectsProgress();
  }

  @Get('/dashboards/projects/upcoming-milestones')
  getUpcomingMilestones(@Query('limit') limit = 4) {
    return this.dashboardService.getUpcomingMilestones(+limit);
  }

  @Get('/dashboards/projects/progress-trend')
  getProgressTrend(@Query('months') months = 6) {
    return this.dashboardService.getProjectsProgressTrend(+months);
  }

  @Get('/dashboards/projects/phase-mix')
  getPhaseMix() {
    return this.dashboardService.getProjectsPhaseMix();
  }

  @Get('/dashboards/projects/variance-by-project')
  getVarianceByProject(@Query('limit') limit = 6) {
    return this.dashboardService.getProjectsVarianceByProject(+limit);
  }

  @Get('/milestones/upcoming')
  getUpcomingMilestonesGlobal(@Query('limit') limit = 5) {
    return this.dashboardService.getUpcomingMilestonesGlobal(+limit);
  }

  @Get('/activity/recent')
  getRecentActivity(@Query('limit') limit = 10) {
    return this.dashboardService.getRecentActivity(+limit);
  }
}
