# Search authorization and staging validation

Review owner: ERP backend maintainers (Search module)
Last reviewed: 2026-10-10

## Implemented policy

Every `/api/v1/search` route explicitly uses `JwtAuthGuard`, including suggestions, entity routes, health and reindexing. Anonymous requests are denied. Both `POST /reindex/all` and `POST /reindex/:entity` require a nonempty authenticated principal with the database-resolved `roleName` of `ADMIN` or `SUPERADMIN`. A caller-supplied `isAdmin`, `role`, query or project-ID list is not trusted.

For non-admin searches, `SearchScopeService` loads non-deleted project team assignments (`owner_type=PROJECT`) and projects created by the principal, then resolves only non-deleted projects. Scope lookup errors propagate and no Elasticsearch query is sent. Missing principals are rejected; absent/malformed scopes are rejected; an explicit empty scope produces `match_none`.

Global search, autocomplete and all entity-specific routes use a mandatory `project_id` terms filter against that server-resolved scope. Request `projectId` further narrows results and cannot expand scope. Records with absent/null project IDs are hidden from non-admin users, including internal client/user/vendor/lead records. There is no public/unscoped-record exception. A separate explicit resource permission policy is needed before exposing those records to non-admins. This is a deliberate conservative behavior change.

Scope is applied inside Elasticsearch's query, so totals and facets are scoped as well as hits. Search entity types are allowlisted; arbitrary indices, wildcards and hidden indices are rejected. Deleted global-search records remain hidden unless an administrator explicitly requests them. Suggestions exclude deleted records. Entity routes preserve their array response shape through global search, and no longer invoke unrestricted entity query methods; text matching uses global search's fields/boosts.

## Index content inspection

Local source inspection of `search/services/*-search.service.ts` and the mappings found:

- Projects and project-linked BOQ, brief, quotation, recce, task, calendar, document, drawing, work-order, challan and estimate records carry project IDs.
- Several builders allow null project IDs. Legacy or incomplete rows must remain invisible to non-admin searches.
- User/client/vendor/lead indexes contain contact information; BOQs and projects contain financial values; documents contain remarks and filenames. These are sensitive business records even though they are searchable metadata.
- Current user builders select searchable fields explicitly rather than indexing user passwords/session hashes. Historical live mappings and documents still need inspection; source inspection does not prove old index contents are safe.

No live staging index was inspected during this local implementation: an identified staging API/Elasticsearch connection and test-user credentials were not supplied. Local `.env` was inspected for configuration variable names only and was not assumed to be staging.

## Staging procedure

Run `node backend/scripts/validate-search-staging.mjs` against the deployed change. Configure credentials in environment variables without committing them:

| Variable | Meaning |
| --- | --- |
| `SEARCH_STAGING_API_URL` | Staging API base including `/api/v1` |
| `SEARCH_STAGING_ES_URL` | Staging Elasticsearch URL |
| `SEARCH_STAGING_ES_API_KEY` | Read-only Elasticsearch API key |
| `SEARCH_STAGING_USER_A_TOKEN`, `SEARCH_STAGING_USER_B_TOKEN` | Existing non-admin session JWTs |
| `SEARCH_STAGING_PROJECT_A`, `SEARCH_STAGING_PROJECT_B` | Distinct projects visible only to their respective users |
| `SEARCH_STAGING_BOQ_A`, `SEARCH_STAGING_BOQ_B` | Existing BOQ fixture IDs in the respective projects |
| `SEARCH_STAGING_FIXTURE_QUERY` | Shared unique fixture marker in both BOQ titles, at least two characters |

Use existing staging fixtures with the unique marker so each BOQ appears within the first page and suggestion limit. The script does not create fixtures or start an authorized reindex. It verifies anonymous search/reindex denial, non-admin reindex denial, each user's visible fixture, cross-project empty results/counts/facets, entity search and suggestions. It inspects allowlisted index mappings and counts missing project IDs, reports field names and visibility distribution, and rejects credential-field names. Output contains schema/counts only, with no tokens or personal records.

The schema audit is not a complete scan for secrets embedded in arbitrary text. Review any unexpected fields or visibility distributions and any missing project IDs with a staging administrator; audit counts are findings rather than proof of clean historical contents. Record the staging execution date and result here once run. Staging validation currently remains pending.

## Local verification

From `backend`, run `npx jest --runInBand --moduleNameMapper='{"^@/(.*)$":"<rootDir>/$1"}' search-security.spec.ts`. The HTTP and service tests cover every search route's authentication, full/entity reindex permissions, principal/scope failures, cross-project results/counts/facets/suggestions, entity searches, arbitrary-index rejection and administrator access. Elasticsearch is simulated for these tests; they do not replace the staging procedure.
