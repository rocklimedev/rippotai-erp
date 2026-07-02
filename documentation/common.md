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

The backend depends on `ssh2-sftp-client`, and requests carry an `x-cdn-secret` header (set from `VITE_CDN_TOKEN` on the frontend) — file uploads (e.g. user signatures) appear to be pushed to a remote server over SFTP behind a CDN, rather than stored locally or in S3-style object storage. Worth confirming the exact upload flow with whoever owns that integration before documenting it further, as no controller/service file for a generic "files" or "cdn" module was found — it may live inside `users/user-signature.service.ts` or an SFTP helper not yet inspected.
