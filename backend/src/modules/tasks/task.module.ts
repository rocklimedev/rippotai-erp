import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { TasksController } from './task.controller';
import { TasksService } from './task.service';

import { Task } from './models/task.model';
import { Project } from '../projects/models/projects.model';
import { User } from '../users/models/user.model';

import { NotificationsModule } from '../engagement/notifications.module';
import { ActivityLogsModule } from '../engagement/activity-logs.module';
@Module({
  imports: [
    SequelizeModule.forFeature([Task, Project, User]),
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
