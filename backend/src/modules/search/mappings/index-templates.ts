import { BASE_PROPERTIES, SHARED_ANALYSIS } from './analyzers';

function buildMapping(extraProperties: Record<string, unknown>) {
  return {
    settings: {
      analysis: SHARED_ANALYSIS,
      number_of_shards: 1,
      number_of_replicas: 0, // raise in production
    },
    mappings: {
      properties: {
        ...BASE_PROPERTIES,
        ...extraProperties,
      },
    },
  };
}

export const INDEX_MAPPINGS: Record<string, ReturnType<typeof buildMapping>> = {
  projects: buildMapping({
    slug: { type: 'keyword' },
    site_location: { type: 'text', analyzer: 'address_analyzer' },
    description: { type: 'text', analyzer: 'standard_folded' },
    priority: { type: 'keyword' },
    current_phase: { type: 'keyword' },
    client_name: {
      type: 'text',
      analyzer: 'standard_folded',
      fields: { keyword: { type: 'keyword' } },
    },
    project_type: { type: 'keyword' },
    progress_pct: { type: 'float' },
    approved_value: { type: 'double' },
    timeline_status: { type: 'keyword' },
    next_milestone_name: { type: 'text', analyzer: 'standard_folded' },
  }),

  clients: buildMapping({
    slug: { type: 'keyword' },
    contact_person: { type: 'text', analyzer: 'standard_folded' },
    email: { type: 'keyword' },
    phone: { type: 'keyword' },
    address: { type: 'text', analyzer: 'address_analyzer' },
    projects_count: { type: 'integer' },
  }),

  users: buildMapping({
    email: { type: 'keyword' },
    phone: { type: 'keyword' },
    job_title: { type: 'text', analyzer: 'standard_folded' },
    role_name: { type: 'keyword' },
    is_active: { type: 'boolean' },
  }),

  vendors: buildMapping({
    company_name: { type: 'text', analyzer: 'standard_folded' },
    contact_number: { type: 'keyword' },
    alternate_contact: { type: 'keyword' },
    address: { type: 'text', analyzer: 'address_analyzer' },
    notes: { type: 'text', analyzer: 'standard_folded' },
    category: { type: 'keyword' },
    business_type: { type: 'keyword' },
  }),

  boqs: buildMapping({
    boq_number: {
      type: 'text',
      analyzer: 'code_analyzer',
      fields: { keyword: { type: 'keyword' } },
    },
    client_name: { type: 'text', analyzer: 'standard_folded' },
    location: { type: 'text', analyzer: 'address_analyzer' },
    prepared_by: { type: 'text', analyzer: 'standard_folded' },
    total_value: { type: 'double' },
    project_name: { type: 'text', analyzer: 'standard_folded' },
    items_text: { type: 'text', analyzer: 'standard_folded' },
    version: { type: 'integer' },
    locked: { type: 'boolean' },
  }),

  quotations: buildMapping({
    quotation_number: {
      type: 'text',
      analyzer: 'code_analyzer',
      fields: { keyword: { type: 'keyword' } },
    },
    project_name: { type: 'text', analyzer: 'standard_folded' },
    vendor_name: { type: 'text', analyzer: 'standard_folded' },
    boq_reference: { type: 'keyword' },
    total_amount: { type: 'double' },
    items_text: { type: 'text', analyzer: 'standard_folded' },
    comparison_notes: { type: 'text', analyzer: 'standard_folded' },
    review_remarks: { type: 'text', analyzer: 'standard_folded' },
  }),

  project_briefs: buildMapping({
    site_address: { type: 'text', analyzer: 'address_analyzer' },
    property_type: { type: 'keyword' },
    project_name: { type: 'text', analyzer: 'standard_folded' },
    initial_client_budget: { type: 'double' },
    budget_currency: { type: 'keyword' },
  }),

  site_recces: buildMapping({
    project_name: { type: 'text', analyzer: 'standard_folded' },
    client_name: { type: 'text', analyzer: 'standard_folded' },
    site_address: { type: 'text', analyzer: 'address_analyzer' },
    site_type: { type: 'keyword' },
    site_engineer: { type: 'text', analyzer: 'standard_folded' },
    rooms_summary: { type: 'text', analyzer: 'standard_folded' },
    recce_date: { type: 'date' },
  }),

  documents: buildMapping({
    doc_no: {
      type: 'text',
      analyzer: 'code_analyzer',
      fields: { keyword: { type: 'keyword' } },
    },
    category: { type: 'keyword' },
    filename: { type: 'keyword' },
    version: { type: 'keyword' },
    remarks: { type: 'text', analyzer: 'standard_folded' },
    project_name: { type: 'text', analyzer: 'standard_folded' },
  }),

  drawings: buildMapping({
    drawing_number: {
      type: 'text',
      analyzer: 'code_analyzer',
      fields: { keyword: { type: 'keyword' } },
    },
    discipline: { type: 'keyword' },
    phase_code: { type: 'keyword' },
    sheet_number: { type: 'keyword' },
    project_name: { type: 'text', analyzer: 'standard_folded' },
  }),

  tasks: buildMapping({
    priority: { type: 'keyword' },
    due_date: { type: 'date' },
    project_name: { type: 'text', analyzer: 'standard_folded' },
  }),

  calendar_events: buildMapping({
    type: { type: 'keyword' },
    location: { type: 'text', analyzer: 'address_analyzer' },
    description: { type: 'text', analyzer: 'standard_folded' },
    project_name: { type: 'text', analyzer: 'standard_folded' },
    starts_at: { type: 'date' },
    ends_at: { type: 'date' },
  }),

  // Phase-2 placeholders – expand as services are added
  material_requirements: buildMapping({
    project_name: { type: 'text', analyzer: 'standard_folded' },
    materials_summary: { type: 'text', analyzer: 'material_analyzer' },
  }),

  work_orders: buildMapping({
    wo_id: {
      type: 'text',
      analyzer: 'code_analyzer',
      fields: { keyword: { type: 'keyword' } },
    },
    project_name: { type: 'text', analyzer: 'standard_folded' },
    contractor_name: { type: 'text', analyzer: 'standard_folded' },
    site_address: { type: 'text', analyzer: 'address_analyzer' },
    total_amount: { type: 'double' },
    items_text: { type: 'text', analyzer: 'standard_folded' },
  }),

  delivery_challans: buildMapping({
    challan_number: {
      type: 'text',
      analyzer: 'code_analyzer',
      fields: { keyword: { type: 'keyword' } },
    },
    project_name: { type: 'text', analyzer: 'standard_folded' },
    vendor_name: { type: 'text', analyzer: 'standard_folded' },
    site_address: { type: 'text', analyzer: 'address_analyzer' },
  }),

  budget_estimates: buildMapping({
    estimate_number: {
      type: 'text',
      analyzer: 'code_analyzer',
      fields: { keyword: { type: 'keyword' } },
    },
    project_name: { type: 'text', analyzer: 'standard_folded' },
    total_amount: { type: 'double' },
    items_text: { type: 'text', analyzer: 'standard_folded' },
  }),

  activity_logs: buildMapping({
    action: { type: 'keyword' },
    entity_label: { type: 'text', analyzer: 'standard_folded' },
    user_email: { type: 'keyword' },
    user_role: { type: 'keyword' },
  }),
};

export type SearchIndexName = keyof typeof INDEX_MAPPINGS;
