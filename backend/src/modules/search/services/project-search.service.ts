import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Project } from '@/modules/projects/models/projects.model';

@Injectable()
export class ProjectSearchService {
  private readonly logger = new Logger(ProjectSearchService.name);
  private readonly INDEX = 'projects';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Project) private readonly projectModel: typeof Project,
  ) {}

  private toDocument(project: any): SearchableDocument {
    const clientName = project.client?.name ?? '';
    const projectType =
      project.project_type?.name ?? project.projectType?.name ?? '';
    const title = project.name ?? 'Untitled Project';
    const subtitle = [clientName, project.site_location, project.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'project',
      id: project.id,
      project_id: project.id,
      client_id: project.client_id ?? project.client?.id ?? null,
      title,
      subtitle,
      status: project.status ?? null,
      searchable_text: [
        project.name,
        project.slug,
        project.site_location,
        project.description,
        clientName,
        projectType,
        project.status,
        project.current_phase,
        project.next_milestone_name,
        project.timeline_status,
        project.priority,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: project.created_at ?? project.createdAt,
      updated_at: project.updated_at ?? project.updatedAt,
      visibility: 'project',
      is_deleted: !!project.deleted_at || !!project.deletedAt,

      slug: project.slug,
      site_location: project.site_location,
      description: project.description,
      priority: project.priority,
      current_phase: project.current_phase,
      client_name: clientName,
      project_type: projectType,
      progress_pct: project.progress_pct,
      approved_value: project.approved_value,
      timeline_status: project.timeline_status,
      next_milestone_name: project.next_milestone_name,
    };
  }

  async indexOne(id: string): Promise<void> {
    const project = await this.projectModel.findByPk(id, {
      include: [
        { association: 'client', required: false },
        { association: 'project_type', required: false },
      ],
    });
    if (!project || project.deleted_at) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      project.id,
      this.toDocument(project),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.projectModel.findAll({
      include: [
        { association: 'client', required: false },
        { association: 'project_type', required: false },
      ],
    });
    const items = rows
      .filter((p) => !p.deleted_at)
      .map((p) => ({
        index: this.INDEX,
        id: p.id,
        document: this.toDocument(p),
      }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed projects: ${result.indexed}/${result.total}`);
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
            'title^6',
            'client_name^5',
            'site_location^4',
            'project_type^3',
            'description^2',
            'status^2',
            'current_phase^2',
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
