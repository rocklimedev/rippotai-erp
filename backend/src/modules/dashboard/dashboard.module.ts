import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserDashboardLayout } from './models/user-dashboard-layouts.model';
import { DashboardsService } from './dashboard.service';
import { DashboardsController } from './dashboard.controller';
import { DashboardDataService } from './dashboard-data.service';

@Module({
  imports: [SequelizeModule.forFeature([UserDashboardLayout])],
  controllers: [DashboardsController],
  providers: [DashboardsService, DashboardDataService],
  exports: [DashboardsService],
})
export class DashboardsModule {}
