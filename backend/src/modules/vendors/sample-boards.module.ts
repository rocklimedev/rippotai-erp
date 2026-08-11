import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SampleBoard } from './models/sample-board.model';
import { SampleBoardsService } from './sample-boards.service';
import { SampleBoardsController } from './sample-boards.controller';

@Module({
  imports: [SequelizeModule.forFeature([SampleBoard])],
  providers: [SampleBoardsService],
  controllers: [SampleBoardsController],
  exports: [SampleBoardsService],
})
export class SampleBoardsModule {}
