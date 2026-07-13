import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from './models/projects.model';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ActivityLogsModule } from '../engagement/activity-logs.module';
import { NotificationsModule } from '../engagement/notifications.module';
import { ProjectType } from './models/project-type.model';
import { ProjectTypeService } from './project-type.service';
import { ProjectTypeController } from './project-type.controller';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Project, ProjectType]),
    ActivityLogsModule,
    NotificationsModule,
    ClientsModule,
  ],
  controllers: [ProjectsController, ProjectTypeController],
  providers: [ProjectsService, ProjectTypeService],
  exports: [ProjectsService, ProjectTypeService],
})
export class ProjectsModule {}
