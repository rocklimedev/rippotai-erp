import { Controller, Get, Post, Query } from '@nestjs/common';

import { BoqSearchService } from '@/modules/search/services/boq-search.service';
import { BriefSearchService } from './services/brief-search.service';
import { CalendarSearchService } from '@/modules/search/services/calendar-search.service';
import { ClientSearchService } from '@/modules/search/services/client-search.service';
import { LeadSearchService } from '@/modules/search/services/lead-search.service';
import { ProjectSearchService } from '@/modules/search/services/project-search.service';
import { QuotationSearchService } from '@/modules/search/services/quotation-search.service';
import { SiteRecceSearchService } from './services/reki-search.service';
import { TaskSearchService } from '@/modules/search/services/task-search.service';
import { UserSearchService } from '@/modules/search/services/user-search.service';
import { VendorSearchService } from '@/modules/search/services/vendor-search.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly boqSearch: BoqSearchService,
    private readonly briefSearch: BriefSearchService,
    private readonly calendarSearch: CalendarSearchService,
    private readonly clientSearch: ClientSearchService,
    private readonly leadSearch: LeadSearchService,
    private readonly projectSearch: ProjectSearchService,
    private readonly quotationSearch: QuotationSearchService,
    private readonly siteRecceSearch: SiteRecceSearchService,
    private readonly taskSearch: TaskSearchService,
    private readonly userSearch: UserSearchService,
    private readonly vendorSearch: VendorSearchService,
  ) {}

  // ==========================================================
  // GLOBAL SEARCH
  // ==========================================================

  @Get()
  async globalSearch(@Query('q') q: string) {
    const [
      boqs,
      briefs,
      calendar,
      clients,
      leads,
      projects,
      quotations,
      siteRecce,
      tasks,
      users,
      vendors,
    ] = await Promise.all([
      this.boqSearch.search(q),
      this.briefSearch.search(q),
      this.calendarSearch.search(q),
      this.clientSearch.search(q),
      this.leadSearch.search(q),
      this.projectSearch.search(q),
      this.quotationSearch.search(q),
      this.siteRecceSearch.search(q),
      this.taskSearch.search(q),
      this.userSearch.search(q),
      this.vendorSearch.search(q),
    ]);

    return {
      boqs,
      briefs,
      calendar,
      clients,
      leads,
      projects,
      quotations,
      siteRecce,
      tasks,
      users,
      vendors,
    };
  }

  // ==========================================================
  // INDIVIDUAL SEARCHES
  // ==========================================================

  @Get('boqs')
  searchBoqs(@Query('q') q: string) {
    return this.boqSearch.search(q);
  }

  @Get('briefs')
  searchBriefs(@Query('q') q: string) {
    return this.briefSearch.search(q);
  }

  @Get('calendar')
  searchCalendar(@Query('q') q: string) {
    return this.calendarSearch.search(q);
  }

  @Get('clients')
  searchClients(@Query('q') q: string) {
    return this.clientSearch.search(q);
  }

  @Get('leads')
  searchLeads(@Query('q') q: string) {
    return this.leadSearch.search(q);
  }

  @Get('projects')
  searchProjects(@Query('q') q: string) {
    return this.projectSearch.search(q);
  }

  @Get('quotations')
  searchQuotations(@Query('q') q: string) {
    return this.quotationSearch.search(q);
  }

  @Get('site-recce')
  searchSiteRecce(@Query('q') q: string) {
    return this.siteRecceSearch.search(q);
  }

  @Get('tasks')
  searchTasks(@Query('q') q: string) {
    return this.taskSearch.search(q);
  }

  @Get('users')
  searchUsers(@Query('q') q: string) {
    return this.userSearch.search(q);
  }

  @Get('vendors')
  searchVendors(@Query('q') q: string) {
    return this.vendorSearch.search(q);
  }

  // ==========================================================
  // REINDEX
  // ==========================================================

  @Post('reindex/all')
  async reindexAll() {
    await Promise.all([
      this.boqSearch.reindexAll(),
      this.briefSearch.reindexAll(),
      this.calendarSearch.reindexAll(),
      this.clientSearch.reindexAll(),
      this.leadSearch.reindexAll(),
      this.projectSearch.reindexAll(),
      this.quotationSearch.reindexAll(),
      this.siteRecceSearch.reindexAll(),
      this.taskSearch.reindexAll(),
      this.userSearch.reindexAll(),
      this.vendorSearch.reindexAll(),
    ]);

    return {
      success: true,
      message: 'All Elasticsearch indexes rebuilt successfully.',
    };
  }

  @Post('reindex/boqs')
  reindexBoqs() {
    return this.boqSearch.reindexAll();
  }

  @Post('reindex/briefs')
  reindexBriefs() {
    return this.briefSearch.reindexAll();
  }

  @Post('reindex/calendar')
  reindexCalendar() {
    return this.calendarSearch.reindexAll();
  }

  @Post('reindex/clients')
  reindexClients() {
    return this.clientSearch.reindexAll();
  }

  @Post('reindex/leads')
  reindexLeads() {
    return this.leadSearch.reindexAll();
  }

  @Post('reindex/projects')
  reindexProjects() {
    return this.projectSearch.reindexAll();
  }

  @Post('reindex/quotations')
  reindexQuotations() {
    return this.quotationSearch.reindexAll();
  }

  @Post('reindex/site-recce')
  reindexSiteRecce() {
    return this.siteRecceSearch.reindexAll();
  }

  @Post('reindex/tasks')
  reindexTasks() {
    return this.taskSearch.reindexAll();
  }

  @Post('reindex/users')
  reindexUsers() {
    return this.userSearch.reindexAll();
  }

  @Post('reindex/vendors')
  reindexVendors() {
    return this.vendorSearch.reindexAll();
  }
}
