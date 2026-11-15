import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ProjectSearchService } from './services/project-search.service';
import { ClientSearchService } from './services/client-search.service';
import { UserSearchService } from './services/user-search.service';
import { LeadSearchService } from './services/lead-search.service';
import { VendorSearchService } from './services/vendor-search.service';
import { BoqSearchService } from './services/boq-search.service';
import { BriefSearchService } from './services/brief-search.service';
import { SiteRecceSearchService } from './services/site-recce-search.service';
import { TaskSearchService } from './services/task-search.service';
import { CalendarSearchService } from './services/calendar-search.service';
import { DocumentSearchService } from './services/document-search.service';
import { DrawingSearchService } from './services/drawing-search.service';
import { WorkOrderSearchService } from './services/work-order-search.service';
import { DeliveryChallanSearchService } from './services/delivery-challan-search.service';
import { BudgetEstimateSearchService } from './services/budget-estimate-search.service';
import { Project } from '../projects/models/projects.model';
import { Client } from '../clients/models/client.model';
import { User } from '../users/models/user.model';
import { Lead } from '../leads/models/lead.model';
import { Vendor } from '../vendors/models/vendors.model';
import { Boq } from '../boqs/models/boq.model';
import { ProjectBrief } from '../brief/models/project-brief.model';
import { SiteRecce } from '../reki/models/site-recce.model';
import { Task } from '../tasks/models/task.model';
import { CalendarEvent } from '../calendar/models/calender-event.model';
import { Document } from '../documents/models/document.model';
import { Drawing } from '../documents/models/drawing.model';
import { WorkOrder } from '../material-procurement/models/work-order.model';
import { DeliveryChallan } from '../material-procurement/models/delivery-challan.model';
import { BudgetEstimate } from '../budget-estimate/models/budget-estimate.model';

interface Indexer {
  indexOne(id: string): Promise<void>;
  reindexAll(): Promise<unknown>;
}

/**
 * Keeps the private search table in step with the ERP data:
 * - builds the index on first start when it is empty (fresh install / upgrade),
 * - re-indexes a record after it is created, updated or deleted,
 * - runs a full rebuild periodically to catch bulk/raw-SQL changes.
 */
@Injectable()
export class SearchSyncService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SearchSyncService.name);
  private timer?: NodeJS.Timeout;
  private rebuilding = false;
  private readonly pairs: [any, Indexer][];

  constructor(
    @InjectConnection() private readonly db: Sequelize,
    project: ProjectSearchService,
    client: ClientSearchService,
    user: UserSearchService,
    lead: LeadSearchService,
    vendor: VendorSearchService,
    boq: BoqSearchService,
    brief: BriefSearchService,
    recce: SiteRecceSearchService,
    task: TaskSearchService,
    calendar: CalendarSearchService,
    document: DocumentSearchService,
    drawing: DrawingSearchService,
    workOrder: WorkOrderSearchService,
    challan: DeliveryChallanSearchService,
    estimate: BudgetEstimateSearchService,
  ) {
    this.pairs = [
      [Project, project],
      [Client, client],
      [User, user],
      [Lead, lead],
      [Vendor, vendor],
      [Boq, boq],
      [ProjectBrief, brief],
      [SiteRecce, recce],
      [Task, task],
      [CalendarEvent, calendar],
      [Document, document],
      [Drawing, drawing],
      [WorkOrder, workOrder],
      [DeliveryChallan, challan],
      [BudgetEstimate, estimate],
    ];
  }

  onApplicationBootstrap() {
    if (process.env.SEARCH_SYNC_DISABLED === 'true') return;
    for (const [model, indexer] of this.pairs) this.attachHooks(model, indexer);
    void this.rebuildIfEmpty();
    const minutes = Number(process.env.SEARCH_REBUILD_MINUTES || 30);
    if (minutes > 0) {
      this.timer = setInterval(() => void this.rebuildAll(), minutes * 60_000);
      this.timer.unref?.();
    }
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private attachHooks(model: any, indexer: Indexer) {
    const sync = (instance: any, options: any) => {
      const id = instance?.get?.('id') ?? instance?.id;
      if (!id) return;
      const run = () =>
        indexer
          .indexOne(String(id))
          .catch((e) =>
            this.logger.warn(`index ${model.name}#${id}: ${e?.message ?? e}`),
          );
      const tx = options?.transaction;
      if (tx?.afterCommit) tx.afterCommit(() => void run());
      else setImmediate(() => void run());
    };
    model.addHook('afterCreate', 'searchSyncCreate', sync);
    model.addHook('afterUpdate', 'searchSyncUpdate', sync);
    model.addHook('afterDestroy', 'searchSyncDestroy', sync);
  }

  private async rebuildIfEmpty() {
    try {
      const rows: any[] = await this.db.query(
        'SELECT COUNT(*) AS n FROM erp_search_documents',
        { type: QueryTypes.SELECT },
      );
      if (Number(rows?.[0]?.n ?? 0) === 0) await this.rebuildAll();
    } catch (e: any) {
      this.logger.warn(`search index check skipped: ${e?.message ?? e}`);
    }
  }

  async rebuildAll() {
    if (this.rebuilding) return;
    this.rebuilding = true;
    try {
      for (const [model, indexer] of this.pairs) {
        try {
          await indexer.reindexAll();
        } catch (e: any) {
          this.logger.warn(`reindex ${model.name}: ${e?.message ?? e}`);
        }
      }
    } finally {
      this.rebuilding = false;
    }
  }
}
