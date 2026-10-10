import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @RequirePermission('reports:read')
  @Get('overview')
  async getOverview() {
    return this.reportsService.getOverview();
  }

  @RequirePermission('reports:read')
  @Get('by-project')
  async getByProject() {
    return this.reportsService.getByProject();
  }

  @RequirePermission('reports:read')
  @Get('by-vendor')
  async getByVendor() {
    return this.reportsService.getByVendor();
  }

  @RequirePermission('reports:read')
  @Get('by-status')
  async getByStatus() {
    return this.reportsService.getByStatus();
  }

  @RequirePermission('reports:read')
  @Get('by-employee')
  //   @Roles(UserRole.ADMIN)
  async getByEmployee() {
    return this.reportsService.getByEmployee();
  }
}
