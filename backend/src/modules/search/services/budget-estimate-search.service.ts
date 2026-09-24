import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { BudgetEstimate } from '@/modules/budget-estimate/models/budget-estimate.model';

@Injectable()
export class BudgetEstimateSearchService {
  private readonly logger = new Logger(BudgetEstimateSearchService.name);
  private readonly INDEX = 'budget_estimates';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(BudgetEstimate)
    private readonly estimateModel: typeof BudgetEstimate,
  ) {}

  private toDocument(est: any): SearchableDocument {
    const projectName = est.project?.name ?? '';
    const number = est.estimate_number ?? est.estimateNumber ?? '';
    const title = est.title ?? number ?? 'Untitled Estimate';
    const subtitle = [projectName, number, est.status]
      .filter(Boolean)
      .join(' · ');

    const itemsText = (est.items ?? est.categories ?? [])
      .flatMap((c: any) => c.items ?? [c])
      .map((i: any) => i.name ?? '')
      .filter(Boolean)
      .join(' ');

    return {
      entity_type: 'budget_estimate',
      id: est.id,
      project_id: est.project_id ?? est.projectId ?? null,
      title,
      subtitle,
      status: est.status ?? null,
      searchable_text: [
        est.title,
        number,
        projectName,
        est.client_name ?? est.clientName,
        est.location,
        itemsText,
        est.status,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: est.created_at ?? est.createdAt,
      updated_at: est.updated_at ?? est.updatedAt,
      visibility: 'project',
      is_deleted: false,

      estimate_number: number,
      project_name: projectName,
      total_amount: est.total_amount ?? est.totalAmount,
      items_text: itemsText,
    };
  }

  async indexOne(id: string): Promise<void> {
    const est = await this.estimateModel.findByPk(id, {
      include: [{ association: 'project', required: false }],
    });
    if (!est) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      est.id,
      this.toDocument(est),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.estimateModel.findAll({
      include: [{ association: 'project', required: false }],
    });
    const items = rows.map((e) => ({
      index: this.INDEX,
      id: e.id,
      document: this.toDocument(e),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(
      `Reindexed budget estimates: ${result.indexed}/${result.total}`,
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
            'estimate_number^5',
            'project_name^3',
            'items_text^2',
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
