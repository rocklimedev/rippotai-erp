import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../search.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';

export interface BulkIndexItem {
  index: string;
  id: string;
  document: SearchableDocument | Record<string, unknown>;
}

export interface BulkDeleteItem {
  index: string;
  id: string;
}

@Injectable()
export class BulkIndexerService {
  private readonly logger = new Logger(BulkIndexerService.name);

  constructor(private readonly searchService: SearchService) {}

  /**
   * Index a batch of documents using the Elasticsearch Bulk API.
   * Automatically ensures the target indices exist.
   */
  async indexBatch(items: BulkIndexItem[], batchSize = 200): Promise<{
    total: number;
    indexed: number;
    failed: number;
  }> {
    if (!items.length) {
      return { total: 0, indexed: 0, failed: 0 };
    }

    // Ensure all indices exist once
    const uniqueIndices = [...new Set(items.map((i) => i.index))];
    for (const idx of uniqueIndices) {
      await this.searchService.ensureIndex(idx);
    }

    let indexed = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const operations: any[] = [];

      for (const item of chunk) {
        operations.push({
          index: { _index: item.index, _id: String(item.id) },
        });
        operations.push(item.document);
      }

      try {
        const result = await this.searchService.bulk(operations);
        if (result.errors) {
          const errorCount = result.items.filter(
            (it: any) => it.index?.error,
          ).length;
          failed += errorCount;
          indexed += chunk.length - errorCount;
        } else {
          indexed += chunk.length;
        }
      } catch (err) {
        this.logger.error(
          `Bulk index chunk failed (offset ${i})`,
          err instanceof Error ? err.stack : String(err),
        );
        failed += chunk.length;
      }
    }

    this.logger.log(
      `Bulk index finished: ${indexed} indexed, ${failed} failed (total ${items.length})`,
    );

    return { total: items.length, indexed, failed };
  }

  /**
   * Delete a batch of documents.
   */
  async deleteBatch(items: BulkDeleteItem[], batchSize = 200): Promise<{
    total: number;
    deleted: number;
    failed: number;
  }> {
    if (!items.length) {
      return { total: 0, deleted: 0, failed: 0 };
    }

    let deleted = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const operations: any[] = chunk.map((item) => ({
        delete: { _index: item.index, _id: String(item.id) },
      }));

      try {
        const result = await this.searchService.bulk(operations);
        if (result.errors) {
          const errorCount = result.items.filter(
            (it: any) => it.delete?.error,
          ).length;
          failed += errorCount;
          deleted += chunk.length - errorCount;
        } else {
          deleted += chunk.length;
        }
      } catch (err) {
        this.logger.error(
          `Bulk delete chunk failed (offset ${i})`,
          err instanceof Error ? err.stack : String(err),
        );
        failed += chunk.length;
      }
    }

    return { total: items.length, deleted, failed };
  }
}
