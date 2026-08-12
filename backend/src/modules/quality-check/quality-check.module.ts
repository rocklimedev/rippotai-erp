import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { DailySiteReport } from './models/daily-site-report.model';
import { DesignClarification } from './models/design-clarification.model';
import { PhaseQcSignoff } from './models/phase-qc-signoff.model';
import { QcChecklistTemplate } from './models/qc-checklist-template.model';
import { QcChecklistItem } from './models/qc-checklist-item.model';
import { SiteMockup } from './models/site-mockup.model';
import { SiteVisitLog } from './models/site-visit-log.model';

// Services
import { DailySiteReportsService } from './daily-site-reports.service';
import { DesignClarificationsService } from './design-clarifications.service';
import { PhaseQcSignoffsService } from './phase-qc-signoffs.service';
import { QcChecklistTemplatesService } from './qc-checklist-templates.service';
import { QcChecklistItemsService } from './qc-checklist-items.service';
import { SiteMockupsService } from './site-mockups.service';
import { SiteVisitLogsService } from './site-visit-logs.service';

// Controllers
import { DailySiteReportsController } from './daily-site-reports.controller';
import { DesignClarificationsController } from './design-clarifications.controller';
import { PhaseQcSignoffsController } from './phase-qc-signoffs.controller';
import { QcChecklistTemplatesController } from './qc-checklist-templates.controller';
import { QcChecklistItemsController } from './qc-checklist-items.controller';
import { SiteMockupsController } from './site-mockups.controller';
import { SiteVisitLogsController } from './site-visit-logs.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DailySiteReport,
      DesignClarification,
      PhaseQcSignoff,
      QcChecklistTemplate,
      QcChecklistItem,
      SiteMockup,
      SiteVisitLog,
    ]),
  ],

  controllers: [
    DailySiteReportsController,
    DesignClarificationsController,
    PhaseQcSignoffsController,
    QcChecklistTemplatesController,
    QcChecklistItemsController,
    SiteMockupsController,
    SiteVisitLogsController,
  ],

  providers: [
    DailySiteReportsService,
    DesignClarificationsService,
    PhaseQcSignoffsService,
    QcChecklistTemplatesService,
    QcChecklistItemsService,
    SiteMockupsService,
    SiteVisitLogsService,
  ],

  exports: [
    DailySiteReportsService,
    DesignClarificationsService,
    PhaseQcSignoffsService,
    QcChecklistTemplatesService,
    QcChecklistItemsService,
    SiteMockupsService,
    SiteVisitLogsService,
    SequelizeModule,
  ],
})
export class QualityCheckModule {}
