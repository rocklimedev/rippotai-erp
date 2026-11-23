# Command Center caching

Command Center uses the existing `REDIS_CLIENT` and Redis deployment (`REDIS_HOST` and `REDIS_PORT`). No database migration or new dependency is required. Keys are namespaced by database and cache schema version.

Portfolio rollups are built once and reused by KPIs, filtered portfolios, actions, documents, tasks/QC, team workload and commercial calculations. Phase details and these accumulated panels are also cached. Search and health filters apply to the shared portfolio in memory, rather than rebuilding every project. Simultaneous requests for the same result share one build within each backend process.

Results remain fresh for 15 seconds. Older snapshots return immediately and trigger one background rebuild. Redis entries expire after 120 seconds; expired snapshots are never returned. Model writes to projects, documents/drawings, native evidence sources, gates, task executions, activity and site QC rotate the namespace version. Transactions invalidate only after commit. Raw SQL or external writers bypass model hooks, so expiry and background refresh remain the safety net. Existing gate/evidence validation runs unchanged, and mutations never trust a cached dashboard for authorization or gate approval.

The Command Center refresh button calls `POST /api/v1/command-center/refresh` before refetching its queries, forcing a new aggregate generation. Unrelated dashboard endpoints are not cached by this change. Activity feed requests remain live.

Cache operations skip disconnected Redis clients and wait at most 150 ms per Redis operation. A cache failure falls back to the existing database computation; it does not make a failed query succeed. The pre-existing Redis behavior inside other services, including GateEngine, is unchanged. Failed builds are not cached. An aggregate invalidated during its build cannot populate the current generation.

The first cold request and the first request after invalidation still pay database computation cost. Redis caching improves subsequent navigation/polling and eliminates repeated concurrent aggregation; this is not a claim that underlying database queries have been fully optimized. Run `npx jest --config test/command-center-jest.json --runInBand` to verify cache reuse, concurrent builds, background refresh, invalidation and Redis failure behavior. Actual production latency requires measurement against the deployed database and Redis.
