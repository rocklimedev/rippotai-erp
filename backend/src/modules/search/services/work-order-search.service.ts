import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { WorkOrder } from '@/modules/material-procurement/models/work-order.model';

@Injectable()
export class WorkOrderSearchService {
  private readonly logger = new Logger(WorkOrderSearchService.name);
  private readonly INDEX = 'work_orders';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(WorkOrder) private readonly workOrderModel: typeof WorkOrder,
  ) {}

  private toDocument(wo: any): SearchableDocument {
    const projectName = wo.project?.name ?? wo.project_name ?? '';
    const contractor =
      wo.contractor_name ?? wo.vendor?.name ?? wo.contractor_company_name ?? '';
    const itemsText = (wo.items ?? [])
      .map((i: any) => i.description ?? '')
      .filter(Boolean)
      .join(' ');

    const title = wo.wo_id ?? 'Untitled Work Order';
    const subtitle = [projectName, contractor, wo.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'work_order',
      id: wo.id,
      project_id: wo.project_id ?? null,
      title,
      subtitle,
      status: wo.status ?? null,
      searchable_text: [
        wo.wo_id,
        projectName,
        contractor,
        wo.site_address,
        wo.agency,
        itemsText,
        wo.status,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: wo.created_at ?? wo.createdAt,
      updated_at: wo.updated_at ?? wo.updatedAt,
      visibility: 'project',
      is_deleted: false,

      wo_id: wo.wo_id,
      project_name: projectName,
      contractor_name: contractor,
      site_address: wo.site_address,
      total_amount: wo.total_amount,
      items_text: itemsText,
    };
  }

  async indexOne(id: string): Promise<void> {
    const wo = await this.workOrderModel.findByPk(id, {
      include: [
        { association: 'project', required: false },
        { association: 'vendor', required: false },
        { association: 'items', required: false },
      ],
    });
    if (!wo) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      wo.id,
      this.toDocument(wo),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.workOrderModel.findAll({
      include: [
        { association: 'project', required: false },
        { association: 'vendor', required: false },
        { association: 'items', required: false },
      ],
    });
    const items = rows.map((wo) => ({
      index: this.INDEX,
      id: wo.id,
      document: this.toDocument(wo),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed work orders: ${result.indexed}/${result.total}`);
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
            'wo_id^6',
            'title^4',
            'project_name^4',
            'contractor_name^3',
            'site_address^2',
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
