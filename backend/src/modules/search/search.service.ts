import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  async indexDocument(
    index: string,
    id: string | number,
    document: Record<string, any>,
  ) {
    return this.esService.index({
      index,
      id: String(id),
      document,
    });
  }

  async updateDocument(
    index: string,
    id: string | number,
    document: Record<string, any>,
  ) {
    return this.esService.update({
      index,
      id: String(id),
      doc: document,
      doc_as_upsert: true,
    });
  }

  async removeDocument(index: string, id: string | number) {
    return this.esService
      .delete({
        index,
        id: String(id),
      })
      .catch((err) => {
        if (err.meta?.statusCode !== 404) throw err;
      });
  }

  async search(index: string, query: string, fields: string[]) {
    const { hits } = await this.esService.search({
      index,
      query: {
        multi_match: {
          query,
          fields,
          fuzziness: 'AUTO',
        },
      },
    });
    return hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as object),
    }));
  }

  async createIndex(index: string, mappings?: Record<string, any>) {
    const exists = await this.esService.indices.exists({ index });
    if (!exists) {
      await this.esService.indices.create({ index, mappings });
    }
  }
}
