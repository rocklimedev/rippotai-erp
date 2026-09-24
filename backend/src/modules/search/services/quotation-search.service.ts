import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Quotation } from '@/modules/quotations/models/quotations.model';

@Injectable()
export class QuotationSearchService {
  private readonly logger = new Logger(QuotationSearchService.name);
  private readonly INDEX = 'quotations';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Quotation) private readonly quotationModel: typeof Quotation,
  ) {}

  private toDocument(q: any): SearchableDocument {
    const projectName = q.project?.name ?? '';
    const vendorName =
      q.vendor?.name ??
      (q.vendorSnapshot as any)?.name ??
      (q.vendor_snapshot as any)?.name ??
      '';
    const itemsText = (q.items ?? [])
      .map((i: any) => i.description ?? i.name ?? '')
      .filter(Boolean)
      .join(' ');

    const number = q.quotationNumber ?? q.quotation_number ?? '';
    const title = number || 'Untitled Quotation';
    const subtitle = [projectName, vendorName, q.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'quotation',
      id: q.id,
      project_id: q.projectId ?? q.project_id ?? null,
      title,
      subtitle,
      status: q.status ?? null,
      searchable_text: [
        number,
        projectName,
        vendorName,
        q.boqReference ?? q.boq_reference,
        q.comparisonNotes ?? q.comparison_notes,
        q.reviewRemarks ?? q.review_remarks,
        q.termsConditions ?? q.terms_conditions,
        itemsText,
        q.status,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: q.createdAt ?? q.created_at,
      updated_at: q.updatedAt ?? q.updated_at,
      visibility: 'project',
      is_deleted: !!q.deletedAt || !!q.deleted_at,

      quotation_number: number,
      project_name: projectName,
      vendor_name: vendorName,
      boq_reference: q.boqReference ?? q.boq_reference,
      total_amount: q.totalAmount ?? q.total_amount,
      items_text: itemsText,
      comparison_notes: q.comparisonNotes ?? q.comparison_notes,
      review_remarks: q.reviewRemarks ?? q.review_remarks,
    };
  }

  async indexOne(id: string): Promise<void> {
    const quotation = await this.quotationModel.findByPk(id, {
      include: [
        { association: 'project', required: false },
        { association: 'vendor', required: false },
        { association: 'items', required: false },
      ],
    });
    if (!quotation || (quotation as any).deletedAt || (quotation as any).deleted_at) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      quotation.id,
      this.toDocument(quotation),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.quotationModel.findAll({
      include: [
        { association: 'project', required: false },
        { association: 'vendor', required: false },
        { association: 'items', required: false },
      ],
    });
    const items = rows
      .filter((q: any) => !q.deletedAt && !q.deleted_at)
      .map((q) => ({
        index: this.INDEX,
        id: q.id,
        document: this.toDocument(q),
      }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed quotations: ${result.indexed}/${result.total}`);
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
            'quotation_number^6',
            'title^5',
            'project_name^4',
            'vendor_name^4',
            'boq_reference^3',
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
