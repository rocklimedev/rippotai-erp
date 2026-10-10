# Command Center and portfolio read models

Review owner: ERP backend maintainers (Projects module)
Last reviewed: 2026-10-10

## Decision and implementation

Use Redis projections built on demand rather than introducing a durable SQL projection table and a background worker now. Command Center already has a versioned cache with write invalidation; reusing it reduces repeated work without a new deployment component or schema migration. This is a precomputed response read model after the first request, not an eagerly populated materialized database view. No load-test latency or capacity improvement is claimed.

`CommandCenterService.getPortfolioReadModel()` builds `portfolio-read-model:v1` from one project query and one site QC query, alongside the existing per-project phase rollups. Its plain payload contains portfolio rows, project approved values, total value and site QC failures. Portfolio filtering occurs after reading the shared projection. KPI and commercial builders reuse its values rather than querying all projects again. Task QC reuses its site QC failures. Commercial value lookup uses a map keyed by project ID.

The existing cache also stores Command Center KPI, actions, document control, task QC, team workload, commercial, project phase and phase detail responses. `ProjectDashboardService` now caches summary, progress trend (with months in the key), and phase mix aggregates. Full project listings, progress listings, variance listings, upcoming milestones and recent activity remain live. Other module dashboards are outside this change.

## Freshness and invalidation

`CommandCenterCacheService` scopes keys by database and hashes each projection name. Values are fresh for 15 seconds; older values are returned while one refresh per key per process runs. Entries have a 120-second Redis TTL and an explicit age check. Date fields survive serialization. Redis operations have a 150 ms timeout; unavailable Redis falls back to live builders with concurrent request coalescing in the process.

Registered Sequelize hooks invalidate the shared version on saves, destroys and bulk writes to projects, phase/gate definitions and records, document records and requirements, task records, activity logs, site QC records, teams, team members, planner items, and native evidence source tables. Transaction writes invalidate after commit. Builders check local epoch and Redis version before publishing, so a build racing a write does not repopulate the invalidated generation. In-flight callers can still receive the data their build read.

`POST /api/v1/command-center/refresh` invalidates projections; it does not eagerly rebuild them. Raw SQL, external writers and unregistered source tables bypass ORM hooks. Time-based and otherwise unobserved changes are picked up through refresh on access and TTL expiry. There is no cross-process build lock, no guaranteed transactionally consistent portfolio snapshot, and no persistent projection during Redis failure. Different derived keys can have different build times. Read models must not be used to authorize mutations; existing workflow services remain authoritative.

## Evaluation and next step

The current approach removes duplicate full-project and site QC reads across the shared projection consumers and avoids repeating covered aggregate queries on cache hits. Cold builds still perform per-project phase/evidence work; invalidation is broad, and multiple API processes may rebuild simultaneously. Under heavy write load these costs may dominate.

Before adding durable projections, measure database query count and duration, cache hit ratio, refresh failures, cold-build duration, concurrent builders, and endpoint p95/p99 with realistic project counts and read/write traffic. If cold builds or broad invalidation remain the bottleneck, introduce a transactional outbox, per-project durable projections, idempotent workers, explicit projection versions and lag monitoring, then derive portfolio totals from those projections. That architecture is evaluated here but is not implemented.

## Verification

From `backend`, run `npx jest --config test/command-center-jest.json --runInBand`. Tests cover reuse, concurrent build coalescing, Date revival, freshness refresh, invalidation races, Redis fallback, after-commit hooks, shared portfolio/KPI/commercial reads and parameterized dashboard keys. No production database migration is required.
