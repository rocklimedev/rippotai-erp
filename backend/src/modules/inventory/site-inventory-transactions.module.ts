import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SiteInventoryTransaction } from './models/site-inventory-transaction.model';
import { SiteInventoryItem } from './models/site-inventory-item.model';
import { SiteInventoryTransactionsService } from './site-inventory-transactions.service';
import { SiteInventoryTransactionsController } from './site-inventory-transactions.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([SiteInventoryTransaction, SiteInventoryItem]),
  ],
  providers: [SiteInventoryTransactionsService],
  controllers: [SiteInventoryTransactionsController],
  exports: [SiteInventoryTransactionsService],
})
export class SiteInventoryTransactionsModule {}
