import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from './search.service';
import {
  GlobalSearchResult,
  SearchHit,
  EntityType,
} from './interfaces/searchable-document.interface';
import { GlobalSearchQueryDto } from './dto/global-search.dto';

/** Relative boost weights used when ranking across entity types */
const TYPE_BOOST: Partial<Record<EntityType, number>> = {
  project: 3.0,
  client: 2.8,
  boq: 2.2,
  quotation: 2.2,
  document: 2.0,
  drawing: 2.0,
  vendor: 1.8,
  lead: 1.7,
  project_brief: 1.6,
  site_recce: 1.5,
  work_order: 1.5,
  material_requirement: 1.4,
  task: 1.3,
  calendar_event: 1.2,
  budget_estimate: 1.4,
  delivery_challan: 1.3,
  activity_log: 0.6,
};

/** Default indices that participate in global search (Phase 1 + key Phase 2) */
const DEFAULT_INDICES: string[] = [
  'projects',
  'clients',
  'users',
  'leads',
  'vendors',
  'boqs',
  'project_briefs',
  'quotations',
  'site_recces',
  'tasks',
  'calendar_events',
  'documents',
  'drawings',
  'work_orders',
  'material_requirements',
  'delivery_challans',
  'budget_estimates',
  'activity_logs',
];

/** Map entity_type → index name */
const ENTITY_TO_INDEX: Record<string, string> = {
  project: 'projects',
  client: 'clients',
  user: 'users',
  lead: 'leads',
  vendor: 'vendors',
  boq: 'boqs',
  project_brief: 'project_briefs',
  quotation: 'quotations',
  site_recce: 'site_recces',
  task: 'tasks',
  calendar_event: 'calendar_events',
  document: 'documents',
  drawing: 'drawings',
  work_order: 'work_orders',
  material_requirement: 'material_requirements',
  delivery_challan: 'delivery_challans',
  budget_estimate: 'budget_estimates',
  activity_log: 'activity_logs',
};

export interface SearchUserContext {
  id: string;
  role?: string;
  isAdmin?: boolean;
  projectIds?: string[]; // projects the user can see
}

@Injectable()
export class GlobalSearchService {
  private readonly logger = new Logger(GlobalSearchService.name);

  constructor(private readonly searchService: SearchService) {}

  async search(
    dto: GlobalSearchQueryDto,
    user: SearchUserContext,
  ): Promise<GlobalSearchResult> {
    const page = dto.page ?? 1;
    const pageSize = Math.min(dto.pageSize ?? 20, 50);
    const from = (page - 1) * pageSize;

    const indices = this.resolveIndices(dto.types);
    const query = this.buildQuery(dto, user);

    const body: Record<string, any> = {
      from,
      size: pageSize,
      query,
      highlight: {
        fields: {
          title: { number_of_fragments: 1 },
          subtitle: { number_of_fragments: 1 },
          searchable_text: {
            number_of_fragments: 2,
            fragment_size: 120,
          },
        },
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
      },
      aggs: {
        entity_type: {
          terms: {
            field: 'entity_type',
            size: 30,
          },
        },
      },
      sort: [
        { _score: 'desc' },
        {
          updated_at: {
            order: 'desc',
            unmapped_type: 'date',
          },
        },
      ],
    };

    const start = Date.now();

    const response = await this.searchService.search(indices, body);

    const took_ms = Date.now() - start;

    const hits = (response.hits?.hits ?? []).map((hit: any) =>
      this.mapHit(hit),
    );

    const total =
      typeof response.hits?.total === 'number'
        ? response.hits.total
        : (response.hits?.total?.value ?? 0);

    const facets: GlobalSearchResult['facets'] = {};

    /**
     * Elasticsearch types `aggregations` as a union of all possible
     * aggregation types. Since `entity_type` is explicitly a `terms`
     * aggregation in our query, narrow it to the terms shape here.
     */
    const entityTypeAggregation =
      'aggregations' in response
        ? response.aggregations?.entity_type
        : undefined;

    const typeBuckets =
      entityTypeAggregation &&
      'buckets' in entityTypeAggregation &&
      Array.isArray(entityTypeAggregation.buckets)
        ? entityTypeAggregation.buckets
        : undefined;

    if (typeBuckets) {
      facets.entity_type = {};

      for (const bucket of typeBuckets) {
        facets.entity_type[String(bucket.key)] = bucket.doc_count;
      }
    }

    return {
      results: hits,
      total,
      page,
      pageSize,
      took_ms: response.took ?? took_ms,
      facets,
    };
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private resolveIndices(types?: string): string[] {
    if (!types?.trim()) return DEFAULT_INDICES;

    const requested = types
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const indices = requested
      .map((t) => ENTITY_TO_INDEX[t] ?? t)
      .filter((idx) => DEFAULT_INDICES.includes(idx) || true);

    return indices.length ? indices : DEFAULT_INDICES;
  }

  private buildQuery(dto: GlobalSearchQueryDto, user: SearchUserContext) {
    const must: any[] = [];
    const filter: any[] = [];
    const mustNot: any[] = [];

    // Soft-delete filter
    if (!dto.includeDeleted || !user.isAdmin) {
      mustNot.push({ term: { is_deleted: true } });
    }

    // Free-text
    if (dto.q?.trim()) {
      must.push({
        multi_match: {
          query: dto.q.trim(),
          fields: [
            'title^6',
            'subtitle^3',
            'searchable_text^2',
            'boq_number^4',
            'quotation_number^4',
            'drawing_number^4',
            'doc_no^4',
            'wo_id^3',
            'challan_number^3',
            'client_name^3',
            'project_name^3',
            'vendor_name^2',
            'site_location^2',
            'site_address^2',
          ],
          fuzziness: 'AUTO',
          type: 'best_fields',
        },
      });
    } else {
      // Match-all when only filters are supplied
      must.push({ match_all: {} });
    }

    // Type boost via function_score would be ideal; for simplicity we rely on
    // field boosts + per-index queries later. Here we keep a clean bool query.

    if (dto.projectId) {
      filter.push({ term: { project_id: dto.projectId } });
    }
    if (dto.clientId) {
      filter.push({ term: { client_id: dto.clientId } });
    }
    if (dto.status) {
      filter.push({ term: { status: dto.status } });
    }
    if (dto.from || dto.to) {
      const range: any = {};
      if (dto.from) range.gte = dto.from;
      if (dto.to) range.lte = dto.to;
      filter.push({ range: { updated_at: range } });
    }

    // Permission filter
    if (!user.isAdmin && user.projectIds?.length) {
      filter.push({
        bool: {
          should: [
            { terms: { project_id: user.projectIds } },
            { bool: { must_not: { exists: { field: 'project_id' } } } }, // global entities
          ],
          minimum_should_match: 1,
        },
      });
    } else if (!user.isAdmin && !user.projectIds?.length) {
      // User has no projects – only allow non-project-scoped entities
      filter.push({
        bool: {
          must_not: { exists: { field: 'project_id' } },
        },
      });
    }

    return {
      bool: {
        must,
        filter,
        must_not: mustNot.length ? mustNot : undefined,
      },
    };
  }

  private mapHit(hit: any): SearchHit {
    const src = hit._source ?? {};
    const entityType = src.entity_type ?? 'unknown';

    // Apply a soft type boost to the displayed score for ranking transparency
    const typeBoost = TYPE_BOOST[entityType as EntityType] ?? 1;
    const score = (hit._score ?? 0) * typeBoost;

    return {
      entity_type: entityType,
      id: hit._id,
      title: src.title ?? src.name ?? 'Untitled',
      subtitle: src.subtitle ?? null,
      score,
      highlight: hit.highlight,
      meta: {
        status: src.status,
        project_id: src.project_id,
        client_id: src.client_id,
        updated_at: src.updated_at,
        ...src,
      },
    };
  }
}
