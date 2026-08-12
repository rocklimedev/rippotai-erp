import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { SnagList } from './models/snag-list.model';
import { SnagItem } from './models/snag-item.model';
import { ProjectHandover } from './models/project-handover.model';

// Services
import { SnagListsService } from './snag-lists.service';
import { SnagItemsService } from './snag-items.service';
import { ProjectHandoversService } from './project-handovers.service';

// Controllers
import { SnagListsController } from './snag-lists.controller';
import { SnagItemsController } from './snag-items.controller';
import { ProjectHandoversController } from './project-handovers.controller';

@Module({
  imports: [SequelizeModule.forFeature([SnagList, SnagItem, ProjectHandover])],

  controllers: [
    SnagListsController,
    SnagItemsController,
    ProjectHandoversController,
  ],

  providers: [SnagListsService, SnagItemsService, ProjectHandoversService],

  exports: [SnagListsService, SnagItemsService, ProjectHandoversService],
})
export class HandoverModule {}
