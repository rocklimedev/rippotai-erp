HTTP security
=============

Review owner: ERP backend maintainers (HTTP security)
Last reviewed: 2026-10-10

Helmet runs before application middleware and controllers, including local CDN files. Its cross-origin resource policy permits the separately hosted frontend to embed uploaded images. Existing CORS origins and credentials remain configured in main.ts.

HttpSecurityModule registers SecurityThrottlerGuard, JwtAuthGuard, PortalAccessGuard and PermissionsGuard globally, in that order. Every controller route is authenticated by default, and staff routes require an active staff role and the exact declared permission. Missing permission metadata fails closed. The reviewed public and scoped account exceptions, module catalogue and every route mapping are documented in [staff-api-permissions.md](staff-api-permissions.md). CDN and signature routes require staff permissions and a session JWT in addition to their existing CDN secret checks.

The explicit JWT exceptions are login, signup, forgot-password, reset-password, OAuth callbacks (which validate signed OAuth state), token-based public client routes (which validate their client link), and health/live and health/ready probes. Other health/system information and token administration endpoints require JWTs. Public routes remain rate limited. Only use @Public() for a deliberate unauthenticated or independently authenticated endpoint.

Public client access is allow-listed per handler, rather than on the entire controller, so a future handler requires authentication unless explicitly annotated. The approved `/api/v1` exceptions are:

| Method | Path |
| --- | --- |
| POST | `auth/login`, `auth/signup`, `auth/forgot-password`, `auth/reset-password` |
| GET | `auth/google/callback`, `auth/microsoft/callback`, `auth/zoho/callback` |
| GET | `health/live`, `health/ready` |
| GET | `public/client/:token`, `public/client/:token/boq/:boqId` |
| POST | `public/client/:token/boq/:boqId/approve` |
| GET | `public/client/:token/quotations/compare/:cid` |
| POST | `public/client/:token/quotations/select` |
| GET | `public/client/:token/handover` |
| POST | `public/client/:token/handover/accept`, `public/client/:token/handover/snag` |

The guard only bypasses session authentication when the metadata is exactly `true`. `Public` does not bypass client-link or OAuth state validation in the endpoint service. Staff client-link management, signed-in client home, handover preparation/delivery and other administrative routes remain authenticated. Invalid client links return 404, expired/revoked links return 410, and incorrect BOQ target/purpose returns 403. These token-only flows work without a session JWT.

The default rate limit is 120 requests per client IP per controller handler per 60 seconds. Login, signup, forgot-password and reset-password use `AuthThrottle`: 10 requests per IP plus normalized account/reset-token tracker per handler per 60 seconds. Session administration uses 120 per IP plus session tracker per handler. These defaults retain the previous numeric limits, but separate callers behind a shared IP. A second auth IP budget caps each auth handler at 120 requests per IP per 60 seconds, even when an attacker rotates accounts or reset tokens. Tracker keys are keyed hashes; no raw credentials are stored as rate keys.

Exceeding either budget returns HTTP 429 with standard Retry-After, including named budgets. Rejected authentication attempts and successful requests both count. Login and reset limits are transient source/identity budgets, not persistent account lockouts; another account on the same IP can continue below the overall IP ceiling, and requests are allowed again when the block expires. Public client-link flows use the ordinary default limit.

Configuration:

- RATE_LIMIT_MAX: positive integer; defaults to 120.
- RATE_LIMIT_TTL_MS: positive integer in milliseconds; defaults to 60000.
- AUTH_RATE_LIMIT_MAX: positive integer; defaults to 10 per entry-point tracker.
- TOKEN_RATE_LIMIT_MAX: positive integer; defaults to 120 per session tracker.
- AUTH_IP_RATE_LIMIT_MAX: positive integer; defaults to 120 per IP per auth handler.
- AUTH_RATE_LIMIT_TTL_MS: positive integer in milliseconds; defaults to 60000 for both auth budgets.
- SECURITY_METRICS_WINDOW_MS: traffic summary/alert window; defaults to 60000.
- SECURITY_ALERT_FAILURES: security failures per handler/window before a burst alert; defaults to 10.
- SECURITY_ALERT_COOLDOWN_MS: minimum interval between alerts for a handler; defaults to 300000.
- SECURITY_ALERT_WEBHOOK_URL: optional HTTP(S) operational alert receiver; no embedded username/password. Unset means structured error-level log alerts only.
- TRUST_PROXY: optional Express trusted proxy hop count or comma-separated trusted networks. Unset means forwarded client IP headers are ignored. Configure this to match the deployment's actual proxy topology; boolean values are rejected.

The default NestJS throttler storage is in memory per API process and resets on restart. Deployments with multiple API instances need shared throttler storage or an upstream aggregate limiter for a shared quota. Limits apply to controller requests; static CDN files, CORS preflight, and Socket.IO connections do not consume controller quotas. The notification gateway already authenticates its Socket.IO connections separately.

Failure telemetry runs after Helmet and observes completed responses, including guard rejection. It emits one `security.request_denied` warning per handler/window, `security.failure_burst` error alerts at the configured threshold, and `security.traffic_window` summaries with totals, success/failure/throttle counts, peak per-IP and per-tracker requests, observation timestamps and maximum duration. Logs and alerts use route templates; bodies, query strings, client-link/reset/session tokens, emails and raw IPs are omitted. In-memory metric maps are bounded. Optional webhook delivery is asynchronous, times out after two seconds, refuses redirects and cannot block login; failures emit a generic `security.alert_delivery_failed` event. Point the receiver at an existing operational alert pipeline before expecting remote notifications.

No observed usage dataset was supplied for this change, so the defaults above are provisional rather than measured thresholds. Collect at least seven representative days of `security.traffic_window` JSON records, covering business peaks and all API replicas. Run `node scripts/recommend-auth-limits.mjs traffic.jsonl` from `backend` to calculate reviewable recommendations: p99 healthy-window peaks with 2x headroom, retaining current defaults as floors. At least 30 healthy active windows are required per category. Throttled/high-failure/partial/cardinality-truncated windows are excluded because they are censored or may represent abuse; review them separately before changing limits. The tool does not modify environment configuration. Verify shared NAT traffic and trusted proxy setup, then apply reviewed values in staging and monitor 429s before rollout. Deployment threshold tuning and remote alert delivery remain pending usage data and an alert receiver.

Verification: `npm run test:e2e -- --runInBand http-security.e2e-spec.ts client-portal-auth.e2e-spec.ts` exercises global JWT protection, explicit public routes, Helmet headers, rate limiting, rejected authentication attempts, CORS preflight, real client-link validation and public BOQ approval with database operations stubbed. `npm test -- --runInBand public-routes.spec.ts` audits production controller annotations against the approved route list and rejects controller-wide public annotations. Neither suite connects to the application database.

Also run `npm run test:e2e -- --runInBand auth-throttling.e2e-spec.ts` for real auth-controller throttling, normal-user/shared-IP access, token limits, Retry-After and expiry recovery. `npm test -- --runInBand http-security-telemetry.spec.ts` verifies sanitized summaries, failure alerts, cooldown, webhook failure handling and threshold validation. Tests use short synthetic budgets and mocked auth/database/alert dependencies, not production credentials or traffic.
