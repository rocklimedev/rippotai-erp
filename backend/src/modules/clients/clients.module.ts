import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Client } from './models/client.model';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller'; // if you have one

@Module({
  imports: [SequelizeModule.forFeature([Client])],
  providers: [ClientsService],
  controllers: [ClientsController],
  exports: [ClientsService], // <-- needed so ProjectsModule can use it
})
export class ClientsModule {}
