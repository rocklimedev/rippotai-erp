import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { Vendor } from './models/vendors.model';
import { VendorCategory } from './models/vendor-category.model';
import { VendorBusinessType } from './models/vendor-business-type.model';
import { VendorTenderResponse } from './models/vendor-tender-response.model';
import { VendorSiteMeasurement } from './models/vendor-site-measurement.model';
import { ContractorLineup } from './models/contractor-lineup.model';

// Related models
import { Project } from '../projects/models/projects.model';
import { Quotation } from '../quotations/models/quotations.model';

// Related modules
import { EstimatesModule } from '../quotations/estimates.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

// Controllers
import { VendorsController } from './vendors.controller';
import { VendorCategoriesController } from './vendor-categories.controller';
import { VendorBusinessTypesController } from './vendor-business-types.controller';
import { VendorTenderResponsesController } from './vendor-tender-responses.controller';
import { VendorSiteMeasurementsController } from './vendor-site-measurements.controller';
import { ContractorLineupController } from './contractor-lineup.controller';

// Services
import { VendorsService } from './vendors.service';
import { VendorCategoriesService } from './vendor-categories.service';
import { VendorBusinessTypesService } from './vendor-business-types.service';
import { VendorDashboardService } from './vendor-dashboard.service';
import { VendorTenderResponsesService } from './vendor-tender-responses.service';
import { VendorSiteMeasurementsService } from './vendor-site-measurements.service';
import { ContractorLineupService } from './contractor-lineup.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Vendor,
      VendorCategory,
      VendorBusinessType,
      VendorTenderResponse,
      VendorSiteMeasurement,
      ContractorLineup,
      Project,
      Quotation,
    ]),

    EstimatesModule,
    ActivityLogsModule,
  ],

  controllers: [
    VendorsController,
    VendorCategoriesController,
    VendorBusinessTypesController,
    VendorTenderResponsesController,
    VendorSiteMeasurementsController,
    ContractorLineupController,
  ],

  providers: [
    VendorsService,
    VendorCategoriesService,
    VendorBusinessTypesService,
    VendorDashboardService,
    VendorTenderResponsesService,
    VendorSiteMeasurementsService,
    ContractorLineupService,
  ],

  exports: [
    VendorsService,
    VendorCategoriesService,
    VendorBusinessTypesService,
    VendorTenderResponsesService,
    VendorSiteMeasurementsService,
    ContractorLineupService,
    SequelizeModule,
  ],
})
export class VendorsModule {}
