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
import { SaveDashboardDto } from './dto/save-dashboard.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

@UseGuards(JwtAuthGuard)
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  // Must come before ':appKey'
  @Get('library/:appKey')
  getLibrary(@Param('appKey') appKey: string) {
    return this.dashboardsService.getLibrary(appKey);
  }

  @Get(':appKey')
  getDashboard(@CurrentUser() user: User, @Param('appKey') appKey: string) {
    return this.dashboardsService.getDashboard(user.id, appKey);
  }

  @Put(':appKey')
  saveDashboard(
    @CurrentUser() user: User,
    @Param('appKey') appKey: string,
    @Body() dto: SaveDashboardDto,
  ) {
    return this.dashboardsService.saveDashboard(user.id, appKey, dto);
  }

  @Post(':appKey/reset')
  resetDashboard(@CurrentUser() user: User, @Param('appKey') appKey: string) {
    return this.dashboardsService.resetDashboard(user.id, appKey);
  }
}
