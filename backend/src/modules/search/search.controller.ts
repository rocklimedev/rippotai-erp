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
    const keys = [
      'boqs',
      'briefs',
      'calendar',
      'clients',
      'leads',
      'projects',
      'quotations',
      'siteRecce',
      'tasks',
      'users',
      'vendors',
    ] as const;

    const results = await Promise.allSettled([
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

    const output: Record<string, any> = {};

    results.forEach((result, i) => {
      const key = keys[i];
      if (result.status === 'fulfilled') {
        output[key] = result.value;
      } else {
        output[key] = [];
        // Keep this log — it's how you'll notice a category silently
        // going empty instead of failing the whole global search.
        console.error(
          `[globalSearch] "${key}" failed:`,
          result.reason?.message ?? result.reason,
        );
      }
    });

    return output;
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
    const jobs = [
      ['boqs', this.boqSearch.reindexAll()],
      ['briefs', this.briefSearch.reindexAll()],
      ['calendar', this.calendarSearch.reindexAll()],
      ['clients', this.clientSearch.reindexAll()],
      ['leads', this.leadSearch.reindexAll()],
      ['projects', this.projectSearch.reindexAll()],
      ['quotations', this.quotationSearch.reindexAll()],
      ['siteRecce', this.siteRecceSearch.reindexAll()],
      ['tasks', this.taskSearch.reindexAll()],
      ['users', this.userSearch.reindexAll()],
      ['vendors', this.vendorSearch.reindexAll()],
    ] as const;

    const results = await Promise.allSettled(jobs.map(([, job]) => job));

    const failures = results
      .map((r, i) => ({ name: jobs[i][0], result: r }))
      .filter((r) => r.result.status === 'rejected');

    if (failures.length) {
      failures.forEach((f) =>
        console.error(
          `[reindexAll] "${f.name}" failed:`,
          (f.result as PromiseRejectedResult).reason,
        ),
      );
    }

    return {
      success: failures.length === 0,
      message:
        failures.length === 0
          ? 'All Elasticsearch indexes rebuilt successfully.'
          : `Reindex completed with ${failures.length} failure(s): ${failures.map((f) => f.name).join(', ')}`,
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
