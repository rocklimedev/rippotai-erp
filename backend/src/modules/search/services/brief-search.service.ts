import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { ProjectBrief } from '../../brief/models/project-brief.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

@Injectable()
export class BriefSearchService {
  private readonly logger = new Logger(BriefSearchService.name);

  private readonly INDEX = 'project_briefs';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(ProjectBrief)
    private readonly briefModel: typeof ProjectBrief,
  ) {}

  /**
   * Convert JSON sections into searchable text
   */
  private flattenSections(
    sections: Record<string, Record<string, string>> | null,
  ): string {
    if (!sections) {
      return '';
    }

    const values: string[] = [];

    for (const [sectionTitle, fields] of Object.entries(sections)) {
      values.push(sectionTitle);

      if (fields) {
        for (const [fieldName, value] of Object.entries(fields)) {
          values.push(fieldName);

          if (value) {
            values.push(String(value));
          }
        }
      }
    }

    return values.join(' ');
  }

  /**
   * Convert model into Elasticsearch document
   */
  private toDocument(brief: ProjectBrief) {
    return {
      id: brief.id,
      project_id: brief.project_id,

      doc_no: brief.doc_no,

      sections: brief.sections,

      searchable_content: this.flattenSections(brief.sections),

      pdf_path: brief.pdf_path,
      pdf_size: brief.pdf_size,

      project: brief.project?.name ?? '',

      created_by: brief.creator?.name ?? '',

      created_at: brief.createdAt,
      updated_at: brief.updatedAt,
    };
  }

  /**
   * Index one Project Brief
   */
  async indexBrief(id: string) {
    const brief = await this.briefModel.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    if (!brief) {
      return;
    }

    await this.searchService.index(
      this.INDEX,
      brief.id,
      this.toDocument(brief),
    );

    this.logger.log(`Indexed Project Brief ${brief.id}`);
  }

  /**
   * Update Elasticsearch document
   */
  async updateBrief(id: string) {
    return this.indexBrief(id);
  }

  /**
   * Delete document from Elasticsearch
   */
  async removeBrief(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Project Brief ${id}`);
  }

  /**
   * Search Project Briefs
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: ['doc_no^5', 'project^4', 'searchable_content^3', 'created_by'],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex every Project Brief
   */
  async reindexAll() {
    const briefs = await this.briefModel.findAll({
      include: [
        {
          model: Project,
          as: 'project',
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    for (const brief of briefs) {
      await this.searchService.index(
        this.INDEX,
        brief.id,
        this.toDocument(brief),
      );
    }

    this.logger.log(`Indexed ${briefs.length} Project Briefs`);
  }
}
