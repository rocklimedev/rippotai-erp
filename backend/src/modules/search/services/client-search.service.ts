import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { Client } from '../../clients/models/client.model';
import { Project } from '@/modules/projects/models/projects.model';

@Injectable()
export class ClientSearchService {
  private readonly logger = new Logger(ClientSearchService.name);

  private readonly INDEX = 'clients';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(Client)
    private readonly clientModel: typeof Client,
  ) {}

  /**
   * Convert Client model to Elasticsearch document
   */
  private toDocument(client: Client) {
    return {
      id: client.id,

      name: client.name,
      slug: client.slug,

      contact_person: client.contact_person,
      email: client.email,
      phone: client.phone,
      address: client.address,

      projects_count: client.projects?.length ?? 0,

      created_at: client.createdAt,
      updated_at: client.updatedAt,
    };
  }

  /**
   * Index one client
   */
  async indexClient(id: string) {
    const client = await this.clientModel.findByPk(id, {
      include: [
        {
          model: Project,
        },
      ],
    });

    if (!client) {
      return;
    }

    await this.searchService.index(
      this.INDEX,
      client.id,
      this.toDocument(client),
    );

    this.logger.log(`Indexed Client ${client.id}`);
  }

  /**
   * Update client index
   */
  async updateClient(id: string) {
    return this.indexClient(id);
  }

  /**
   * Remove client from Elasticsearch
   */
  async removeClient(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Client ${id}`);
  }

  /**
   * Search clients
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'name^5',
          'contact_person^4',
          'email^3',
          'phone^3',
          'address^2',
          'slug',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex every client
   */
  async reindexAll() {
    const clients = await this.clientModel.findAll({
      include: [
        {
          model: Project,
        },
      ],
    });

    for (const client of clients) {
      await this.searchService.index(
        this.INDEX,
        client.id,
        this.toDocument(client),
      );
    }

    this.logger.log(`Indexed ${clients.length} clients`);
  }
}
