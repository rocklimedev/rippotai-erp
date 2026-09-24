import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Task } from '@/modules/tasks/models/task.model';

@Injectable()
export class TaskSearchService {
  private readonly logger = new Logger(TaskSearchService.name);
  private readonly INDEX = 'tasks';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Task) private readonly taskModel: typeof Task,
  ) {}

  private toDocument(task: any): SearchableDocument {
    const projectName = task.project?.name ?? '';
    const title = task.title ?? 'Untitled Task';
    const subtitle = [projectName, task.priority, task.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'task',
      id: task.id,
      project_id: task.project_id ?? task.projectId ?? null,
      title,
      subtitle,
      status: task.status ?? null,
      searchable_text: [
        task.title,
        projectName,
        task.priority,
        task.status,
        task.due_bucket,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: task.created_at ?? task.createdAt,
      updated_at: task.updated_at ?? task.updatedAt,
      visibility: 'project',
      is_deleted: false,

      priority: task.priority,
      due_date: task.due_date ?? task.dueDate,
      project_name: projectName,
    };
  }

  async indexOne(id: string): Promise<void> {
    const task = await this.taskModel.findByPk(id, {
      include: [{ association: 'project', required: false }],
    });
    if (!task) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      task.id,
      this.toDocument(task),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.taskModel.findAll({
      include: [{ association: 'project', required: false }],
    });
    const items = rows.map((t) => ({
      index: this.INDEX,
      id: t.id,
      document: this.toDocument(t),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed tasks: ${result.indexed}/${result.total}`);
    return result;
  }

  async search(query: string, size = 20) {
    if (!query?.trim()) return [];
    const response = await this.searchService.search(this.INDEX, {
      size,
      query: {
        multi_match: {
          query: query.trim(),
          fields: [
            'title^5',
            'project_name^3',
            'priority^2',
            'status^2',
            'searchable_text',
          ],
          fuzziness: 'AUTO',
        },
      },
    });
    return (response.hits?.hits ?? []).map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...(hit._source as object),
    }));
  }
}
