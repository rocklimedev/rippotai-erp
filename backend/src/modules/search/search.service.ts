import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { INDEX_MAPPINGS } from './mappings/index-templates';
import {
  compileSearchFilter,
  evaluateSearch,
  highlightSearch,
} from './personal-search-engine';

/** Private search storage in the existing ERP database. */
@Injectable()
export class SearchService {
  constructor(@InjectConnection() private readonly db: Sequelize) {}

  private validateIndex(index: string) {
    if (!Object.prototype.hasOwnProperty.call(INDEX_MAPPINGS, index))
      throw new BadRequestException('Unsupported search index');
  }

  async ensureIndex(index: string): Promise<void> {
    this.validateIndex(index);
    await this.db.query('SELECT 1 FROM erp_search_documents LIMIT 0');
  }

  async indexDocument(
    index: string,
    id: string,
    document: Record<string, unknown>,
  ) {
    this.validateIndex(index);
    await this.db.query(
      `INSERT INTO erp_search_documents (index_name, document_id, project_id, document)
       VALUES (:index, :id, :projectId, :document)
       ON DUPLICATE KEY UPDATE project_id = VALUES(project_id), document = VALUES(document)`,
      {
        replacements: {
          index,
          id: String(id),
          projectId: document.project_id ?? null,
          document: JSON.stringify(document),
        },
      },
    );
    return { result: 'updated' };
  }

  async updateDocument(
    index: string,
    id: string,
    document: Record<string, unknown>,
  ) {
    this.validateIndex(index);
    // Row locking makes read/merge/write atomic, including explicit JSON nulls.
    return this.db.transaction(async (transaction) => {
      await this.db.query(
        `INSERT IGNORE INTO erp_search_documents (index_name, document_id, document) VALUES (:index, :id, '{}')`,
        { transaction, replacements: { index, id: String(id) } },
      );
      const rows = await this.db.query<any>(
        'SELECT document FROM erp_search_documents WHERE index_name = :index AND document_id = :id FOR UPDATE',
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { index, id: String(id) },
        },
      );
      const previous =
        typeof rows[0].document === 'string'
          ? JSON.parse(rows[0].document)
          : rows[0].document;
      const merged = { ...previous, ...document };
      await this.db.query(
        'UPDATE erp_search_documents SET document = :document, project_id = :projectId WHERE index_name = :index AND document_id = :id',
        {
          transaction,
          replacements: {
            index,
            id: String(id),
            document: JSON.stringify(merged),
            projectId: merged.project_id ?? null,
          },
        },
      );
      return { result: 'updated' };
    });
  }

  async deleteDocument(index: string, id: string) {
    this.validateIndex(index);
    await this.db.query(
      'DELETE FROM erp_search_documents WHERE index_name = :index AND document_id = :id',
      { replacements: { index, id: String(id) } },
    );
    return { result: 'deleted' };
  }

  async bulk(operations: any[]) {
    const items: any[] = [];
    for (let i = 0; i < operations.length; i++) {
      const action = operations[i];
      const kind = action.index ? 'index' : action.delete ? 'delete' : null;
      if (!kind) throw new BadRequestException('Unsupported bulk operation');
      const { _index, _id } = action[kind];
      const document = kind === 'index' ? operations[++i] : undefined;
      try {
        if (kind === 'index') {
          if (!document) throw new Error('Missing bulk document');
          await this.indexDocument(_index, _id, document);
        } else await this.deleteDocument(_index, _id);
        items.push({ [kind]: { _id, status: 200 } });
      } catch (error: any) {
        items.push({
          [kind]: { _id, status: 500, error: { reason: error.message } },
        });
      }
    }
    return {
      errors: items.some((item) => item.index?.error || item.delete?.error),
      items,
    };
  }

  async search(index: string | string[], body: Record<string, any>) {
    const started = Date.now();
    const indices = Array.isArray(index) ? index : [index];
    indices.forEach((idx) => this.validateIndex(idx));
    const from = Math.max(0, Number(body.from ?? 0));
    const size = Math.min(50, Math.max(0, Number(body.size ?? 20)));
    if (
      !Number.isSafeInteger(from) ||
      !Number.isSafeInteger(size) ||
      from + size > 10000
    )
      throw new BadRequestException(
        'Search window must be within 10000 results',
      );
    const replacements: Record<string, any> = { indices, cursor: 0 };
    const filter = compileSearchFilter(
      body.query ?? { match_all: {} },
      replacements,
    );
    let total = 0;
    const buckets = new Map<string, number>();
    let best: any[] = [];
    // Keyset batches bound memory. Scope is enforced by SQL before text is read.
    while (indices.length) {
      const rows = await this.db.query<any>(
        `SELECT sequence_id, index_name, document_id, document FROM erp_search_documents
         WHERE index_name IN (:indices) AND sequence_id > :cursor AND (${filter})
         ORDER BY sequence_id LIMIT 500`,
        { type: QueryTypes.SELECT, replacements },
      );
      for (const row of rows) {
        const doc =
          typeof row.document === 'string'
            ? JSON.parse(row.document)
            : row.document;
        const score = evaluateSearch(
          doc,
          body.query ?? { match_all: {} },
          row.index_name,
        );
        if (score === null) continue;
        total++;
        buckets.set(doc.entity_type, (buckets.get(doc.entity_type) ?? 0) + 1);
        best.push({
          _id: row.document_id,
          _index: row.index_name,
          _source: doc,
          _score: score,
        });
      }
      best.sort(
        (a, b) =>
          b._score - a._score ||
          String(b._source.updated_at ?? '').localeCompare(
            String(a._source.updated_at ?? ''),
          ) ||
          a._index.localeCompare(b._index) ||
          a._id.localeCompare(b._id),
      );
      best = best.slice(0, from + size);
      if (rows.length < 500) break;
      replacements.cursor = rows[rows.length - 1].sequence_id;
    }
    return {
      took: Date.now() - started,
      hits: {
        total: { value: total, relation: 'eq' },
        hits: best.slice(from, from + size).map((hit) => ({
          ...hit,
          ...(body.highlight
            ? {
                highlight: highlightSearch(
                  hit._source,
                  body.query,
                  body.highlight,
                ),
              }
            : {}),
        })),
      },
      aggregations: {
        entity_type: {
          buckets: [...buckets].map(([key, doc_count]) => ({ key, doc_count })),
        },
      },
    };
  }

  async indexExists(index: string): Promise<boolean> {
    await this.ensureIndex(index);
    return true;
  }

  async refresh(index: string | string[]) {
    (Array.isArray(index) ? index : [index]).forEach((idx) =>
      this.validateIndex(idx),
    );
    return { acknowledged: true };
  }
}
