import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TasksController } from './task.controller';
import { TasksService } from './task.service';
import { Task } from './models/task.model';
import { Project } from '../projects/models/projects.model';
import { User } from '../users/models/user.model';
@Module({
  imports: [SequelizeModule.forFeature([Task, Project, User])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
