import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Documents
import { Document } from './models/document.model';
import { DocumentAttachment } from './models/document-attachment.model';
import { DocumentVersion } from './models/document-version.model';
import { DocumentType } from './models/document-type.model';
import { DocumentRequirement } from './models/document-requirement.model';
import { Drawing } from './models/drawing.model';

// Projects
import { Project } from '@/modules/projects/models/projects.model';

// Process Workflow
import { Deliverable } from '../process-workflow/models/deliverable.model';
import { ProjectDeliverableRecord } from '../process-workflow/models/project-deliverable-record.model';
import { Step } from '../process-workflow/models/step.model';
import { Phase } from '../process-workflow/models/phase.model';
import { StepTeam } from '../process-workflow/models/step-team.model';
import { ProjectStepProgress } from '../process-workflow/models/project-step-progress.model';
import { Team } from '../process-workflow/models/team.model';
import { ContinuityRole } from '../process-workflow/models/continuity-role.model';
import { GateLog } from '../process-workflow/models/gate-log.model';

// Dashboard dependencies
import { SiteRecce } from '../reki/models/site-recce.model';
import { ProjectBrief } from '../brief/models/project-brief.model';
import { Quotation } from '../quotations/models/quotations.model';
import { Boq } from '../boqs/models/boq.model';
import { Vendor } from '../vendors/models/vendors.model';

// Services
import { DocumentsService } from './document.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { DocumentRegisterService } from './document-register.service';
import { DocumentTypesService } from './document-types.service';
import { DocumentRequirementsService } from './document-requirements.service';
import { DocumentsDashboardService } from './documents-dashboard.service';

// Controllers
import { DocumentsController } from './document.controller';
import { DocumentRegisterController } from './document-register.controller';
import { DocumentTypesController } from './document-types.controller';
import { DocumentRequirementsController } from './document-requirements.controller';

// Modules
import { CdnModule } from '@/modules/cdn/cdn.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      // ============================================
      // DOCUMENTS
      // ============================================
      Document,
      DocumentAttachment,
      DocumentVersion,
      DocumentType,
      DocumentRequirement,
      Drawing,

      // ============================================
      // PROJECT
      // ============================================
      Project,

      // ============================================
      // PROCESS WORKFLOW
      // ============================================
      Deliverable,
      ProjectDeliverableRecord,
      ProjectStepProgress,
      Team,
      ContinuityRole,
      GateLog,
      Step,
      StepTeam,
      Phase,

      // ============================================
      // DOCUMENT DASHBOARD
      // ============================================
      SiteRecce,
      ProjectBrief,
      Quotation,
      Boq,
      Vendor,
    ]),

    // ============================================
    // CDN
    // ============================================
    CdnModule,
  ],

  // ============================================
  // CONTROLLERS
  // ============================================
  controllers: [
    DocumentsController,
    DocumentRegisterController,
    DocumentRequirementsController,
    DocumentTypesController,
  ],

  // ============================================
  // SERVICES
  // ============================================
  providers: [
    DocumentsService,
    PdfGeneratorService,
    DocumentRegisterService,
    DocumentTypesService,
    DocumentsDashboardService,
    DocumentRequirementsService,
  ],

  // ============================================
  // EXPORTS
  // ============================================
  exports: [DocumentsService, SequelizeModule],
})
export class DocumentsModule {}
