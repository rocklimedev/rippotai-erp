import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Req,
  Logger,
} from '@nestjs/common';
import { GlobalSearchService, SearchUserContext } from './global-search.service';
import { AutocompleteService } from './autocomplete.service';
import { GlobalSearchQueryDto, SuggestQueryDto } from './dto/global-search.dto';

import { ProjectSearchService } from './services/project-search.service';
import { ClientSearchService } from './services/client-search.service';
import { UserSearchService } from './services/user-search.service';
import { LeadSearchService } from './services/lead-search.service';
import { VendorSearchService } from './services/vendor-search.service';
import { BoqSearchService } from './services/boq-search.service';
import { BriefSearchService } from './services/brief-search.service';
import { QuotationSearchService } from './services/quotation-search.service';
import { SiteRecceSearchService } from './services/site-recce-search.service';
import { TaskSearchService } from './services/task-search.service';
import { CalendarSearchService } from './services/calendar-search.service';
import { DocumentSearchService } from './services/document-search.service';
import { DrawingSearchService } from './services/drawing-search.service';
import { WorkOrderSearchService } from './services/work-order-search.service';
import { DeliveryChallanSearchService } from './services/delivery-challan-search.service';
import { BudgetEstimateSearchService } from './services/budget-estimate-search.service';

@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly globalSearch: GlobalSearchService,
    private readonly autocomplete: AutocompleteService,
    private readonly projectSearch: ProjectSearchService,
    private readonly clientSearch: ClientSearchService,
    private readonly userSearch: UserSearchService,
    private readonly leadSearch: LeadSearchService,
    private readonly vendorSearch: VendorSearchService,
    private readonly boqSearch: BoqSearchService,
    private readonly briefSearch: BriefSearchService,
    private readonly quotationSearch: QuotationSearchService,
    private readonly siteRecceSearch: SiteRecceSearchService,
    private readonly taskSearch: TaskSearchService,
    private readonly calendarSearch: CalendarSearchService,
    private readonly documentSearch: DocumentSearchService,
    private readonly drawingSearch: DrawingSearchService,
    private readonly workOrderSearch: WorkOrderSearchService,
    private readonly deliveryChallanSearch: DeliveryChallanSearchService,
    private readonly budgetEstimateSearch: BudgetEstimateSearchService,
  ) {}

  // ================================================================
  // GLOBAL SEARCH
  // ================================================================

  @Get()
  async search(@Query() query: GlobalSearchQueryDto, @Req() req: any) {
    const user = this.extractUser(req);
    return this.globalSearch.search(query, user);
  }

  // ================================================================
  // AUTOCOMPLETE
  // ================================================================

  @Get('suggest')
  async suggest(@Query() query: SuggestQueryDto, @Req() req: any) {
    const user = this.extractUser(req);
    return {
      suggestions: await this.autocomplete.suggest(query, user),
    };
  }

  // ================================================================
  // ENTITY-SPECIFIC SEARCH
  // ================================================================

  @Get('projects')
  searchProjects(@Query('q') q: string) {
    return this.projectSearch.search(q);
  }

  @Get('clients')
  searchClients(@Query('q') q: string) {
    return this.clientSearch.search(q);
  }

  @Get('users')
  searchUsers(@Query('q') q: string) {
    return this.userSearch.search(q);
  }

  @Get('leads')
  searchLeads(@Query('q') q: string) {
    return this.leadSearch.search(q);
  }

  @Get('vendors')
  searchVendors(@Query('q') q: string) {
    return this.vendorSearch.search(q);
  }

  @Get('boqs')
  searchBoqs(@Query('q') q: string) {
    return this.boqSearch.search(q);
  }

  @Get('briefs')
  searchBriefs(@Query('q') q: string) {
    return this.briefSearch.search(q);
  }

  @Get('quotations')
  searchQuotations(@Query('q') q: string) {
    return this.quotationSearch.search(q);
  }

  @Get('site-recces')
  searchSiteRecces(@Query('q') q: string) {
    return this.siteRecceSearch.search(q);
  }

  @Get('tasks')
  searchTasks(@Query('q') q: string) {
    return this.taskSearch.search(q);
  }

  @Get('calendar')
  searchCalendar(@Query('q') q: string) {
    return this.calendarSearch.search(q);
  }

  @Get('documents')
  searchDocuments(@Query('q') q: string) {
    return this.documentSearch.search(q);
  }

  @Get('drawings')
  searchDrawings(@Query('q') q: string) {
    return this.drawingSearch.search(q);
  }

  @Get('work-orders')
  searchWorkOrders(@Query('q') q: string) {
    return this.workOrderSearch.search(q);
  }

  @Get('delivery-challans')
  searchDeliveryChallans(@Query('q') q: string) {
    return this.deliveryChallanSearch.search(q);
  }

  @Get('budget-estimates')
  searchBudgetEstimates(@Query('q') q: string) {
    return this.budgetEstimateSearch.search(q);
  }

  // ================================================================
  // REINDEX
  // ================================================================

  @Post('reindex/all')
  async reindexAll() {
    const jobs: Array<[string, () => Promise<any>]> = [
      ['projects', () => this.projectSearch.reindexAll()],
      ['clients', () => this.clientSearch.reindexAll()],
      ['users', () => this.userSearch.reindexAll()],
      ['leads', () => this.leadSearch.reindexAll()],
      ['vendors', () => this.vendorSearch.reindexAll()],
      ['boqs', () => this.boqSearch.reindexAll()],
      ['briefs', () => this.briefSearch.reindexAll()],
      ['quotations', () => this.quotationSearch.reindexAll()],
      ['site_recces', () => this.siteRecceSearch.reindexAll()],
      ['tasks', () => this.taskSearch.reindexAll()],
      ['calendar_events', () => this.calendarSearch.reindexAll()],
      ['documents', () => this.documentSearch.reindexAll()],
      ['drawings', () => this.drawingSearch.reindexAll()],
      ['work_orders', () => this.workOrderSearch.reindexAll()],
      ['delivery_challans', () => this.deliveryChallanSearch.reindexAll()],
      ['budget_estimates', () => this.budgetEstimateSearch.reindexAll()],
    ];

    const results: Record<string, any> = {};
    const failures: string[] = [];

    for (const [name, job] of jobs) {
      try {
        results[name] = await job();
      } catch (e: any) {
        this.logger.error(`Reindex failed for ${name}`, e?.stack ?? e);
        results[name] = { error: e?.message ?? String(e) };
        failures.push(name);
      }
    }

    return {
      success: failures.length === 0,
      message:
        failures.length === 0
          ? 'All indices rebuilt successfully.'
          : `Reindex completed with failures: ${failures.join(', ')}`,
      results,
    };
  }

  @Post('reindex/:entity')
  async reindexEntity(@Param('entity') entity: string) {
    const map: Record<string, () => Promise<any>> = {
      projects: () => this.projectSearch.reindexAll(),
      clients: () => this.clientSearch.reindexAll(),
      users: () => this.userSearch.reindexAll(),
      leads: () => this.leadSearch.reindexAll(),
      vendors: () => this.vendorSearch.reindexAll(),
      boqs: () => this.boqSearch.reindexAll(),
      briefs: () => this.briefSearch.reindexAll(),
      quotations: () => this.quotationSearch.reindexAll(),
      'site-recces': () => this.siteRecceSearch.reindexAll(),
      tasks: () => this.taskSearch.reindexAll(),
      calendar: () => this.calendarSearch.reindexAll(),
      documents: () => this.documentSearch.reindexAll(),
      drawings: () => this.drawingSearch.reindexAll(),
      'work-orders': () => this.workOrderSearch.reindexAll(),
      'delivery-challans': () => this.deliveryChallanSearch.reindexAll(),
      'budget-estimates': () => this.budgetEstimateSearch.reindexAll(),
    };

    const job = map[entity];
    if (!job) {
      return {
        success: false,
        message: `Unknown entity "${entity}". Supported: ${Object.keys(map).join(', ')}`,
      };
    }

    try {
      const result = await job();
      return { success: true, entity, result };
    } catch (e: any) {
      this.logger.error(`Reindex failed for ${entity}`, e?.stack ?? e);
      return {
        success: false,
        entity,
        error: e?.message ?? String(e),
      };
    }
  }

  // ================================================================
  // HEALTH
  // ================================================================

  @Get('health')
  health() {
    return {
      status: 'ok',
      module: 'search-v2',
      entities: [
        'projects',
        'clients',
        'users',
        'leads',
        'vendors',
        'boqs',
        'briefs',
        'quotations',
        'site_recces',
        'tasks',
        'calendar_events',
        'documents',
        'drawings',
        'work_orders',
        'delivery_challans',
        'budget_estimates',
      ],
    };
  }

  // ================================================================
  // HELPERS
  // ================================================================

  private extractUser(req: any): SearchUserContext {
    const u = req.user ?? {};
    return {
      id: u.id ?? u.sub ?? 'anonymous',
      role: u.role ?? u.roleName,
      isAdmin:
        u.isAdmin === true ||
        u.role === 'admin' ||
        u.role === 'ADMIN' ||
        (Array.isArray(u.roles) &&
          (u.roles.includes('admin') || u.roles.includes('ADMIN'))),
      projectIds: u.projectIds ?? u.allowedProjectIds ?? [],
    };
  }
}
