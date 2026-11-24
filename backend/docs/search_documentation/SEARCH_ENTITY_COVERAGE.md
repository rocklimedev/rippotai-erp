# Search Entity Coverage

**Version:** 2.0

This document defines which entities are searchable, which fields are indexed, how related data is handled, and the rollout phase.

---

## Phase 1 – Core + High-Value Entities (Must Ship First)

| Entity              | Index Name          | Key Searchable Fields                                      | Related / Children Handling                          | Notes |
|---------------------|---------------------|------------------------------------------------------------|------------------------------------------------------|-------|
| Project             | `projects`          | name, slug, site_location, description, status, phase, client name, project_type | Counts of BOQs / Quotations                          | Highest boost |
| Client              | `clients`           | name, contact_person, email, phone, address, slug          | projects_count                                       | High boost |
| User                | `users`             | name, email, phone, job_title                              | role name                                            | Internal only |
| Lead                | `leads`             | name, company, email, phone, stage, notes                  | –                                                    | CRM |
| Vendor              | `vendors`           | name, company_name, contact, address, category, business_type, notes | quotations_count                                     | Procurement |
| BOQ                 | `boqs`              | title, boq_number, client_name, location, status, project name | items_text (concat of item names), total_value       | Design |
| Project Brief       | `project_briefs`    | site_address, property_type, budget fields, status, project | Full flattened searchable_content (children)         | Keep rich approach |
| Quotation           | `quotations`        | quotation_number, project, vendor, status, boq_reference, notes | items_text, total_amount                             | Sales |
| Site Recce          | `site_recces`       | project_name, client_name, site_address, site_type, engineer | rooms_summary                                        | Site |
| Task                | `tasks`             | title, status, priority, due_date, project                 | –                                                    | Workflow |
| Calendar Event      | `calendar_events`   | title, type, location, description, project                | attendees (names)                                    | Workflow |

---

## Phase 2 – Documents, Procurement & Execution

| Entity                | Index Name               | Key Searchable Fields                                      | Related / Children Handling                    | Notes |
|-----------------------|--------------------------|------------------------------------------------------------|------------------------------------------------|-------|
| Document              | `documents`              | title, doc_no, category, status, remarks, project          | version info, filename                         | Critical |
| Drawing               | `drawings`               | title, drawing_number, discipline, phase, status, project  | revision summary                               | Critical |
| Material Requirement  | `material_requirements`  | title / number, project, status, notes                      | key materials summary                          | Procurement |
| Work Order            | `work_orders`            | wo_id, project, vendor/contractor, status, site_address     | items_text, total_amount                       | Execution |
| Delivery Challan      | `delivery_challans`      | challan_number, project, vendor, status, site_address      | items summary                                  | Logistics |
| Budget Estimate       | `budget_estimates`       | estimate_number, title, project, status, total_amount      | items_text                                     | Planning |
| Scope of Work         | `scope_of_work`          | project, scope_summary, status, exclusions                 | scope_items summary                            | Planning |
| Library Item          | `library_items`          | name, code, unit, category, notes                          | –                                              | Masters |
| Activity Log          | `activity_logs`          | action, entity_type, entity_label, user_email, changes     | –                                              | Admin only |

---

## Phase 3 – Nice-to-Have / Later

- Purchase Orders
- Inventory Transactions
- Gate / Phase progress records
- Team / Role search (admin)
- Full OCR / extracted text for PDFs and drawings (future)

---

## Common Fields Present on Every Document

```ts
{
  entity_type: string;       // e.g. "project", "boq", "document"
  id: string;
  project_id?: string;
  client_id?: string;
  title: string;
  subtitle?: string;
  status?: string;
  searchable_text: string;   // free-text bag
  created_at: string;        // ISO
  updated_at: string;
  visibility?: string;       // "internal" | "project" | "public" etc.
  owner_ids?: string[];
  is_deleted?: boolean;
}
```

---

## Boosting Guidelines (Global Search)

| Entity Type       | Relative Boost | Rationale                     |
|-------------------|----------------|-------------------------------|
| project           | Highest        | Primary navigation object     |
| client            | Very High      | Primary navigation object     |
| boq, quotation    | High           | Money & design critical       |
| document, drawing | High           | Frequently needed             |
| vendor, lead      | Medium-High    | CRM / Procurement             |
| site_recce, task  | Medium         | Operational                   |
| activity_log      | Low            | Admin / audit only            |

---

## Soft Delete Policy

- Documents with `deleted_at` set are either:
  - Excluded from normal search, or
  - Indexed with `is_deleted: true` and filtered out by default.
- Reindex jobs respect soft deletes.

---

## Notes for Implementers

1. When adding a new entity, implement a `*SearchService` that:
   - Defines `toDocument()`
   - Implements `indexOne`, `updateOne`, `removeOne`, `reindexAll`
   - Registers its index name and boost weight with the GlobalSearchService
2. Prefer denormalizing names over forcing expensive joins at search time.
3. Keep `searchable_text` as a single well-analyzed field for free-text fallback.
