// This registry is imported only by the child process, never by the HTTP job
// producer. It is an allow-list, not a module/method name supplied by clients.
import { BoqController } from '../boqs/boq.controller';
import { QuotationsController } from '../quotations/quotations.controller';
import { ProjectShortlistController } from '../vendors/project-shortlist.controller';
import { ProjectPlannerController } from '../projects/project-planner.controller';
import { TasksController } from '../tasks/task.controller';
import { AdminDailyReportController } from '../site-operations/admin-daily-report.controller';
import { AdminDprDocumentController } from '../site-operations/admin-dpr-document.controller';
import { SnagListController } from '../site-operations/snag-list.controller';
import { ClientPortalController } from '../client-portal/client-portal.controller';

export const EXPORT_HANDLERS = {
  'boq-excel': [BoqController, 'exportExcel'],
  'boq-pdf': [BoqController, 'exportPdf'],
  'boq-thumbnail': [BoqController, 'exportPdfThumbnail'],
  'quotation-excel': [QuotationsController, 'exportExcel'],
  'shortlist-excel': [ProjectShortlistController, 'exportOne'],
  'shortlist-both': [ProjectShortlistController, 'exportBoth'],
  'planner-excel': [ProjectPlannerController, 'downloadWorkbook'],
  'crucial-work': [TasksController, 'exportCrucialWork'],
  'admin-dpr-export': [AdminDailyReportController, 'export'],
  'admin-dpr-save': [AdminDprDocumentController, 'create'],
  'snag-create': [SnagListController, 'create'],
  'snag-update': [SnagListController, 'update'],
  'handover-prepare': [ClientPortalController, 'prepare'],
} as const;
