import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QualityChecklist } from './models/quality-checklist.model';
import { QualityChecklistItem } from './models/quality-checklist-item.model';
// Models — this module's own
import { ChecklistTemplate } from './models/checklist-template.model';
import { ChecklistTemplateItem } from './models/checklist-template-item.model';
import { QcSignOff } from './models/qc-sign-off.model';
import { QcSignOffItemResult } from './models/qc-sign-off-item-result.model';
import { DailySiteReport } from './models/daily-site-report.model';
import { ManpowerEntry } from './models/manpower-entry.model';
import { VisitAssignment } from './models/visit-assignment.model';
import { SiteVisitLog } from './models/site-visit-log.model';
import { Mockup } from './models/mockup.model';
import { Rfi } from './models/rfi.model';
import { QualityChecklistTemplate } from './models/quality-checklist-template.model';
// Models — shared, from the Process Workflow Engine module
import { Project } from '@/modules/projects/models/projects.model';
import { Team } from '../process-workflow/models/team.model';
import { Step } from '../process-workflow/models/step.model';
import { QualityService } from './quality.service';
// Services
import { ChecklistService } from './checklist.service';
import { QcSignOffService } from './qc-sign-off.service';
import { DailySiteReportService } from './daily-site-report.service';
import { SiteVisitService } from './site-visit.service';
import { MockupService } from './mockup.service';
import { RfiService } from './rfi.service';
import { QualityCheckHead } from './models/quality-check-head.model';
// Controllers
import { ChecklistController, QcSignOffController } from './qc.controller';
import {
  DailySiteReportController,
  SiteOpsDashboardController,
} from './daily-site-report.controller';
import { SiteOpsDashboardService } from './site-ops-dashboard.service';
import { CdnModule } from '../cdn/cdn.module';
import { SiteVisitController } from './site-visit.controller';
import { MockupController } from './mockup.controller';
import { RfiController } from './rfi.controller';
import { VisitStageService } from './visit-stage.service';
import { VisitStageController } from './visit-stage.controller';
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import { ArchitectSiteVisit } from './models/architect-site-visit.model';
import { SnagItem } from './models/snag-item.model';
import { QualityChecklistController } from './quality-checklist.controller';
import { QualityChecklistService } from './quality-checklist.service';
import { ProjectQualityCheck } from './models/project-quality-check.model';
import { QualityController } from './quality.controller';
/**
 * Site Operations — Quality, Reporting & Mockups.
 *
 * Covers:
 *  1. QC checklist templates (reusable, trade-specific, gate handoff between trades)
 *  2. Phase QC sign-off (pass/fail/rework, checking user + timestamp)
 *  3. Daily site reports (weather, manpower, work completed, issues)
 *  4. Site visit log (Supervisor/Architect/vendor/contractor/client, centrally assigned)
 *  5. Site mockups (proposed -> reviewed -> approved before volume rollout)
 *  6. Design clarifications / RFIs (raised, routed to Architect, closed with response)
 *
 * Depends on Project / Team / Step from the Process Workflow Engine module —
 * import ProcessWorkflowModule (or just its SequelizeModule.forFeature) alongside this.
 */
@Module({
  imports: [
    CdnModule,
    SequelizeModule.forFeature([
      // this module's models
      ChecklistTemplate,
      ChecklistTemplateItem,
      QcSignOff,
      QcSignOffItemResult,
      DailySiteReport,
      ManpowerEntry,
      VisitAssignment,
      SiteVisitLog,
      Mockup,
      Rfi,
      // shared models this module references
      Project,
      Team, // Quality Checklist
      QualityChecklist,
      QualityChecklistItem,
      QualityChecklistTemplate,
      QualityCheckHead,
      ProjectQualityCheck,
      Step,
      ArchitectVisitStage,
      ArchitectSiteVisit,
      SnagItem,
    ]),
  ],
  controllers: [
    ChecklistController,
    QcSignOffController,
    QualityChecklistController,
    DailySiteReportController,
    SiteOpsDashboardController,
    SiteVisitController,
    MockupController,
    QualityController,
    RfiController,
    VisitStageController,
  ],
  providers: [
    SiteOpsDashboardService,
    ChecklistService,
    QcSignOffService,
    QualityChecklistService,
    QualityService,
    DailySiteReportService,
    SiteVisitService,
    MockupService,
    RfiService,
    VisitStageService,
  ],
  exports: [
    ChecklistService,
    QualityChecklistService,
    QcSignOffService,
    DailySiteReportService,
    SiteVisitService,
    MockupService,
    RfiService,
    VisitStageService,
  ],
})
export class SiteOperationsModule {}
