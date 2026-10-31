import { Injectable } from '@nestjs/common';
import { SearchService } from './search.service';
import { SqlSearchFallbackService } from './sql-search-fallback.service';
import { SuggestItem } from './interfaces/searchable-document.interface';
import { SuggestQueryDto } from './dto/global-search.dto';
import { SearchUserContext } from './global-search.service';
import { searchScopeFilter } from './search-access';

const SUGGEST_INDICES = [
  'projects',
  'clients',
  'boqs',
  'quotations',
  'documents',
  'drawings',
  'vendors',
];

@Injectable()
export class AutocompleteService {
  constructor(
    private readonly searchService: SearchService,
    private readonly sqlFallback: SqlSearchFallbackService,
  ) {}

  async suggest(
    dto: SuggestQueryDto,
    user: SearchUserContext,
  ): Promise<SuggestItem[]> {
    const scope = searchScopeFilter(user);
    const q = dto.q?.trim();
    if (!q || q.length < 2) return [];

    const limit = Math.min(dto.limit ?? 8, 15);

    const filter: any[] = [{ term: { is_deleted: false } }, scope];

    let response: any;
    try {
      response = await this.searchService.search(SUGGEST_INDICES, {
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: q,
                  type: 'bool_prefix',
                  fields: [
                    'title^4',
                    'title.keyword^6',
                    'subtitle',
                    'boq_number',
                    'quotation_number',
                    'drawing_number',
                    'doc_no',
                    'client_name',
                  ],
                },
              },
            ],
            filter,
          },
        },
        _source: [
          'entity_type',
          'title',
          'subtitle',
          'client_name',
          'project_name',
        ],
      });
    } catch {
      response = null;
    }
    if (!response || response.noIndices) {
      const hits = await this.sqlFallback.search(q, user, {
        entities: ['project', 'client', 'boq', 'quotation', 'vendor'],
        limit,
      });
      return hits.map((h) => ({
        entity_type: h.entity_type,
        id: h.id,
        label: h.title,
        secondary: h.subtitle ?? null,
      }));
    }

    return (response.hits?.hits ?? []).map((hit: any) => {
      const src = hit._source ?? {};
      return {
        entity_type: src.entity_type ?? 'unknown',
        id: hit._id,
        label: src.title ?? 'Untitled',
        secondary: src.subtitle ?? src.client_name ?? src.project_name ?? null,
      };
    });
  }
}
