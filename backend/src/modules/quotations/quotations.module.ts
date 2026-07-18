import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';

import { QuotationItemsService } from './quotation-items.service';
import { QuotationItemsController } from './quotation-items.controller';

import { Quotation } from './models/quotations.model';
import { QuotationItem } from './models/quotation-items.model';
import { QuotationVersion } from './models/quotation-versions.model';

import { Unit } from '../metas/models/unit.model';
import { ProjectsModule } from '../projects/projects.module';
import { VendorsModule } from '../vendors/vendors.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

import { QuotationVersionsService } from './quotation-versions.service';
import { QuotationVersionsController } from './quotation-versions.controller';
import { QuotationComparison } from './models/quotation-comparisons.model';
import { QuotationDashboardService } from './quotation-dashboard.service';
import { Project } from '../projects/models/projects.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Quotation,
      QuotationItem,
      QuotationVersion,
      QuotationComparison,
      Unit, // 🔥 REQUIRED for belongsTo relation
      Project,
    ]),

    ProjectsModule,
    VendorsModule,
    ActivityLogsModule,
  ],

  controllers: [
    QuotationsController,
    QuotationItemsController,
    QuotationVersionsController,
  ],

  providers: [
    QuotationsService,
    QuotationItemsService,
    QuotationVersionsService,
    QuotationDashboardService,
  ],

  exports: [QuotationsService, QuotationItemsService, QuotationVersionsService],
})
export class QuotationsModule {}
