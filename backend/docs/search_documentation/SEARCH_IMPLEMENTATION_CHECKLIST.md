# Search Module Implementation Checklist

**Version:** 2.0

Use this as the execution plan and progress tracker.

---

## Phase 0 – Foundation (Do First)

- [x] Create documentation set (`SEARCH_AUDIT`, `ARCHITECTURE`, `ENTITY_COVERAGE`, `SYNC`, `API`, this checklist)
- [ ] Define common interfaces (`SearchableDocument`, result DTOs)
- [ ] Implement low-level `SearchService` (createIndex, bulk, search, delete, exists)
- [ ] Implement index templates / analyzers (`mappings/`)
- [ ] Implement `BulkIndexerService`
- [ ] Implement basic `ReindexService` (batch + progress logging)
- [ ] Wire `SearchModule` with Elasticsearch + Sequelize models

---

## Phase 1 – Core Entities + Global Search

### Entity Services
- [ ] ProjectSearchService (rich document + boost)
- [ ] ClientSearchService
- [ ] UserSearchService
- [ ] LeadSearchService
- [ ] VendorSearchService
- [ ] BoqSearchService (with items_text)
- [ ] BriefSearchService (improve existing flattening)
- [ ] QuotationSearchService (with items_text)
- [ ] SiteRecceSearchService (rooms summary)
- [ ] TaskSearchService
- [ ] CalendarSearchService

### Global Layer
- [ ] GlobalSearchService (multi-index, ranking, pagination, facets)
- [ ] AutocompleteService
- [ ] SearchPermissionFilter / guard
- [ ] DTOs + validation
- [ ] Controller endpoints (global, per-entity, suggest, health, reindex)

### Sync (minimum viable)
- [ ] Hook or event emission for Phase-1 entities
- [ ] Worker / queue consumer that calls indexOne / removeOne
- [ ] Soft-delete handling

---

## Phase 2 – Documents & Procurement / Execution

- [ ] DocumentSearchService + DrawingSearchService
- [ ] MaterialRequirementSearchService
- [ ] WorkOrderSearchService
- [ ] DeliveryChallanSearchService
- [ ] BudgetEstimateSearchService
- [ ] ScopeOfWorkSearchService
- [ ] LibraryItemSearchService
- [ ] ActivityLogSearchService (admin only)
- [ ] Extend global search type registry and boosts
- [ ] Extend reindex coverage

---

## Phase 3 – Hardening

- [ ] Zero-downtime reindex with aliases
- [ ] Metrics (lag, failures, latency)
- [ ] Health endpoint with real index stats
- [ ] Rate limiting / abuse protection on search endpoints
- [ ] Relevance tuning based on real queries
- [ ] Load / volume testing
- [ ] Cut-over from old module (feature flag or route switch)
- [ ] Remove old sequential reindex code

---

## Testing Strategy

| Level        | What to test                                              |
|--------------|-----------------------------------------------------------|
| Unit         | `toDocument()`, query builders, permission filter         |
| Integration  | Index → search round-trip for each entity                 |
| Permission   | User A cannot see Project B’s documents                   |
| Performance  | Global search < 100–150 ms p95 for typical queries        |
| Reindex      | Full reindex completes, counts match MySQL (soft-delete aware) |
| Failure      | One bad document does not stop the batch                  |

---

## Cut-Over Plan

1. Deploy new module side-by-side (different controller path or feature flag).
2. Run full reindex of Phase-1 entities into new indices.
3. Point a small set of internal users to the new global search.
4. Monitor relevance, latency, and errors.
5. Switch primary `/search` route to the new implementation.
6. Decommission old services after a soak period.

---

## Definition of Done (v2.0)

- [ ] All Phase-1 entities searchable with rich documents
- [ ] Global search returns ranked, paginated, permission-filtered results
- [ ] Autocomplete works for projects, clients, BOQs, documents
- [ ] Reindex is bulk-based and observable
- [ ] Soft deletes are respected
- [ ] Documentation is complete and matches the code
- [ ] Old module is no longer the source of truth for search
