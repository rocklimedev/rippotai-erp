HTTP security
=============

Helmet runs before application middleware and controllers, including local CDN files. Its cross-origin resource policy permits the separately hosted frontend to embed uploaded images. Existing CORS origins and credentials remain configured in main.ts.

HttpSecurityModule registers ThrottlerGuard and JwtAuthGuard globally, in that order. Every controller route, including future routes, is authenticated by default. Existing JWT and permission guards remain in place. CDN and signature routes require a session JWT in addition to their existing CDN secret checks.

The explicit JWT exceptions are login, signup, forgot-password, reset-password, OAuth callbacks (which validate signed OAuth state), token-based public client routes (which validate their client link), and health/live and health/ready probes. Other health/system information and token administration endpoints require JWTs. Public routes remain rate limited. Only use @Public() for a deliberate unauthenticated or independently authenticated endpoint.

The default rate limit is 120 requests per client IP per controller handler per 60 seconds. Authentication entry points have a tighter limit of 10 per IP per handler per 60 seconds. Exceeding the limit returns HTTP 429 with Retry-After. Rejected authentication attempts count toward the limit.

Configuration:

- RATE_LIMIT_MAX: positive integer; defaults to 120.
- RATE_LIMIT_TTL_MS: positive integer in milliseconds; defaults to 60000.
- TRUST_PROXY: optional Express trusted proxy hop count or comma-separated trusted networks. Unset means forwarded client IP headers are ignored. Configure this to match the deployment's actual proxy topology; boolean values are rejected.

The default NestJS throttler storage is in memory per API process and resets on restart. Deployments with multiple API instances need shared throttler storage or an upstream aggregate limiter for a shared quota. Limits apply to controller requests; static CDN files, CORS preflight, and Socket.IO connections do not consume controller quotas. The notification gateway already authenticates its Socket.IO connections separately.

Verification: npm run test:e2e -- --runInBand http-security.e2e-spec.ts exercises global JWT protection, explicit public routes, Helmet headers, rate limiting, rejected authentication attempts, and CORS preflight without connecting to the application database.
