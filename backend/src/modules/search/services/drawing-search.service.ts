import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Drawing } from '@/modules/documents/models/drawing.model';

@Injectable()
export class DrawingSearchService {
  private readonly logger = new Logger(DrawingSearchService.name);
  private readonly INDEX = 'drawings';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Drawing) private readonly drawingModel: typeof Drawing,
  ) {}

  private toDocument(d: any): SearchableDocument {
    const projectName = d.project?.name ?? '';
    const number = d.drawingNumber ?? d.drawing_number ?? '';
    const title = d.title ?? number ?? 'Untitled Drawing';
    const subtitle = [projectName, d.discipline, d.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'drawing',
      id: d.id,
      project_id: d.projectId ?? d.project_id ?? null,
      title,
      subtitle,
      status: d.status ?? null,
      searchable_text: [
        d.title,
        number,
        d.discipline,
        d.phaseCode ?? d.phase_code,
        d.sheetNumber ?? d.sheet_number,
        d.remarks,
        projectName,
        d.status,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: d.created_at ?? d.createdAt,
      updated_at: d.updated_at ?? d.updatedAt,
      visibility: 'project',
      is_deleted: false,

      drawing_number: number,
      discipline: d.discipline,
      phase_code: d.phaseCode ?? d.phase_code,
      sheet_number: d.sheetNumber ?? d.sheet_number,
      project_name: projectName,
    };
  }

  async indexOne(id: string): Promise<void> {
    const drawing = await this.drawingModel.findByPk(id, {
      include: [{ association: 'project', required: false }],
    });
    if (!drawing) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      drawing.id,
      this.toDocument(drawing),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.drawingModel.findAll({
      include: [{ association: 'project', required: false }],
    });
    const items = rows.map((d) => ({
      index: this.INDEX,
      id: d.id,
      document: this.toDocument(d),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed drawings: ${result.indexed}/${result.total}`);
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
            'drawing_number^6',
            'discipline^3',
            'project_name^3',
            'phase_code^2',
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
