import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  async index(
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

  async indexDocument(
    index: string,
    id: string | number,
    document: Record<string, any>,
  ) {
    return this.index(index, id, document);
  }

  async update(
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

  async updateDocument(
    index: string,
    id: string | number,
    document: Record<string, any>,
  ) {
    return this.update(index, id, document);
  }

  async delete(index: string, id: string | number) {
    try {
      return await this.esService.delete({
        index,
        id: String(id),
      });
    } catch (err: any) {
      if (err.meta?.statusCode !== 404) {
        throw err;
      }
    }
  }

  async removeDocument(index: string, id: string | number) {
    return this.delete(index, id);
  }

  async search(index: string, query: Record<string, any>) {
    const { hits } = await this.esService.search({
      index,
      query,
    });

    return hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as object),
    }));
  }

  async createIndex(index: string, mappings?: Record<string, any>) {
    const exists = await this.esService.indices.exists({
      index,
    });

    if (!exists) {
      await this.esService.indices.create({
        index,
        mappings,
      });
    }
  }
}
