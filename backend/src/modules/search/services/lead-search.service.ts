import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Lead } from '@/modules/leads/models/lead.model';

@Injectable()
export class LeadSearchService {
  private readonly logger = new Logger(LeadSearchService.name);
  private readonly INDEX = 'leads';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Lead) private readonly leadModel: typeof Lead,
  ) {}

  private toDocument(lead: any): SearchableDocument {
    const title =
      lead.name ?? lead.company_name ?? lead.email ?? 'Untitled Lead';
    const subtitle = [lead.company_name, lead.stage, lead.email]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'lead',
      id: lead.id,
      title,
      subtitle,
      status: lead.stage ?? lead.status ?? null,
      searchable_text: [
        lead.name,
        lead.company_name,
        lead.email,
        lead.phone,
        lead.stage,
        lead.source,
        lead.notes,
        lead.address,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: lead.created_at ?? lead.createdAt,
      updated_at: lead.updated_at ?? lead.updatedAt,
      visibility: 'internal',
      is_deleted: !!lead.deleted_at || !!lead.deletedAt,

      company_name: lead.company_name,
      email: lead.email,
      phone: lead.phone,
      stage: lead.stage,
      source: lead.source,
      notes: lead.notes,
    };
  }

  async indexOne(id: string): Promise<void> {
    const lead = await this.leadModel.findByPk(id);
    if (!lead || (lead as any).deleted_at || (lead as any).deletedAt) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      lead.id,
      this.toDocument(lead),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.leadModel.findAll();
    const items = rows
      .filter((l: any) => !l.deleted_at && !l.deletedAt)
      .map((l) => ({
        index: this.INDEX,
        id: l.id,
        document: this.toDocument(l),
      }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed leads: ${result.indexed}/${result.total}`);
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
            'company_name^4',
            'email^3',
            'phone^3',
            'stage^2',
            'notes^2',
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
