# Common (Cross-Cutting Concerns)

Shared infrastructure under `backend/src/common/`, used across modules.

| File | Purpose |
|---|---|
| `guards/jwt-auth-guard.ts` | `JwtAuthGuard` — validates JWT + DB-side revocation check (see `auth.md`) |
| `guards/cdn.guard.ts` | `CdnGuard` — guards CDN-backed operations (e.g. deleting a user signature file) by checking a shared secret header, `X-CDN-Secret` |
| `strategies/jwt.strategy.ts` | Passport JWT strategy wired to `JwtAuthGuard` |
| `decorator/current-user.decorator.ts` | `@CurrentUser()` param decorator to pull the authenticated user off the request |
| `interfaces/request-with-user-interfaces.ts` | `RequestWithUser` type used in controllers that read `req.user` |
| `interfaces/notification-payload.interfaces.ts` | Shape of the payload pushed over the notifications WebSocket |
| `gateway/notification.gateway.ts` | Socket.IO gateway, namespace `/notifications`, authenticates by `userId` on connection |
| `enums/index.ts` | Single source of truth for all status/type enums used across modules (`AuthTokenType`, `VerificationTokenType`, `ProjectStatus`, `VendorCategory`, `VendorBusinessType`, `VendorStatus`, `QuotationStatus`, `NotificationType`, `ActivityAction`) |

## CDN integration

`modules/cdn/cdn.service.ts` supports SFTP storage and a local disk fallback. Uploads are private by default; only explicit public profile images go into the public CDN directory. Signatures use this shared service. Authorized responses issue file-specific signed links valid for up to five minutes, and the private download endpoint checks their HMAC and expiry. `X-CDN-Secret` protects selected upload operations; it does not authorize confidential downloads. See [Confidential file access and migration](confidential-files.md) for configuration, the existing-link inventory, and removal of legacy public copies and CDN caches.
