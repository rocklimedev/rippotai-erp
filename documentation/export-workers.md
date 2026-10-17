# Asynchronous document and export workers

## Request and worker behavior

Heavy server generation now runs through the `document-exports` BullMQ queue. API requests run their existing JWT, portal, permission and DTO checks, enqueue a small serialized request, and return **202 Accepted**. Generation and its database reads run in a separate child process, supervised by a dedicated worker coordinator. The API never launches Chromium or builds a workbook for these requests.

Covered paths:

| Feature | Queued operations |
| --- | --- |
| BOQs | Excel, legacy server PDF, legacy thumbnail |
| Quotations | Excel |
| Vendor/material shortlists | Single and combined Excel |
| Project planners | Workbook |
| Crucial work | PDF and DOCX generation |
| Admin DPR | Export and saved document creation |
| Snag lists | Create/update, including Excel generation and revision archive |
| Handover | Package preparation and compression |

Existing downloads of already-saved DPRs/snag workbooks and the static crucial-work template only read stored bytes. `PdfGeneratorService.renderSectionsPdf` currently has no callers or HTTP entry point. Browser print-kit PDFs remain browser work.

`@AsyncExport` preserves the original route, guards, metadata and DTO pipes. Its method body is the worker implementation and is not executed by the HTTP route. The allow-list in `export.registry.ts` maps job types to those original handlers. Request/response/user arguments are replaced by explicit markers: no JWTs, cookies, CDN secret headers or Express objects are stored in the queue. The child resolves application providers without `app.init()` or `listen()`, so it does not start an HTTP server, seeders, cron jobs or application lifecycle hooks. Each child has its own database pool capped at one connection.

The coordinator renews BullMQ locks while CPU work runs in children. Per-worker and shared queue concurrency limits bound simultaneous jobs across replicas. The parent enforces a wall-clock timeout, kills timed-out process trees (including Chromium), and waits for the child to exit before releasing its concurrency slot. Redis jobs survive API/worker restarts; stalled leases are recovered with bounded attempts. Processing is at least once: saved DPRs, snag creates/revisions and handover records use a stable operation ID to recover committed work on retry without duplicating records. Retries before a commit may regenerate from then-current data.

## HTTP protocol

All paths below are relative to `/api/v1`. An existing generation route returns:

```json
{
  "jobId": "cfaed496-4022-449f-b88c-f72d0d9d9d28",
  "state": "queued",
  "statusUrl": "/export-jobs/cfaed496-4022-449f-b88c-f72d0d9d9d28",
  "resultUrl": "/export-jobs/cfaed496-4022-449f-b88c-f72d0d9d9d28/result"
}
```

- `GET /export-jobs/:id`: state (`waiting`, `active`, `delayed`, `completed`, `failed`), progress, attempt counts, timestamps, failure reason, bounded attempt history, retry ancestry and result URL.
- `GET /export-jobs/:id/result`: authenticated file download, or the original saved-resource JSON. Incomplete jobs return 409. Completed JSON still passes through the global secret stripping and private-link interceptors.
- `POST /export-jobs/:id/retry`: retryable failed jobs only; returns a new 202 descriptor with the same operation ID and `retryOf` ancestry. Explicit retry chains are limited to three generations; each job also has bounded automatic attempts. Validation, missing-resource and revision-conflict failures are marked unrecoverable and skip automatic retries.

These are scoped account routes rather than newly assigned staff grants. Each access still checks the authenticated owner, current portal role and the **original route permission**. Other owners see 404, lost permission/portal access sees 403, and expired results see 404. Result bytes are kept in private storage and sent with `Cache-Control: private, no-store`; they never receive permanent public CDN URLs. Terminal jobs and their generated private result files are cleaned up after retention (swept every minute, up to 200 terminal records per sweep). Original saved business documents/packages retain their normal lifecycle.

Queue admission is serialized across API replicas and counts waiting, paused, active and delayed jobs. A full or unavailable queue returns 503; there is no in-process generation fallback. The API remains available for ordinary traffic if workers are stopped. Export jobs remain visibly queued until workers resume.

The shared RTK Query fetch and Axios clients understand 202 automatically: they poll status, show queued/running/retry progress, retrieve the original file/JSON response, and preserve existing screen download/save behavior. Failed jobs show the failure and a Retry action. Waiting is cancellable without cancelling the durable job. Browser polling stops after 15 minutes; the error includes the job ID for subsequent status/result retrieval. External API clients must adopt this 202 protocol; do not deploy only one side of the API/frontend change.

## Running and deployment

Use the same built backend release, database configuration and private file storage as the API:

```powershell
npm ci
npm run build
npm run start:export-worker
```

The worker has its own process and command and must be supervised/restarted separately from the API. `scripts/start-export-worker.cjs` and `scripts/export-child.cjs` register compiled TypeScript aliases; the resolver is a production dependency. Node 22.12+ is required by the installed Puppeteer version; the backend container now uses Node 22. Chromium, templates and fonts are included through the existing backend image/build assets.

Redis 7 was used for integration testing. Use a private authenticated Redis endpoint with persistence enabled (for example AOF), `maxmemory-policy noeviction`, appropriate backups and TLS where the network requires it. All API/worker replicas must use the same queue prefix, Redis database, capacity, retry and retention settings; set global concurrency consistently on worker replicas. Do not point test queues at production. Database schema changes are not required for the queue.

For production resource isolation, run the worker on a dedicated host or container with CPU and total-memory limits that reserve resources for the API. For example, run the existing backend image with command `npm run start:export-worker`, a one-CPU allocation and a 2 GiB memory budget, then tune concurrency from measurements. The Node heap limit does not cap Chromium or native Buffer memory; use OS/container limits as well. Use a process-group/cgroup supervisor so an abrupt coordinator failure also stops its child processes. Allow a shutdown grace period at least as long as the job timeout plus a short Redis commit margin; SIGTERM stops new work and drains the current attempts.

When storage is local, API and worker hosts must mount the same private directory at `PRIVATE_FILE_PATH`. With SFTP they share the original `CDN_UPLOAD_PATH` on the CDN server. All stored file URLs use `CDN_BASE_URL`; the CDN must protect `private-*` names with the signed-file proxy before `CDN_PRIVATE_PROXY_ENABLED=true` enables uploads. The [confidential file configuration](confidential-files.md#runtime-configuration) remains required.

| Setting | Default | Purpose |
| --- | --- | --- |
| `EXPORT_WORKER_CONCURRENCY` | 1 | Child processes per worker (maximum 16) |
| `EXPORT_GLOBAL_CONCURRENCY` | 2 | Shared active-job limit across workers (maximum 32) |
| `EXPORT_QUEUE_CAPACITY` | 100 | Nonterminal jobs admitted across API replicas |
| `EXPORT_MAX_ATTEMPTS` | 3 | Automatic attempts per job, exponential backoff starting at 2 seconds |
| `EXPORT_JOB_TIMEOUT_MS` | 180000 | Wall-clock budget per attempt, including process startup |
| `EXPORT_CHILD_MEMORY_MB` | 512 | V8 heap budget per child |
| `EXPORT_MAX_RESULT_BYTES` | 67108864 | Maximum generated result size (64 MiB) |
| `EXPORT_MAX_PAYLOAD_BYTES` | 1048576 | Maximum serialized request size (1 MiB) |
| `EXPORT_RETENTION_SECONDS` | 86400 | Job/result access lifetime after completion/final failure |
| `EXPORT_QUEUE_PREFIX` | `erp` | Redis key namespace |
| `EXPORT_REDIS_HOST` / `PORT` | `REDIS_HOST` / `REDIS_PORT`, then localhost / 6379 | Queue connection |
| `EXPORT_REDIS_PASSWORD` | `REDIS_PASSWORD` | Queue credential |
| `EXPORT_REDIS_DB` | 0 | Redis database |
| `EXPORT_REDIS_TLS` | false | Set `true` to enable TLS |

Positive limits are validated at startup. An oversized output can still consume memory before its final size check, so size limits supplement rather than replace the child heap, timeout and OS limits. Monitor Redis memory, queue age, failed/stalled jobs, worker restarts, storage capacity and cleanup failures. Abrupt crashes between private-file upload and recording its result can leave private orphan files; reconcile those against job/business references during storage maintenance. They remain behind the CDN private-* signature rule and cannot be fetched as public assets.

## Verification

Start a disposable local Redis (no application database is used by these tests):

```powershell
docker run --detach --rm --name rippotai-export-tests-redis --publish 127.0.0.1:16379:6379 redis:7-alpine
npm run test:e2e -- --runInBand export-jobs.e2e-spec.ts
docker stop rippotai-export-tests-redis
```

The test uses a unique Redis prefix, real child processes, real 5,000-row Excel workbooks and deliberate CPU load. It checks shared concurrency across two workers, queue overflow, normal API responsiveness during generation, automatic and explicit retries, timeout termination, current permission/ownership, secret stripping, result expiry and private-file cleanup. It removes its own queue keys and temporary storage. `EXPORT_TEST_REDIS_PORT` can select a different disposable Redis port. Additional unit tests cover committed-save/revision recovery; frontend `node --test src/lib/export-jobs.test.js` checks polling, failed attempts, cancellation and safe result URLs.
