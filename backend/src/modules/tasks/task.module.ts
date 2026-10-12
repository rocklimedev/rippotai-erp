import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { TasksController } from './task.controller';
import { TasksService } from './task.service';
import { CrucialWorkService } from './crucial-work.service';
import { CrucialWorkExportService } from './crucial-work-export.service';
import { CrucialTaskCheck } from './models/crucial-task-check.model';

import { Task } from './models/task.model';
import { Project } from '../projects/models/projects.model';
import { User } from '../users/models/user.model';

import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';
@Module({
  imports: [
    SequelizeModule.forFeature([Task, Project, User, CrucialTaskCheck]),
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, CrucialWorkService, CrucialWorkExportService],
  exports: [TasksService],
})
export class TasksModule {}
