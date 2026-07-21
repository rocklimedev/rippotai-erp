import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { Task } from '../../tasks/models/task.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

@Injectable()
export class TaskSearchService {
  private readonly logger = new Logger(TaskSearchService.name);

  private readonly INDEX = 'tasks';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(Task)
    private readonly taskModel: typeof Task,
  ) {}

  /**
   * Convert Task model into Elasticsearch document
   */
  private toDocument(task: Task) {
    return {
      id: task.id,

      title: task.title,

      project_id: task.project_id,
      project: task.project?.name ?? '',

      priority: task.priority,
      status: task.status,

      due_date: task.due_date,
      due_bucket: task.due_bucket,

      order_index: task.order_index,
      workload_estimate_hours: task.workload_estimate_hours,

      created_by: task.creator?.name ?? '',

      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  }

  /**
   * Index a task
   */
  async indexTask(id: string) {
    const task = await this.taskModel.findByPk(id, {
      include: [
        {
          model: Project,
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    if (!task) {
      return;
    }

    await this.searchService.index(this.INDEX, task.id, this.toDocument(task));

    this.logger.log(`Indexed Task ${task.id}`);
  }

  /**
   * Update task index
   */
  async updateTask(id: string) {
    return this.indexTask(id);
  }

  /**
   * Remove task from Elasticsearch
   */
  async removeTask(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Task ${id}`);
  }

  /**
   * Search tasks
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'title^6',
          'project^5',
          'created_by^4',
          'priority^3',
          'status^3',
          'due_bucket^2',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all tasks
   */
  async reindexAll() {
    const tasks = await this.taskModel.findAll({
      include: [
        {
          model: Project,
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    for (const task of tasks) {
      await this.searchService.index(
        this.INDEX,
        task.id,
        this.toDocument(task),
      );
    }

    this.logger.log(`Indexed ${tasks.length} tasks`);
  }
}
