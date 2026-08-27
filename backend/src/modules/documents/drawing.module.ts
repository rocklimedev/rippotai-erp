import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Drawing } from './models/drawing.model';
import { DrawingRevision } from './models/drawing-revision.model';
import { DrawingsService } from './drawing.service';
import { DrawingsController } from './drawing.controller';
import { CdnModule } from '../cdn/cdn.module';
import { DocumentsModule } from './document.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Drawing, DrawingRevision]),
    CdnModule,
    DocumentsModule, // reuses DocumentType / DocumentRequirement models & services
  ],
  controllers: [DrawingsController],
  providers: [DrawingsService],
  exports: [DrawingsService],
})
export class DrawingsModule {}
