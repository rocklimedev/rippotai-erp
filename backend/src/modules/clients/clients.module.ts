import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SearchModule } from '../search/search.module'; // <-- Add this

import { Client } from './models/client.model';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ClientSearchService } from '../search/services/client-search.service';

@Module({
  imports: [SequelizeModule.forFeature([Client])],
  providers: [ClientsService],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
