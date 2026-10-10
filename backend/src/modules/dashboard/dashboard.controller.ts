import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DashboardsService } from './dashboard.service';
import { DashboardDataService } from './dashboard-data.service';
import { SaveDashboardDto } from './dto/save-dashboard.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

@UseGuards(JwtAuthGuard)
@Controller('dashboards')
export class DashboardsController {
  constructor(
    private readonly dashboardsService: DashboardsService,
    private readonly dataService: DashboardDataService,
  ) {}

  // Aggregated widget data feed — must come before ':appKey'
  @RequirePermission('dashboards:read')
  @Get('data/:app')
  getData(@Param('app') app: string) {
    return this.dataService.getData(app);
  }

  // Must come before ':appKey'
  @RequirePermission('dashboards:read')
  @Get('library/:appKey')
  getLibrary(@Param('appKey') appKey: string) {
    return this.dashboardsService.getLibrary(appKey);
  }

  @RequirePermission('dashboards:read')
  @Get(':appKey')
  getDashboard(@CurrentUser() user: User, @Param('appKey') appKey: string) {
    return this.dashboardsService.getDashboard(user.id, appKey);
  }

  @RequirePermission('dashboards:update')
  @Put(':appKey')
  saveDashboard(
    @CurrentUser() user: User,
    @Param('appKey') appKey: string,
    @Body() dto: SaveDashboardDto,
  ) {
    return this.dashboardsService.saveDashboard(user.id, appKey, dto);
  }

  @RequirePermission('dashboards:reset')
  @Post(':appKey/reset')
  resetDashboard(@CurrentUser() user: User, @Param('appKey') appKey: string) {
    return this.dashboardsService.resetDashboard(user.id, appKey);
  }
}
