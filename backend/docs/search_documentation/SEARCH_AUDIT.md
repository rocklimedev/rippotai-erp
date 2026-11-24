# Search Module Audit Report

**Date:** 2026-09-24  
**System:** Rippota i ERP (`spsyn8lm_rippotai_erp`)  
**Auditor:** Search Module Rebuild Initiative

---

## 1. Executive Summary

The existing Search module is a **prototype-level implementation**. It indexes only ~11 entities using basic Elasticsearch multi-match queries and sequential full-table reindexing. Relative to the breadth and relational depth of the ERP schema, it is **immature and undercooked**.

**Key Finding:** Users will frequently experience “I know this exists but search can’t find it.” The module covers roughly 15–20% of the searchable surface area of the domain.

---

## 2. Current Coverage vs Schema Reality

| Domain              | Key Tables / Concepts                                      | Current Coverage          | Gap Severity |
|---------------------|------------------------------------------------------------|---------------------------|--------------|
| Core                | projects, clients, users, roles, teams                     | Partial                   | Medium       |
| CRM / Sales         | leads, quotations, quotation_items, quotation_versions     | Partial                   | Medium       |
| Design / Planning   | boqs, boq_items, budget_estimates, scope_of_work, briefs   | Partial (BOQ + Brief)     | High         |
| Procurement         | vendors, material_requirements, POs, delivery_challans, WOs| Vendors only              | Critical     |
| Site / Execution    | site_recces, drawings, documents, document_versions        | Site Recces only          | Critical     |
| Library / Masters   | library_items, material_masters, units                     | None                      | High         |
| Workflow / Audit    | tasks, calendar_events, activity_logs, gate_*              | Partial                   | High         |
| Finance             | invoices, payments (implied)                               | None                      | Medium       |

**Entities currently indexed:**  
BOQs, Project Briefs, Calendar Events, Clients, Leads, Projects, Quotations, Site Recces, Tasks, Users, Vendors.

---

## 3. Technical Weaknesses

| Area                | Current State                                      | Impact at Scale                                      |
|---------------------|----------------------------------------------------|------------------------------------------------------|
| Index Design        | No explicit mappings / analyzers                   | Poor handling of codes, addresses, material names    |
| Document Richness   | Mostly top-level + few denormalized names          | Cannot search inside line items, rooms, documents    |
| Global Search       | Fan-out of 11 independent queries                  | No cross-entity ranking, no pagination, no facets    |
| Sync Strategy       | Manual reindex endpoints + ad-hoc calls            | Stale data inevitable                                |
| Query Power         | Simple multi_match only                            | No filters, autocomplete, highlighting, aggregations |
| Performance         | `findAll` + sequential `index` calls               | Will degrade badly with volume                       |
| Security            | No permission filtering visible                    | Users can see data outside their scope               |
| Observability       | console.error only                                 | No lag metrics, failure tracking, or health checks   |

---

## 4. Risks of Leaving As-Is

1. **User trust erosion** – Search becomes unreliable and is abandoned.
2. **Operational pain** – Manual reindexes become frequent and risky.
3. **Feature blockage** – Advanced UX (global search bar, filters, suggestions) cannot be built on this foundation.
4. **Technical debt explosion** – Every new entity will be bolted on with the same weak patterns.
5. **Security exposure** – Lack of scoping can leak project or client data.

---

## 5. What the New Module Fixes

| Problem                         | Solution in New Module                                      |
|---------------------------------|-------------------------------------------------------------|
| Limited coverage                | Phase 1 + Phase 2 entity expansion (Documents, Drawings, MRs, WOs, etc.) |
| No mappings                     | Explicit index templates + custom analyzers                 |
| Thin documents                  | Rich denormalized documents + nested/flattened children     |
| Poor global search              | Unified ranking, pagination, filters, highlighting, facets  |
| Unreliable sync                 | Event/queue-based + bulk indexer + soft-delete awareness    |
| No security                     | Permission-aware filtering (project membership, visibility) |
| No observability                | Health endpoints, structured logging, reindex status        |

---

## 6. Conclusion

The current Search module is a useful starting point for learning the domain but **must be rebuilt** before it can serve as a first-class feature of a production ERP. The rebuild prioritises correctness, coverage, ranking quality, and operational reliability over quick patches.

See also:
- `SEARCH_ARCHITECTURE.md`
- `SEARCH_ENTITY_COVERAGE.md`
- `SEARCH_IMPLEMENTATION_CHECKLIST.md`
