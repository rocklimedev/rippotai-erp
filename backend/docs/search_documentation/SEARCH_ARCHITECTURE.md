# Search Module Architecture

**Version:** 2.0  
**System:** Rippota i ERP

---

## 1. Goals

- Fast, relevant, permission-aware search across the major entities of the ERP.
- Near real-time consistency with the primary MySQL database.
- Support for global search, entity-specific search, and autocomplete.
- Operational safety (bulk reindex, alias swap, health checks).
- Clear separation of concerns so new entities can be added without rewriting the core.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  SearchController  →  GlobalSearchService / EntityServices  │
│  AutocompleteService  ·  ReindexService  ·  HealthService   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     Search Core                             │
│  SearchService (low-level ES)  ·  BulkIndexerService        │
│  IndexMappings  ·  DocumentBuilders                         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  Entity Search Services                     │
│  Project · Client · BOQ · Quotation · Document · Drawing    │
│  MaterialRequirement · WorkOrder · SiteRecce · …            │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Sync Layer                               │
│  Domain Events / Outbox  →  Search Workers (queue)          │
│  (Fallback: Sequelize hooks + background jobs)              │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                 Elasticsearch Cluster                       │
│  Indices (or unified index) + Aliases + Templates           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Index Strategy

**Recommended approach (v2):**  
**Multi-index with a common document shape + a unified global search query.**

Reasons:
- Different entities have different field needs and analyzers.
- Easier to tune mappings and ILM per entity type.
- Global search can still query multiple indices with type-aware boosting.

Alternative considered: single unified index with `entity_type`.  
We keep the door open for this later if operational simplicity becomes more important than mapping flexibility.

### Common Document Fields (every entity)

| Field            | Type      | Purpose                              |
|------------------|-----------|--------------------------------------|
| `entity_type`    | keyword   | Filtering & ranking                  |
| `id`             | keyword   | Primary key                          |
| `project_id`     | keyword   | Scoping & permission                 |
| `client_id`      | keyword   | Scoping                              |
| `title`          | text      | Primary display + search             |
| `subtitle`       | text      | Secondary display                    |
| `status`         | keyword   | Filtering                            |
| `searchable_text`| text      | Full free-text bag                   |
| `created_at`     | date      | Recency boost / range filter         |
| `updated_at`     | date      | Recency                              |
| `visibility`     | keyword   | Permission hints                     |
| `owner_ids`      | keyword[] | Permission hints                     |

Entity-specific fields are added on top of this base.

---

## 4. Document Design Principles

1. **Denormalize aggressively** for search (project name, client name, vendor name, phase, key amounts).
2. **Flatten or nest children** deliberately:
   - BOQ / Quotation line items → concatenated `items_text` + optional nested.
   - Site Recce rooms → summary + key measurements.
   - Documents → title, number, remarks, version info.
3. **Always include soft-delete awareness** (`deleted_at` / `is_deleted`).
4. **Keep documents reasonably small** – avoid dumping entire JSON blobs unless they are truly searchable.

---

## 5. Sync Strategy (Summary)

Preferred long-term: **Outbox / Domain Events → Queue → Search Worker**.

Short-term acceptable: Sequelize afterCreate / afterUpdate / afterDestroy hooks that enqueue indexing jobs (BullMQ / similar).

Full historical rebuild: `ReindexService` using Elasticsearch Bulk API + optional alias swap for zero downtime.

See `SEARCH_SYNC_STRATEGY.md` for details.

---

## 6. Global Search Ranking Strategy

1. Multi-index (or multi-type) query.
2. Per-entity field boosting (name/title highest, then codes, then body text).
3. Soft recency boost on `updated_at`.
4. Type boosts (e.g. Projects and Clients slightly higher than Activity Logs).
5. Permission filter applied as a must clause.
6. Results merged, re-ranked if necessary, paginated, and returned in a unified shape.

---

## 7. Permission Model

- Every searchable document carries `project_id` (and optionally `client_id`, `owner_ids`, `visibility`).
- Global and entity search always receive the current user context.
- A `SearchPermissionFilter` builds a `must` / `filter` clause:
  - Admin / super-user → no restriction (or only soft-delete filter).
  - Normal user → `project_id` IN (projects the user belongs to) OR public visibility rules.
- Activity Logs and certain admin entities are restricted by role.

---

## 8. Folder Structure

```
src/modules/search/
├── search.module.ts
├── search.controller.ts
├── search.service.ts                 # Low-level ES client wrapper
├── global-search.service.ts
├── autocomplete.service.ts
├── dto/
│   ├── global-search.dto.ts
│   ├── search-result.dto.ts
│   └── ...
├── interfaces/
│   ├── searchable-document.interface.ts
│   └── ...
├── mappings/
│   ├── index-templates.ts
│   └── analyzers.ts
├── indexing/
│   ├── bulk-indexer.service.ts
│   └── reindex.service.ts
├── services/                         # One (or grouped) per entity
│   ├── project-search.service.ts
│   ├── client-search.service.ts
│   ├── boq-search.service.ts
│   ├── document-search.service.ts
│   └── ...
├── events/                           # Optional domain event listeners
└── guards/
    └── search-permission.filter.ts
```

---

## 9. Key Design Decisions & Trade-offs

| Decision                        | Rationale                                      | Trade-off                          |
|---------------------------------|------------------------------------------------|------------------------------------|
| Multi-index                     | Better mapping control                         | Slightly more complex global query |
| Common base fields              | Consistent global ranking & filtering          | Some duplication                   |
| Queue-based sync                | Reliable, non-blocking                         | Extra infrastructure               |
| Permission at query time        | Secure by default                              | Slightly more complex queries      |
| Explicit mappings               | Predictable relevance & performance            | More up-front work                 |
| Phased entity rollout           | Deliver value early                            | Temporary incomplete coverage      |

---

## 10. Related Documents

- `SEARCH_AUDIT.md` – Why we are rebuilding
- `SEARCH_INDEX_MAPPINGS.md` – Concrete mappings & analyzers
- `SEARCH_ENTITY_COVERAGE.md` – What is indexed and how
- `SEARCH_API.md` – Public API contract
- `SEARCH_SYNC_STRATEGY.md` – How data stays fresh
- `SEARCH_IMPLEMENTATION_CHECKLIST.md` – Execution plan
