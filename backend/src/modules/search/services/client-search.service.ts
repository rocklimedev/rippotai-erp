import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Client } from '@/modules/clients/models/client.model';

@Injectable()
export class ClientSearchService {
  private readonly logger = new Logger(ClientSearchService.name);
  private readonly INDEX = 'clients';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Client) private readonly clientModel: typeof Client,
  ) {}

  private toDocument(client: any): SearchableDocument {
    const title = client.name ?? 'Untitled Client';
    const subtitle = [client.contact_person, client.email, client.phone]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'client',
      id: client.id,
      client_id: client.id,
      title,
      subtitle,
      status: null,
      searchable_text: [
        client.name,
        client.slug,
        client.contact_person,
        client.email,
        client.phone,
        client.address,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: client.created_at ?? client.createdAt,
      updated_at: client.updated_at ?? client.updatedAt,
      visibility: 'internal',
      is_deleted: !!client.deleted_at || !!client.deletedAt,

      slug: client.slug,
      contact_person: client.contact_person,
      email: client.email,
      phone: client.phone,
      address: client.address,
      projects_count: client.projects?.length ?? 0,
    };
  }

  async indexOne(id: string): Promise<void> {
    const client = await this.clientModel.findByPk(id, {
      include: [{ association: 'projects', required: false }],
    });
    if (!client || (client as any).deleted_at) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      client.id,
      this.toDocument(client),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.clientModel.findAll({
      include: [{ association: 'projects', required: false }],
    });
    const items = rows
      .filter((c: any) => !c.deleted_at)
      .map((c) => ({
        index: this.INDEX,
        id: c.id,
        document: this.toDocument(c),
      }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed clients: ${result.indexed}/${result.total}`);
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
            'contact_person^4',
            'email^3',
            'phone^3',
            'address^2',
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
