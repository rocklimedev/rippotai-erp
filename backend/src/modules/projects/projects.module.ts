import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SearchModule } from '../search/search.module'; // <-- ADD THIS

import { Project } from './models/projects.model';
import { ProjectType } from './models/project-type.model';
import { Milestone } from './models/milestone.model';
import { ProjectsService } from './projects.service';
import { ProjectTypeService } from './project-type.service';
import { ProjectDashboardService } from './project-dashboard.service';

import { ProjectsController } from './projects.controller';
import { ProjectTypeController } from './project-type.controller';

import { ActivityLogsModule } from '../engagement/activity-logs.module';
import { NotificationsModule } from '../engagement/notifications.module';
import { ClientsModule } from '../clients/clients.module';
import { ProjectSearchService } from '../search/services/project-search.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Project, ProjectType, Milestone]),
    ActivityLogsModule,
    NotificationsModule,
    ClientsModule,
  ],
  controllers: [ProjectsController, ProjectTypeController],
  providers: [ProjectsService, ProjectTypeService, ProjectDashboardService],
  exports: [ProjectsService, ProjectTypeService, ProjectDashboardService],
})
export class ProjectsModule {}
