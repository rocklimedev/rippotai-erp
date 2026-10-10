import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Req,
  Logger,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { GlobalSearchService } from './global-search.service';
import { AutocompleteService } from './autocomplete.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { SearchScopeService } from './search-scope.service';
import { isSearchAdmin } from './search-access';
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
@UseGuards(JwtAuthGuard)
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
    private readonly scope: SearchScopeService,
  ) {}

  // ================================================================
  // GLOBAL SEARCH
  // ================================================================

  @RequirePermission('search:read')
  @Get()
  async search(@Query() query: GlobalSearchQueryDto, @Req() req: any) {
    const user = await this.scope.resolve(req.user);
    return this.globalSearch.search(query, user);
  }

  // ================================================================
  // AUTOCOMPLETE
  // ================================================================

  @RequirePermission('search:read')
  @Get('suggest')
  async suggest(@Query() query: SuggestQueryDto, @Req() req: any) {
    const user = await this.scope.resolve(req.user);
    return {
      suggestions: await this.autocomplete.suggest(query, user),
    };
  }

  // ================================================================
  // ENTITY-SPECIFIC SEARCH
  // ================================================================

  @RequirePermission('search:read')
  @Get('projects')
  searchProjects(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('project', q, req);
  }

  @RequirePermission('search:read')
  @Get('clients')
  searchClients(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('client', q, req);
  }

  @RequirePermission('search:read')
  @Get('users')
  searchUsers(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('user', q, req);
  }

  @RequirePermission('search:read')
  @Get('leads')
  searchLeads(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('lead', q, req);
  }

  @RequirePermission('search:read')
  @Get('vendors')
  searchVendors(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('vendor', q, req);
  }

  @RequirePermission('search:read')
  @Get('boqs')
  searchBoqs(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('boq', q, req);
  }

  @RequirePermission('search:read')
  @Get('briefs')
  searchBriefs(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('project_brief', q, req);
  }

  @RequirePermission('search:read')
  @Get('quotations')
  searchQuotations(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('quotation', q, req);
  }

  @RequirePermission('search:read')
  @Get('site-recces')
  searchSiteRecces(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('site_recce', q, req);
  }

  @RequirePermission('search:read')
  @Get('tasks')
  searchTasks(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('task', q, req);
  }

  @RequirePermission('search:read')
  @Get('calendar')
  searchCalendar(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('calendar_event', q, req);
  }

  @RequirePermission('search:read')
  @Get('documents')
  searchDocuments(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('document', q, req);
  }

  @RequirePermission('search:read')
  @Get('drawings')
  searchDrawings(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('drawing', q, req);
  }

  @RequirePermission('search:read')
  @Get('work-orders')
  searchWorkOrders(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('work_order', q, req);
  }

  @RequirePermission('search:read')
  @Get('delivery-challans')
  searchDeliveryChallans(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('delivery_challan', q, req);
  }

  @RequirePermission('search:read')
  @Get('budget-estimates')
  searchBudgetEstimates(@Query('q') q: string, @Req() req: any) {
    return this.searchEntity('budget_estimate', q, req);
  }

  // ================================================================
  // REINDEX
  // ================================================================

  @RequirePermission('search:reindex')
  @Post('reindex/all')
  async reindexAll(@Req() req: any) {
    this.requireAdmin(req);
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

  @RequirePermission('search:reindex')
  @Post('reindex/:entity')
  async reindexEntity(@Param('entity') entity: string, @Req() req: any) {
    this.requireAdmin(req);
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

  @RequirePermission('search:read')
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

  private requireAdmin(req: any) {
    if (!isSearchAdmin({ id: req.user?.id, role: req.user?.roleName })) {
      throw new ForbiddenException('Only administrators can reindex search');
    }
  }

  private async searchEntity(type: string, q: string, req: any) {
    const user = await this.scope.resolve(req.user);
    if (!q?.trim()) return [];
    const result = await this.globalSearch.search({ q, types: type }, user);
    return result.results.map((hit) => ({
      ...hit.meta,
      id: hit.id,
      score: hit.score,
    }));
  }
}
