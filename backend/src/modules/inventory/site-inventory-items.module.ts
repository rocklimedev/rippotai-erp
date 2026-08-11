import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SiteInventoryItem } from './models/site-inventory-item.model';
import { SiteInventoryItemsService } from './site-inventory-items.service';
import { SiteInventoryItemsController } from './site-inventory-items.controller';

@Module({
  imports: [SequelizeModule.forFeature([SiteInventoryItem])],
  providers: [SiteInventoryItemsService],
  controllers: [SiteInventoryItemsController],
  exports: [SiteInventoryItemsService],
})
export class SiteInventoryItemsModule {}
