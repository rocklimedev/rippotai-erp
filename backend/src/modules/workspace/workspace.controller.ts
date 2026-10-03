import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { WorkspaceService } from './workspace.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly svc: WorkspaceService) {}

  /** GET /clients/:id/overview — client + projects, documents, payment schedules, quotations, notes */
  @Get('clients/:id/overview')
  clientOverview(@Param('id') id: string) {
    return this.svc.clientOverview(id);
  }

  /** GET /clients-summary — per-client project counts / values for the directory */
  @Get('clients-summary')
  clientsSummary() {
    return this.svc.clientsSummary();
  }

  /** GET /calendar/feed?from&to&mine=1 — events + task due dates + milestones + payments + site visits */
  @Get('calendar/feed')
  calendarFeed(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('mine') mine?: string,
  ) {
    return this.svc.calendarFeed({ from, to, mine: mine === '1' || mine === 'true', user });
  }

  /** GET /activity-logs/feed?app&entity_type&action&user_id&q&from&to&limit&offset */
  @Get('activity-logs/feed')
  activityFeed(@Query() q: any) {
    return this.svc.activityFeed(q);
  }

  /** GET /site-ops/visits/assignments?projectId&status=active|inactive — all visit assignments (list page) */
  @Get('site-ops/visits/assignments')
  visitAssignments(@Query('projectId') projectId?: string, @Query('status') status?: string) {
    return this.svc.visitAssignments({ projectId, status });
  }

  /** GET /site-ops/visits/log?projectId&from&to&status — visit log across projects */
  @Get('site-ops/visits/log')
  visitLog(@Query() q: any) {
    return this.svc.visitLog(q);
  }

  /** GET /inventory-overview?projectId — stock per project × material + recent movements (Inventory app) */
  @Get('inventory-overview')
  inventoryOverview(@Query('projectId') projectId?: string) {
    return this.svc.inventoryOverview(projectId);
  }
}
