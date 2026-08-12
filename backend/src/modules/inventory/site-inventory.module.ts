import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SiteInventoryItem } from './models/site-inventory-item.model';
import { SiteInventoryTransaction } from './models/site-inventory-transaction.model';

import { SiteInventoryItemsService } from './site-inventory-items.service';
import { SiteInventoryTransactionsService } from './site-inventory-transactions.service';

import { SiteInventoryItemsController } from './site-inventory-items.controller';
import { SiteInventoryTransactionsController } from './site-inventory-transactions.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([SiteInventoryItem, SiteInventoryTransaction]),
  ],

  providers: [SiteInventoryItemsService, SiteInventoryTransactionsService],

  controllers: [
    SiteInventoryItemsController,
    SiteInventoryTransactionsController,
  ],

  exports: [SiteInventoryItemsService, SiteInventoryTransactionsService],
})
export class SiteInventoryModule {}
