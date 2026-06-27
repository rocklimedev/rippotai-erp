import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  async getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('by-project')
  async getByProject() {
    return this.reportsService.getByProject();
  }

  @Get('by-vendor')
  async getByVendor() {
    return this.reportsService.getByVendor();
  }

  @Get('by-status')
  async getByStatus() {
    return this.reportsService.getByStatus();
  }

  @Get('by-employee')
  //   @Roles(UserRole.ADMIN)
  async getByEmployee() {
    return this.reportsService.getByEmployee();
  }
}
