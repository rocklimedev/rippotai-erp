import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Document } from '@/modules/documents/models/document.model';

@Injectable()
export class DocumentSearchService {
  private readonly logger = new Logger(DocumentSearchService.name);
  private readonly INDEX = 'documents';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Document) private readonly documentModel: typeof Document,
  ) {}

  private toDocument(doc: any): SearchableDocument {
    const projectName = doc.project?.name ?? '';
    const title = doc.title ?? doc.doc_no ?? doc.docNo ?? 'Untitled Document';
    const subtitle = [projectName, doc.category, doc.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'document',
      id: doc.id,
      project_id: doc.projectId ?? doc.project_id ?? null,
      title,
      subtitle,
      status: doc.status ?? null,
      searchable_text: [
        doc.title,
        doc.doc_no ?? doc.docNo,
        doc.category,
        doc.remarks,
        doc.filename,
        projectName,
        doc.status,
        doc.version,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: doc.created_at ?? doc.createdAt,
      updated_at: doc.updated_at ?? doc.updatedAt,
      visibility: doc.visibility ?? 'internal',
      is_deleted: false,

      doc_no: doc.doc_no ?? doc.docNo,
      category: doc.category,
      filename: doc.filename,
      version: doc.version,
      remarks: doc.remarks,
      project_name: projectName,
    };
  }

  async indexOne(id: string): Promise<void> {
    const doc = await this.documentModel.findByPk(id, {
      include: [{ association: 'project', required: false }],
    });
    if (!doc) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      doc.id,
      this.toDocument(doc),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.documentModel.findAll({
      include: [{ association: 'project', required: false }],
    });
    const items = rows.map((d) => ({
      index: this.INDEX,
      id: d.id,
      document: this.toDocument(d),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed documents: ${result.indexed}/${result.total}`);
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
            'doc_no^5',
            'category^3',
            'project_name^3',
            'remarks^2',
            'filename^2',
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
