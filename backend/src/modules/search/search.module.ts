import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientOptions } from '@elastic/elasticsearch';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { GlobalSearchService } from './global-search.service';
import { AutocompleteService } from './autocomplete.service';
import { BulkIndexerService } from './indexing/bulk-indexer.service';

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

// Models
import { Project } from '../projects/models/projects.model';
import { Client } from '../clients/models/client.model';
import { User } from '../users/models/user.model';
import { Lead } from '../leads/models/lead.model';
import { Vendor } from '../vendors/models/vendors.model';
import { Boq } from '../boqs/models/boq.model';
import { ProjectBrief } from '../brief/models/project-brief.model';
import { Quotation } from '../quotations/models/quotations.model';
import { SiteRecce } from '../reki/models/site-recce.model';
import { Task } from '../tasks/models/task.model';
import { CalendarEvent } from '../calendar/models/calender-event.model';
import { Document } from '../documents/models/document.model';
import { Drawing } from '../documents/models/drawing.model';
import { WorkOrder } from '../material-procurement/models/work-order.model';
import { DeliveryChallan } from '../material-procurement/models/delivery-challan.model';
import { BudgetEstimate } from '../budget-estimate/models/budget-estimate.model';

@Module({
  imports: [
    ConfigModule,

    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ClientOptions => {
        const node =
          config.get<string>('ELASTICSEARCH_NODE') ?? 'http://localhost:9200';
        const username = config.get<string>('ELASTICSEARCH_USERNAME');
        const password = config.get<string>('ELASTICSEARCH_PASSWORD');

        const options: ClientOptions = { node };
        if (username && password) {
          options.auth = { username, password };
        }
        return options;
      },
    }),

    SequelizeModule.forFeature([
      Project,
      Client,
      User,
      Lead,
      Vendor,
      Boq,
      ProjectBrief,
      Quotation,
      SiteRecce,
      Task,
      CalendarEvent,
      Document,
      Drawing,
      WorkOrder,
      DeliveryChallan,
      BudgetEstimate,
    ]),
  ],

  controllers: [SearchController],

  providers: [
    SearchService,
    GlobalSearchService,
    AutocompleteService,
    BulkIndexerService,

    ProjectSearchService,
    ClientSearchService,
    UserSearchService,
    LeadSearchService,
    VendorSearchService,
    BoqSearchService,
    BriefSearchService,
    QuotationSearchService,
    SiteRecceSearchService,
    TaskSearchService,
    CalendarSearchService,
    DocumentSearchService,
    DrawingSearchService,
    WorkOrderSearchService,
    DeliveryChallanSearchService,
    BudgetEstimateSearchService,
  ],

  exports: [
    SearchService,
    GlobalSearchService,
    BulkIndexerService,
    ProjectSearchService,
    ClientSearchService,
    UserSearchService,
    LeadSearchService,
    VendorSearchService,
    BoqSearchService,
    BriefSearchService,
    QuotationSearchService,
    SiteRecceSearchService,
    TaskSearchService,
    CalendarSearchService,
    DocumentSearchService,
    DrawingSearchService,
    WorkOrderSearchService,
    DeliveryChallanSearchService,
    BudgetEstimateSearchService,
  ],
})
export class SearchModule {}
