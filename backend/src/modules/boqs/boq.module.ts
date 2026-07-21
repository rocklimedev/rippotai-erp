import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SearchModule } from '../search/search.module'; // <-- ADD THIS

// Models owned by this module
import { Boq } from './models/boq.model';
import { BoqCategory } from './models/boq-category.model';
import { BoqItem } from './models/boq-item.model';
import { BoqTemplate } from './models/boq-template.model';
import { BoqTemplateCategory } from './models/boq-template-category.model';
import { BoqTemplateItem } from './models/boq-template-item.model';
import { BoqActivity } from './models/boq-activity.model';
import { LibraryCategory } from './models/library-category.model';
import { LibraryItem } from './models/library-item.model';
import { User } from '../users/models/user.model';

// Models from modules that already exist, needed for FK lookups/includes
import { Project } from '../projects/models/projects.model';
import { Unit } from '../metas/models/unit.model';

import { BoqService } from './boq.service';
import { BoqTemplateService } from './boq-template.service';
import { LibraryService } from './library.service';
import { BoqActivityService } from './boq-activity.service';
import { BoqController } from './boq.controller';
import { BoqExportService } from './boq-export.service';
import { BoqTemplateController } from './boq-template.controller';
import { LibraryController } from './library.controller';
import { BoqActivityController } from './boq-activity.controller';
import { BoqVersion } from './models/boq-version.model';
import { BoqVersionService } from './boq-version.service';
import { BoqDashboardService } from './boq-dashboard.service';
import { BoqSearchService } from '../search/services/boq-search.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Boq,
      BoqCategory,
      BoqItem,
      BoqTemplate,
      BoqTemplateCategory,
      BoqTemplateItem,
      BoqVersion,
      BoqActivity,
      LibraryCategory,
      LibraryItem,
      Project,
      Unit,
      User,
    ]),
  ],
  controllers: [
    BoqController,
    BoqTemplateController,
    LibraryController,
    BoqActivityController,
  ],
  providers: [
    BoqService,
    BoqTemplateService,
    LibraryService,
    BoqActivityService,
    BoqExportService,
    BoqVersionService,
    BoqDashboardService,
  ],
  exports: [
    BoqService,
    BoqTemplateService,
    LibraryService,
    BoqActivityService,
    BoqExportService,
    BoqDashboardService,
  ],
})
export class BoqModule {}
