import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

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

// Quality Checklist (detailed Before/During/After per work head)
import { QualityChecklist } from './models/quality-checklist.model';
import { QualityChecklistItem } from './models/quality-checklist-item.model';
import { QualityChecklistTemplate } from './models/quality-checklist-template.model';

// Architect visit schedule + simple quality heads (from the two Excel workbooks)
import { ArchitectVisitStage } from './models/architect-visit-stage.model';
import { ArchitectSiteVisit } from './models/architect-site-visit.model';
import { QualityCheckHead } from './models/quality-check-head.model';
import { ProjectQualityCheck } from './models/project-quality-check.model';
import { SnagItem } from './models/snag-item.model';

// Models — shared
import { Project } from '@/modules/projects/models/projects.model';
import { Team } from '../process-workflow/models/team.model';
import { Step } from '../process-workflow/models/step.model';

// Services
import { ChecklistService } from './checklist.service';
import { QualityChecklistService } from './quality-checklist.service';
import { QualityService } from './quality.service';
import { QcSignOffService } from './qc-sign-off.service';
import { DailySiteReportService } from './daily-site-report.service';
import { SiteVisitService } from './site-visit.service';
import { VisitStageService } from './visit-stage.service';
import { MockupService } from './mockup.service';
import { RfiService } from './rfi.service';
import { SnagService } from './snag.service';
import { ArchitectSeedService } from './architect-seed.service';

// Controllers
import { ChecklistController, QcSignOffController } from './qc.controller';
import { QualityChecklistController } from './quality-checklist.controller';
import { QualityController } from './quality.controller';
import { DailySiteReportController } from './daily-site-report.controller';
import { SiteVisitController } from './site-visit.controller';
import { VisitStageController } from './visit-stage.controller';
import { MockupController } from './mockup.controller';
import { RfiController } from './rfi.controller';
import { SnagController } from './snag.controller';

/**
 * Site Operations — Quality, Reporting, Architect visits & Mockups.
 *
 * Data sources (Excel → DB):
 *  1. ARCHITECT SITEVISIT SCHEDULE.xlsx
 *     - "Architect visit schedule" → architect_visit_stages (seeded)
 *     - "Quality check list"       → quality_check_heads (seeded)
 *     - "Snag list"                → snag_items (per project)
 *  2. QUALITY CHECK LIST.xlsx
 *     - "QC -Work heads"           → aligns with WorkHead enum + quality_check_heads
 *     - Detailed sheets            → WORK_HEAD_CHECKPOINTS → quality_checklists / items
 *
 * Covers:
 *  1. QC checklist templates (trade-level)
 *  2. Detailed quality checklists (Before/During/After per work head)
 *  3. Simple quality check heads (project pass/fail list)
 *  4. Architect visit stages + site visits + snags
 *  5. Phase QC sign-off
 *  6. Daily site reports, mockups, RFIs
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      // Trade QC templates
      ChecklistTemplate,
      ChecklistTemplateItem,
      QcSignOff,
      QcSignOffItemResult,

      // Reporting / visits (generic)
      DailySiteReport,
      ManpowerEntry,
      VisitAssignment,
      SiteVisitLog,
      Mockup,
      Rfi,

      // Detailed quality checklists (phased checkpoints)
      QualityChecklist,
      QualityChecklistItem,
      QualityChecklistTemplate,

      // Architect schedule + simple quality heads + snags
      ArchitectVisitStage,
      ArchitectSiteVisit,
      QualityCheckHead,
      ProjectQualityCheck,
      SnagItem,

      // Shared
      Project,
      Team,
      Step,
    ]),
  ],

  controllers: [
    ChecklistController,
    QcSignOffController,
    QualityChecklistController,
    QualityController,
    VisitStageController,
    DailySiteReportController,
    SiteVisitController,
    MockupController,
    RfiController,
    SnagController,
  ],

  providers: [
    ChecklistService,
    QualityChecklistService,
    QualityService,
    QcSignOffService,
    DailySiteReportService,
    SiteVisitService,
    VisitStageService,
    MockupService,
    RfiService,
    SnagService,
    ArchitectSeedService, // seeds visit stages + quality check heads on boot
  ],

  exports: [
    ChecklistService,
    QualityChecklistService,
    QualityService,
    QcSignOffService,
    DailySiteReportService,
    SiteVisitService,
    VisitStageService,
    MockupService,
    RfiService,
    SnagService,
  ],
})
export class SiteOperationsModule {}
