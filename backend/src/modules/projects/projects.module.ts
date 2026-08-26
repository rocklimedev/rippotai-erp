import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Project } from './models/projects.model';
import { ProjectType } from './models/project-type.model';
import { Milestone } from './models/milestone.model';
import { ProjectPhase } from './models/project-phase.model';

import { ProjectsService } from './projects.service';
import { ProjectTypeService } from './project-type.service';
import { ProjectDashboardService } from './project-dashboard.service';
import { ProjectPhaseService } from './project-phase.service';

import { ProjectsController } from './projects.controller';
import { ProjectTypeController } from './project-type.controller';
import { ProjectPhaseController } from './project-phase.controller';

import { ActivityLogsModule } from '../engagement/activity-logs.module';
import { NotificationsModule } from '../engagement/notifications.module';
import { ClientsModule } from '../clients/clients.module';
import { TeamMember } from '../users/models/team-member.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Project,
      ProjectType,
      Milestone,
      ProjectPhase,
      TeamMember,
    ]),

    ActivityLogsModule,
    NotificationsModule,
    ClientsModule,
  ],

  controllers: [
    ProjectsController,
    ProjectTypeController,
    ProjectPhaseController,
  ],

  providers: [
    ProjectsService,
    ProjectTypeService,
    ProjectDashboardService,
    ProjectPhaseService,
  ],

  exports: [
    ProjectsService,
    ProjectTypeService,
    ProjectDashboardService,
    ProjectPhaseService,
  ],
})
export class ProjectsModule {}
