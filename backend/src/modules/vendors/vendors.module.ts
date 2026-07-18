import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Vendor } from './models/vendors.model';
import { VendorCategory } from './models/vendor-category.model';
import { VendorBusinessType } from './models/vendor-business-type.model';

import { Project } from '../projects/models/projects.model';
import { Quotation } from '../quotations/models/quotations.model';

import { VendorsController } from './vendors.controller';
import { VendorCategoriesController } from './vendor-categories.controller';
import { VendorBusinessTypesController } from './vendor-business-types.controller';

import { VendorsService } from './vendors.service';
import { VendorCategoriesService } from './vendor-categories.service';
import { VendorBusinessTypesService } from './vendor-business-types.service';
import { VendorDashboardService } from './vendor-dashboard.service';

import { ActivityLogsModule } from '../engagement/activity-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Vendor,
      VendorCategory,
      VendorBusinessType,
      Project,
      Quotation,
    ]),
    ActivityLogsModule,
  ],
  controllers: [
    VendorsController,
    VendorCategoriesController,
    VendorBusinessTypesController,
  ],
  providers: [
    VendorsService,
    VendorCategoriesService,
    VendorBusinessTypesService,
    VendorDashboardService,
  ],
  exports: [
    VendorsService,
    VendorCategoriesService,
    VendorBusinessTypesService,
  ],
})
export class VendorsModule {}
