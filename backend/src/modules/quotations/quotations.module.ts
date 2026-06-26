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

@Module({
  imports: [
    SequelizeModule.forFeature([Quotation, QuotationItem]),
    ProjectsModule,
    VendorsModule,
  ],

  controllers: [QuotationsController, QuotationItemsController],

  providers: [
    QuotationsService,
    QuotationItemsService, // 🔥 REQUIRED FIX
  ],

  exports: [
    QuotationsService,
    QuotationItemsService, // optional but recommended
  ],
})
export class QuotationsModule {}
