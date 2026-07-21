import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { Project } from '../../projects/models/projects.model';
import { Client } from '@/modules/clients/models/client.model';
import { ProjectType } from '../../projects/models/project-type.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Boq } from '@/modules/boqs/models/boq.model';

@Injectable()
export class ProjectSearchService {
  private readonly logger = new Logger(ProjectSearchService.name);

  private readonly INDEX = 'projects';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,
  ) {}

  /**
   * Convert Project model to Elasticsearch document
   */
  private toDocument(project: Project) {
    return {
      id: project.id,

      name: project.name,
      slug: project.slug,

      site_location: project.site_location,
      description: project.description,

      priority: project.priority,
      status: project.status,

      expected_completion_date: project.expected_completion_date,

      quotation_count: project.quotation_count,
      approved_value: project.approved_value,

      current_phase: project.current_phase,
      progress_pct: project.progress_pct,
      timeline_status: project.timeline_status,
      next_milestone_name: project.next_milestone_name,
      schedule_variance: project.schedule_variance,
      planned_duration: project.planned_duration,

      client: project.client?.name ?? '',
      project_type: project.project_type?.name ?? '',

      quotations_count: project.quotations?.length ?? 0,
      boqs_count: project.boqs?.length ?? 0,

      created_at: project.createdAt,
      updated_at: project.updatedAt,
    };
  }

  /**
   * Index one project
   */
  async indexProject(id: string) {
    const project = await this.projectModel.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client',
        },
        {
          model: ProjectType,
          as: 'project_type',
        },
        {
          model: Quotation,
        },
        {
          model: Boq,
          as: 'boqs',
        },
      ],
    });

    if (!project) {
      return;
    }

    await this.searchService.index(
      this.INDEX,
      project.id,
      this.toDocument(project),
    );

    this.logger.log(`Indexed Project ${project.id}`);
  }

  /**
   * Update Elasticsearch document
   */
  async updateProject(id: string) {
    return this.indexProject(id);
  }

  /**
   * Remove project from Elasticsearch
   */
  async removeProject(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Project ${id}`);
  }

  /**
   * Search projects
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'name^6',
          'client^5',
          'site_location^4',
          'project_type^4',
          'description^3',
          'status^2',
          'priority^2',
          'current_phase^2',
          'next_milestone_name',
          'timeline_status',
          'slug',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all projects
   */
  async reindexAll() {
    const projects = await this.projectModel.findAll({
      include: [
        {
          model: Client,
          as: 'client',
        },
        {
          model: ProjectType,
          as: 'project_type',
        },
        {
          model: Quotation,
        },
        {
          model: Boq,
          as: 'boqs',
        },
      ],
    });

    for (const project of projects) {
      await this.searchService.index(
        this.INDEX,
        project.id,
        this.toDocument(project),
      );
    }

    this.logger.log(`Indexed ${projects.length} projects`);
  }
}
