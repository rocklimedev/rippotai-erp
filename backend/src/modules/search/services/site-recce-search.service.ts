import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { SiteRecce } from '@/modules/reki/models/site-recce.model';

@Injectable()
export class SiteRecceSearchService {
  private readonly logger = new Logger(SiteRecceSearchService.name);
  private readonly INDEX = 'site_recces';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(SiteRecce) private readonly siteRecceModel: typeof SiteRecce,
  ) {}

  private toDocument(recce: any): SearchableDocument {
    const projectName = recce.project?.name ?? recce.project_name ?? '';
    const engineer =
      recce.site_engineer?.name ?? recce.siteEngineer?.name ?? '';
    const rooms = (recce.rooms ?? [])
      .map((r: any) => r.room_name ?? r.roomName ?? '')
      .filter(Boolean)
      .join(', ');

    const title =
      recce.project_name ?? projectName ?? recce.client_name ?? 'Site Recce';
    const subtitle = [recce.client_name, recce.site_type, recce.recce_date]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'site_recce',
      id: recce.id,
      project_id: recce.project_id ?? recce.projectId ?? null,
      title,
      subtitle,
      status: recce.site_type ?? null,
      searchable_text: [
        projectName,
        recce.project_name,
        recce.client_name,
        recce.site_address,
        recce.site_type,
        engineer,
        recce.accompanied_by,
        recce.existing_condition,
        recce.society_rwa_restrictions,
        rooms,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: recce.created_at ?? recce.createdAt,
      updated_at: recce.updated_at ?? recce.updatedAt,
      visibility: 'project',
      is_deleted: !!recce.deleted_at || !!recce.deletedAt,

      project_name: projectName,
      client_name: recce.client_name,
      site_address: recce.site_address,
      site_type: recce.site_type,
      site_engineer: engineer,
      rooms_summary: rooms,
      recce_date: recce.recce_date,
    };
  }

  async indexOne(id: string): Promise<void> {
    const recce = await this.siteRecceModel.findByPk(id, {
      include: [
        { association: 'project', required: false },
        { association: 'site_engineer', required: false },
        { association: 'rooms', required: false },
      ],
    });
    if (!recce || (recce as any).deleted_at || (recce as any).deletedAt) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      recce.id,
      this.toDocument(recce),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.siteRecceModel.findAll({
      include: [
        { association: 'project', required: false },
        { association: 'site_engineer', required: false },
        { association: 'rooms', required: false },
      ],
    });
    const items = rows
      .filter((r: any) => !r.deleted_at && !r.deletedAt)
      .map((r) => ({
        index: this.INDEX,
        id: r.id,
        document: this.toDocument(r),
      }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(
      `Reindexed site recces: ${result.indexed}/${result.total}`,
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
            'project_name^4',
            'client_name^4',
            'site_address^4',
            'rooms_summary^2',
            'site_engineer^2',
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
