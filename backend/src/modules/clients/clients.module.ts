import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Client } from './models/client.model';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Client]),
    NotificationsModule,
    ActivityLogsModule,
  ],
  providers: [ClientsService],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
