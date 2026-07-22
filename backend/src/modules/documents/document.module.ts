import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Document } from './models/document.model';
import { DocumentAttachment } from './models/document-attachment.model';

import { Project } from '@/modules/projects/models/projects.model';

import { DocumentsService } from './document.service';
import {
  DocumentsController,
  ProjectDocumentsWorkspaceController,
} from './document.controller';
import { PdfGeneratorService } from './pdf-generator.service';

import { CdnModule } from '@/modules/cdn/cdn.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Document, DocumentAttachment, Project]),
    CdnModule,
  ],
  controllers: [DocumentsController, ProjectDocumentsWorkspaceController],
  providers: [DocumentsService, PdfGeneratorService],
  exports: [
    DocumentsService,
    SequelizeModule, // Export Document repository to other modules
  ],
})
export class DocumentsModule {}
