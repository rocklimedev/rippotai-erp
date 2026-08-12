import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Project } from './models/projects.model';
import { ProjectType } from './models/project-type.model';
import { Milestone } from './models/milestone.model';
import { WorkPackage } from './models/work-package.model';

import { ProjectsService } from './projects.service';
import { ProjectTypeService } from './project-type.service';
import { ProjectDashboardService } from './project-dashboard.service';
import { WorkPackagesService } from './work-packages.service';

import { ProjectsController } from './projects.controller';
import { ProjectTypeController } from './project-type.controller';
import { WorkPackagesController } from './work-packages.controller';

import { ActivityLogsModule } from '../engagement/activity-logs.module';
import { NotificationsModule } from '../engagement/notifications.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Project, ProjectType, Milestone, WorkPackage]),

    ActivityLogsModule,
    NotificationsModule,
    ClientsModule,
  ],

  controllers: [
    ProjectsController,
    ProjectTypeController,
    WorkPackagesController,
  ],

  providers: [
    ProjectsService,
    ProjectTypeService,
    ProjectDashboardService,
    WorkPackagesService,
  ],

  exports: [
    ProjectsService,
    ProjectTypeService,
    ProjectDashboardService,
    WorkPackagesService,
  ],
})
export class ProjectsModule {}
