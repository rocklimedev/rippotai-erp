import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SearchModule } from '../search/search.module'; // <-- ADD THIS

import { TasksController } from './task.controller';
import { TasksService } from './task.service';
import { Task } from './models/task.model';
import { Project } from '../projects/models/projects.model';
import { User } from '../users/models/user.model';
import { TaskSearchService } from '../search/services/task-search.service';

@Module({
  imports: [SequelizeModule.forFeature([Task, Project, User])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
