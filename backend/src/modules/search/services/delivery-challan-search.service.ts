import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { DeliveryChallan } from '@/modules/material-procurement/models/delivery-challan.model';

/**
 * DeliveryChallan has project_id / vendor_id columns but does NOT define
 * BelongsTo('project') or BelongsTo('vendor') associations.
 * Only materialRequirement and items are associated.
 */
@Injectable()
export class DeliveryChallanSearchService {
  private readonly logger = new Logger(DeliveryChallanSearchService.name);
  private readonly INDEX = 'delivery_challans';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(DeliveryChallan)
    private readonly challanModel: typeof DeliveryChallan,
  ) {}

  private toDocument(c: any): SearchableDocument {
    const number = c.challan_number ?? c.challanNumber ?? '';
    const title = number || 'Untitled Challan';
    const subtitle = [c.status, c.site_address ?? c.siteAddress]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'delivery_challan',
      id: c.id,
      project_id: c.project_id ?? c.projectId ?? null,
      title,
      subtitle,
      status: c.status ?? null,
      searchable_text: [
        number,
        c.site_address ?? c.siteAddress,
        c.general_remarks ?? c.generalRemarks,
        c.discrepancy_notes ?? c.discrepancyNotes,
        c.status,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: c.createdAt ?? c.created_at,
      updated_at: c.updatedAt ?? c.updated_at,
      visibility: 'project',
      is_deleted: false,

      challan_number: number,
      project_name: '',
      vendor_name: '',
      site_address: c.site_address ?? c.siteAddress,
    };
  }

  async indexOne(id: string): Promise<void> {
    const challan = await this.challanModel.findByPk(id);
    if (!challan) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      challan.id,
      this.toDocument(challan),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    // No project/vendor associations — plain findAll only
    const rows = await this.challanModel.findAll();
    const items = rows.map((c) => ({
      index: this.INDEX,
      id: c.id,
      document: this.toDocument(c),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(
      `Reindexed delivery challans: ${result.indexed}/${result.total}`,
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
            'challan_number^6',
            'title^4',
            'site_address^3',
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
