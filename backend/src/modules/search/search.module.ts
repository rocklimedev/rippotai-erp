import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientOptions } from '@elastic/elasticsearch';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';

// Search Services
import { BoqSearchService } from './services/boq-search.service';
import { BriefSearchService } from './services/brief-search.service';
import { CalendarSearchService } from './services/calendar-search.service';
import { ClientSearchService } from './services/client-search.service';
import { LeadSearchService } from './services/lead-search.service';
import { ProjectSearchService } from './services/project-search.service';
import { QuotationSearchService } from './services/quotation-search.service';
import { SiteRecceSearchService } from './services/reki-search.service';
import { TaskSearchService } from './services/task-search.service';
import { UserSearchService } from './services/user-search.service';
import { VendorSearchService } from './services/vendor-search.service';

// Models
import { Boq } from '../boqs/models/boq.model';
import { ProjectBrief } from '../brief/models/project-brief.model';
import { CalendarEvent } from '../calendar/models/calender-event.model';
import { Client } from '../clients/models/client.model';
import { Lead } from '../leads/models/lead.model';
import { Project } from '../projects/models/projects.model';
import { Quotation } from '../quotations/models/quotations.model';
import { SiteRecce } from '../reki/models/site-recce.model';
import { Task } from '../tasks/models/task.model';
import { User } from '../users/models/user.model';
import { Vendor } from '../vendors/models/vendors.model';

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
          options.auth = {
            username,
            password,
          };
        }

        return options;
      },
    }),

    SequelizeModule.forFeature([
      Boq,
      ProjectBrief,
      CalendarEvent,
      Client,
      Lead,
      Project,
      Quotation,
      SiteRecce,
      Task,
      User,
      Vendor,
    ]),
  ],

  controllers: [SearchController],

  providers: [
    SearchService,

    BoqSearchService,
    BriefSearchService,
    CalendarSearchService,
    ClientSearchService,
    LeadSearchService,
    ProjectSearchService,
    QuotationSearchService,
    SiteRecceSearchService,
    TaskSearchService,
    UserSearchService,
    VendorSearchService,
  ],

  exports: [
    SearchService,

    BoqSearchService,
    BriefSearchService,
    CalendarSearchService,
    ClientSearchService,
    LeadSearchService,
    ProjectSearchService,
    QuotationSearchService,
    SiteRecceSearchService,
    TaskSearchService,
    UserSearchService,
    VendorSearchService,
  ],
})
export class SearchModule {}
