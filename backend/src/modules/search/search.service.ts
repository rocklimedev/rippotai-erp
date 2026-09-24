import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { INDEX_MAPPINGS, SearchIndexName } from './mappings/index-templates';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly es: ElasticsearchService) {}

  /**
   * Create an index with the proper mapping if it does not already exist.
   */
  async ensureIndex(index: SearchIndexName | string): Promise<void> {
    const exists = await this.es.indices.exists({ index });
    if (exists) return;

    const body = INDEX_MAPPINGS[index as SearchIndexName];
    if (!body) {
      this.logger.warn(
        `No mapping defined for index "${index}" – creating with dynamic mapping`,
      );
    }

    try {
      await this.es.indices.create({
        index,
        ...(body ?? {}),
      });
      this.logger.log(`Created Elasticsearch index "${index}"`);
    } catch (error: any) {
      const type =
        error?.meta?.body?.error?.type ??
        error?.body?.error?.type ??
        error?.type;
      if (type === 'resource_already_exists_exception') return;
      throw error;
    }
  }

  /**
   * Index a single document (create or overwrite).
   */
  async indexDocument(
    index: string,
    id: string,
    document: Record<string, unknown>,
  ) {
    await this.ensureIndex(index);
    return this.es.index({
      index,
      id: String(id),
      document,
      refresh: false, // let the worker / reindex control refresh
    });
  }

  /**
   * Partial update with upsert.
   */
  async updateDocument(
    index: string,
    id: string,
    document: Record<string, unknown>,
  ) {
    await this.ensureIndex(index);
    return this.es.update({
      index,
      id: String(id),
      doc: document,
      doc_as_upsert: true,
      refresh: false,
    });
  }

  /**
   * Delete a document. Ignores 404.
   */
  async deleteDocument(index: string, id: string) {
    try {
      return await this.es.delete({
        index,
        id: String(id),
        refresh: false,
      });
    } catch (err: any) {
      if (err?.meta?.statusCode !== 404) throw err;
    }
  }

  /**
   * Bulk index / delete helper.
   * operations: array of { index: { _index, _id } } | { delete: { _index, _id } } | document
   */
  async bulk(operations: any[]) {
    if (!operations.length) return { errors: false, items: [] };

    const response = await this.es.bulk({
      operations,
      refresh: false,
    });

    if (response.errors) {
      const failed = response.items.filter(
        (item: any) => item.index?.error || item.delete?.error,
      );
      this.logger.warn(
        `Bulk operation completed with ${failed.length} errors`,
      );
    }

    return response;
  }

  /**
   * Low-level search. Returns the raw ES response hits.
   */
  async search(index: string | string[], body: Record<string, any>) {
    const indices = Array.isArray(index) ? index : [index];

    // Filter to indices that actually exist to avoid index_not_found
    const existing: string[] = [];
    for (const idx of indices) {
      const ok = await this.es.indices.exists({ index: idx });
      if (ok) existing.push(idx);
    }

    if (!existing.length) {
      return { hits: { hits: [], total: { value: 0 } }, took: 0 };
    }

    return this.es.search({
      index: existing,
      ...body,
    });
  }

  /**
   * Convenience: check whether an index exists.
   */
  async indexExists(index: string): Promise<boolean> {
    return this.es.indices.exists({ index });
  }

  /**
   * Refresh an index (make recent writes visible).
   */
  async refresh(index: string | string[]) {
    return this.es.indices.refresh({ index });
  }
}
