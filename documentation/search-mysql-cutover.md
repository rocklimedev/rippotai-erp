# MySQL search API cutover

The existing authenticated `/search`, `/search/suggest`, entity search and
administrator reindex endpoints now use `erp_search_documents` in the ERP MySQL
database. No Elasticsearch client, process, port or credentials are required.
The frontend contracts and entity document builders remain unchanged.

## Deployment

1. Back up the ERP database and retain the current application image and
   Elasticsearch data for rollback.
2. Apply `backend/migrations/20261105_personal_search.sql` to MySQL 8.0.
3. Deploy the backend with its updated lockfile (`npm ci`, then `npm run build`).
   The table is initially empty; schedule a maintenance window for the rebuild.
4. As an administrator with `search:reindex`, call
   `POST /api/v1/search/reindex/all`. Require `success: true`, and inspect every
   entity's `failed` count: the existing bulk indexer returns failures in its
   result even when its enclosing job resolves. Retry failed entities.
5. Compare representative queries against the previous application: titles,
   identifiers, typos, autocomplete, empty-query filters, date/status/client/
   project filters, deleted records, pagination and facets. Test two ordinary
   users in different projects and an administrator. The API-only
   `backend/scripts/validate-search-staging.mjs` verifies global visibility for authenticated users;
   its required environment variables are declared at the top of the script.
6. Measure request latency and database CPU at expected record counts and
   concurrency before switching traffic. Observe successful rebuilds and fresh
   updates through the application's existing indexing entry points.
7. Once verified, stop the separately managed Elasticsearch service and remove
   its obsolete environment settings. This repository's compose file already
   has no Elasticsearch service. Reclaim its data directory/volume only after
   the rollback retention period and after identifying its actual server path.

No production database migration, rebuild, deployment, service stop or volume
deletion is performed by this code change.

## Behavior and limits

- Case and accent folding, weighted best-field matching, AUTO-style edit
  distances (including adjacent transpositions), prefix suggestions, escaped
  highlights, soft deletion are supported. Users with `search:read` can search across projects.
- Structured access and metadata filters run in SQL. Text ranking reads only
  matching candidates in batches of 500 and keeps at most the requested result
  window. Totals/facets count all matching candidates, before pagination.
- Ranking is custom rather than Elasticsearch BM25. Exact scores, ordering,
  highlight fragments are not byte-for-byte
  identical. Relevance needs acceptance testing with real ERP queries.
- Text queries scan all candidates allowed by SQL filters. This saves the
  separate search server's resource footprint, but shifts work to MySQL and
  the API. It is not a proven replacement for Elasticsearch throughput at
  large scale. Load testing is a release gate.
- The result window is 10,000, with at most 50 results per page. SQL writes are
  visible immediately; `refresh` remains a compatible no-op.
- The existing entity serializers, manual rebuild workflow and update/delete
  entry points are reused. This change does not introduce a new source-table
  synchronization worker. Rebuild when those existing entry points are not
  invoked by the application's write paths.
- `material_requirements` and `activity_logs` remain recognized search types
  but have no existing reindex jobs, just as before this change.

## Validation

Run from `backend`:

```
npm run build
npm test -- --runInBand personal-search-engine.spec.ts search-security.spec.ts
```

Unit/API tests simulate storage. A live MySQL migration/write/query test and
production-sized load test must still be completed before server cutover.

Rollback: deploy the previous application image/configuration and restart its
retained Elasticsearch service. The new search table is isolated from ERP
source tables and can remain in place during rollback.
