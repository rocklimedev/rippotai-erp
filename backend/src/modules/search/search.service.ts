import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly esService: ElasticsearchService) {}

  /**
   * =========================================================
   * CREATE INDEX IF NEEDED
   * =========================================================
   *
   * Elasticsearch creates an index automatically when indexing
   * a document, but explicit creation is safer for reindexing
   * empty tables because an empty dataset otherwise never causes
   * an index to be created.
   */
  async createIndex(
    index: string,
    mappings?: Record<string, any>,
  ): Promise<void> {
    const exists = await this.esService.indices.exists({
      index,
    });

    if (exists) {
      return;
    }

    try {
      await this.esService.indices.create({
        index,
        ...(mappings ? { mappings } : {}),
      });

      this.logger.log(`Created Elasticsearch index "${index}"`);
    } catch (error: any) {
      /**
       * Multiple reindex jobs can run concurrently from
       * /reindex/all. If another job creates the same index
       * between exists() and create(), Elasticsearch returns
       * resource_already_exists_exception.
       *
       * That is safe to ignore.
       */
      const errorType =
        error?.meta?.body?.error?.type ??
        error?.body?.error?.type ??
        error?.type;

      if (errorType === 'resource_already_exists_exception') {
        return;
      }

      throw error;
    }
  }

  /**
   * =========================================================
   * INDEX
   * =========================================================
   */
  async index(
    index: string,
    id: string | number,
    document: Record<string, any>,
  ) {
    await this.createIndex(index);

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

  /**
   * =========================================================
   * UPDATE
   * =========================================================
   */
  async update(
    index: string,
    id: string | number,
    document: Record<string, any>,
  ) {
    await this.createIndex(index);

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

  /**
   * =========================================================
   * DELETE
   * =========================================================
   */
  async delete(index: string, id: string | number) {
    try {
      return await this.esService.delete({
        index,
        id: String(id),
      });
    } catch (err: any) {
      if (err?.meta?.statusCode !== 404) {
        throw err;
      }
    }
  }

  async removeDocument(index: string, id: string | number) {
    return this.delete(index, id);
  }

  /**
   * =========================================================
   * SEARCH
   * =========================================================
   */
  async search(index: string, query: Record<string, any>) {
    const exists = await this.esService.indices.exists({
      index,
    });

    /**
     * An index with no records may legitimately not exist.
     * Returning an empty result is more useful than throwing
     * index_not_found_exception during global search.
     */
    if (!exists) {
      return [];
    }

    const { hits } = await this.esService.search({
      index,
      query,
    });

    return hits.hits.map((hit) => ({
      id: hit._id,
      ...(hit._source as object),
    }));
  }
}
