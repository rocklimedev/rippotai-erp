import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Document } from './models/document.model';
import { DocumentAttachment } from './models/document-attachment.model';
import { DocumentVersion } from './models/document-version.model';

import { Project } from '@/modules/projects/models/projects.model';
import { Deliverable } from '../process-workflow/models/deliverable.model';
import { ProjectDeliverableRecord } from '../process-workflow/models/project-deliverable-record.model';
import { Step } from '../process-workflow/models/step.model';
import { Phase } from '../process-workflow/models/phase.model';

import { DocumentsService } from './document.service';
import { DocumentsController } from './document.controller';

import { PdfGeneratorService } from './pdf-generator.service';
import { CdnModule } from '@/modules/cdn/cdn.module';

import { DocumentRegisterController } from './document-register.controller';
import { DocumentRegisterService } from './document-register.service';

import { StepTeam } from '../process-workflow/models/step-team.model';
import { ProjectStepProgress } from '../process-workflow/models/project-step-progress.model';
import { Team } from '../process-workflow/models/team.model';
import { ContinuityRole } from '../process-workflow/models/continuity-role.model';
import { GateLog } from '../process-workflow/models/gate-log.model';
import { DocumentType } from './models/document-type.model';
import { DocumentTypesController } from './document-types.controller';
import { DocumentTypesService } from './document-types.service';
import { DocumentRequirement } from './models/document-requirement.model';
import { DocumentRequirementsController } from './document-requirements.controller';
import { DocumentRequirementsService } from './document-requirements.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Document,
      DocumentAttachment,
      DocumentVersion,

      // Existing
      Project,

      // Required by DocumentRegisterService
      Deliverable,
      ProjectDeliverableRecord,
      ProjectStepProgress,
      Team,
      DocumentType,
      ContinuityRole,
      GateLog,
      Step,
      StepTeam,
      Phase,
      DocumentRequirement,
    ]),

    CdnModule,
  ],

  controllers: [
    DocumentsController,
    DocumentRegisterController,
    DocumentRequirementsController,
    DocumentTypesController,
  ],

  providers: [
    DocumentsService,
    PdfGeneratorService,
    DocumentRegisterService,
    DocumentTypesService,
    DocumentRequirementsService,
  ],

  exports: [DocumentsService, SequelizeModule],
})
export class DocumentsModule {}
