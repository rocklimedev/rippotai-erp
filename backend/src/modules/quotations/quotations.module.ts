import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';

import { QuotationItemsService } from './quotation-items.service';
import { QuotationItemsController } from './quotation-items.controller';

import { Quotation } from './models/quotations.model';
import { QuotationItem } from './models/quotation-items.model';

import { ProjectsModule } from '../projects/projects.module';
import { VendorsModule } from '../vendors/vendors.module';
import { QuotationVersion } from './models/quotation-versions.model';
import { QuotationVersionsService } from './quotation-versions.service';
import { QuotationVersionsController } from './quotation-versions.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([Quotation, QuotationItem, QuotationVersion]),
    ProjectsModule,
    VendorsModule,
  ],

  controllers: [
    QuotationsController,
    QuotationItemsController,
    QuotationVersionsController,
  ],

  providers: [
    QuotationsService,
    QuotationItemsService, // 🔥 REQUIRED FIX
    QuotationVersionsService,
  ],

  exports: [
    QuotationsService,
    QuotationItemsService, // optional but recommended
    QuotationVersionsService,
  ],
})
export class QuotationsModule {}
