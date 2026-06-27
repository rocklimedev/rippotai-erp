import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Quotation } from '../quotations/models/quotations.model';
import { Project } from '../projects/models/projects.model';
import { Vendor } from '../vendors/models/vendors.model';
import { User } from '../users/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Quotation, Project, Vendor, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
