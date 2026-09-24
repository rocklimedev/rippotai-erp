import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { ProjectBrief } from '@/modules/brief/models/project-brief.model';

/**
 * Keeps the rich flattening approach from the original BriefSearchService
 * but normalises to the common SearchableDocument shape.
 */
@Injectable()
export class BriefSearchService {
  private readonly logger = new Logger(BriefSearchService.name);
  private readonly INDEX = 'project_briefs';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(ProjectBrief)
    private readonly briefModel: typeof ProjectBrief,
  ) {}

  private flattenValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Date
    ) {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => this.flattenValue(item))
        .filter(Boolean)
        .join(' ');
    }
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, val]) => {
          const flattened = this.flattenValue(val);
          return flattened ? `${key} ${flattened}` : key;
        })
        .filter(Boolean)
        .join(' ');
    }
    return '';
  }

  private flattenChildren(items: any[] = []): string {
    return items
      .map((item) => {
        const data = typeof item?.toJSON === 'function' ? item.toJSON() : item;
        return this.flattenValue(data);
      })
      .filter(Boolean)
      .join(' ');
  }

  private toDocument(brief: any): SearchableDocument {
    const data =
      typeof brief.toJSON === 'function' ? brief.toJSON() : (brief as any);
    const project = brief.project;
    const projectName = project?.name ?? '';

    const childText = [
      this.flattenChildren(brief.documents),
      this.flattenChildren(brief.workTypes),
      this.flattenChildren(brief.services),
      this.flattenChildren(brief.procurementCategories),
      this.flattenChildren(brief.spaceRequirements),
      this.flattenChildren(brief.styleDirections),
      this.flattenChildren(brief.references),
      this.flattenChildren(brief.phases),
      this.flattenChildren(brief.occupants),
      this.flattenChildren(brief.attachments),
    ]
      .filter(Boolean)
      .join(' ');

    const title = projectName || data.siteAddress || 'Project Brief';
    const subtitle = [data.propertyType, data.siteAddress, data.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'project_brief',
      id: brief.id,
      project_id: data.projectId ?? data.project_id ?? null,
      title,
      subtitle,
      status: data.status ?? null,
      searchable_text: [
        projectName,
        data.siteAddress,
        data.propertyType,
        data.siteType,
        data.siteCondition,
        data.relationshipToClient,
        data.vastuRequirements,
        data.materialsLiked,
        data.coloursPreferred,
        data.mustHaveElements,
        childText,
        data.status,
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
      created_at: data.createdAt ?? data.created_at,
      updated_at: data.updatedAt ?? data.updated_at,
      visibility: 'project',
      is_deleted: false,

      site_address: data.siteAddress,
      property_type: data.propertyType,
      project_name: projectName,
      initial_client_budget: data.initialClientBudget,
      budget_currency: data.budgetCurrency,
    };
  }

  async indexOne(id: string): Promise<void> {
    const brief = await this.briefModel.findByPk(id, {
      include: [
        { association: 'project', required: false },
        { association: 'documents', required: false },
        { association: 'workTypes', required: false },
        { association: 'services', required: false },
        { association: 'procurementCategories', required: false },
        { association: 'spaceRequirements', required: false },
        { association: 'styleDirections', required: false },
        { association: 'references', required: false },
        { association: 'phases', required: false },
        { association: 'occupants', required: false },
        { association: 'attachments', required: false },
      ],
    });
    if (!brief) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      brief.id,
      this.toDocument(brief),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.briefModel.findAll({
      include: [
        { association: 'project', required: false },
        { association: 'documents', required: false },
        { association: 'workTypes', required: false },
        { association: 'services', required: false },
        { association: 'procurementCategories', required: false },
        { association: 'spaceRequirements', required: false },
        { association: 'styleDirections', required: false },
        { association: 'references', required: false },
        { association: 'phases', required: false },
        { association: 'occupants', required: false },
        { association: 'attachments', required: false },
      ],
    });
    const items = rows.map((b) => ({
      index: this.INDEX,
      id: b.id,
      document: this.toDocument(b),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(
      `Reindexed project briefs: ${result.indexed}/${result.total}`,
    );
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
            'site_address^6',
            'project_name^5',
            'property_type^3',
            'searchable_text^2',
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
