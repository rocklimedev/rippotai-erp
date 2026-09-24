/**
 * Shared analysis settings used by all search indices.
 */
export const SHARED_ANALYSIS = {
  analyzer: {
    code_analyzer: {
      tokenizer: 'keyword',
      filter: ['lowercase', 'asciifolding'],
    },
    address_analyzer: {
      tokenizer: 'standard',
      filter: ['lowercase', 'asciifolding', 'address_synonym'],
    },
    material_analyzer: {
      tokenizer: 'standard',
      filter: ['lowercase', 'asciifolding', 'material_synonym'],
    },
    standard_folded: {
      tokenizer: 'standard',
      filter: ['lowercase', 'asciifolding'],
    },
  },
  filter: {
    address_synonym: {
      type: 'synonym',
      synonyms: [
        'rd, road',
        'st, street',
        'apt, apartment',
        'bldg, building',
        'n, north',
        's, south',
        'e, east',
        'w, west',
      ],
    },
    material_synonym: {
      type: 'synonym',
      synonyms: [
        'ply, plywood',
        'vitrified, vitrified tile',
        'acp, aluminium composite panel',
      ],
    },
  },
} as const;

/**
 * Common properties present on every searchable document.
 */
export const BASE_PROPERTIES = {
  entity_type: { type: 'keyword' },
  id: { type: 'keyword' },
  project_id: { type: 'keyword' },
  client_id: { type: 'keyword' },
  title: {
    type: 'text',
    analyzer: 'standard_folded',
    fields: {
      keyword: { type: 'keyword', ignore_above: 256 },
    },
  },
  subtitle: {
    type: 'text',
    analyzer: 'standard_folded',
  },
  status: { type: 'keyword' },
  searchable_text: {
    type: 'text',
    analyzer: 'standard_folded',
  },
  created_at: { type: 'date' },
  updated_at: { type: 'date' },
  visibility: { type: 'keyword' },
  owner_ids: { type: 'keyword' },
  is_deleted: { type: 'boolean' },
} as const;
