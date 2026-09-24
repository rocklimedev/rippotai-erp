/**
 * Base shape that every searchable document must satisfy.
 * Entity-specific fields are added on top of this.
 */
export interface SearchableDocument {
  entity_type: string;
  id: string;
  project_id?: string | null;
  client_id?: string | null;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  searchable_text: string;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  visibility?: string | null;
  owner_ids?: string[] | null;
  is_deleted?: boolean;
  [key: string]: unknown;
}

export interface SearchHit<T = SearchableDocument> {
  entity_type: string;
  id: string;
  title: string;
  subtitle?: string | null;
  score: number;
  highlight?: Record<string, string[]>;
  meta: Partial<T> & {
    status?: string | null;
    project_id?: string | null;
    updated_at?: string | Date | null;
    [key: string]: unknown;
  };
}

export interface GlobalSearchResult {
  results: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  took_ms: number;
  facets?: {
    entity_type?: Record<string, number>;
    [key: string]: Record<string, number> | undefined;
  };
}

export interface SuggestItem {
  entity_type: string;
  id: string;
  label: string;
  secondary?: string | null;
}

export type EntityType =
  | 'project'
  | 'client'
  | 'user'
  | 'lead'
  | 'vendor'
  | 'boq'
  | 'project_brief'
  | 'quotation'
  | 'site_recce'
  | 'task'
  | 'calendar_event'
  | 'document'
  | 'drawing'
  | 'material_requirement'
  | 'work_order'
  | 'delivery_challan'
  | 'budget_estimate'
  | 'scope_of_work'
  | 'library_item'
  | 'activity_log';
