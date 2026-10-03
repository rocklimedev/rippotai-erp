import { Module } from '@nestjs/common';

import { SequelizeModule } from '@nestjs/sequelize';

import { SearchModule } from '../search/search.module';

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

import { ProjectShortlist } from './models/project-shortlist.model';
import { ShortlistEntry } from './models/shortlist-entry.model';

import { ProjectShortlistController } from './project-shortlist.controller';
import { ShortlistEntryController } from './shortlist-entry.controller';

import { ProjectShortlistService } from './project-shortlist.service';
import { ShortlistEntryService } from './shortlist-entry.service';
import { ShortlistExportService } from './shortlist-export.service';
import { ShortlistPackage } from './models/shortlist-package.model';
import { ShortlistPackageService } from './shortlist-package.service';
import { ShortlistPackageController } from './shortlist-package.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Vendor,
      VendorCategory,
      VendorBusinessType,
      Project,
      Quotation,
      ProjectShortlist,
      ShortlistEntry,
      ShortlistPackage,
    ]),

    ActivityLogsModule,

    // ✅ SearchModule actually needs to be imported here
    SearchModule,
  ],

  controllers: [
    VendorsController,
    VendorCategoriesController,
    VendorBusinessTypesController,
    ProjectShortlistController,
    ShortlistEntryController,
    ShortlistPackageController,
  ],

  providers: [
    VendorsService,
    VendorCategoriesService,
    VendorBusinessTypesService,
    VendorDashboardService,
    ProjectShortlistService,
    ShortlistEntryService,
    ShortlistExportService,
    ShortlistPackageService,
  ],

  exports: [
    VendorsService,
    VendorCategoriesService,
    VendorBusinessTypesService,
    ProjectShortlistService,
    ShortlistEntryService,
    ShortlistExportService,
  ],
})
export class VendorsModule {}
