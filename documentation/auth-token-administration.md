# Auth token administration

Review owner: ERP backend maintainers (Auth module)
Last reviewed: 2026-10-10

`AuthTokensController` explicitly uses `JwtAuthGuard`, in addition to global authentication. Under `/api/v1/auth/tokens`, the session service requires a nonempty authenticated actor ID and uses `roleName` from the database-backed JWT user payload. Only `ADMIN` and `SUPERADMIN` have administrator access; request bodies, query parameters and an `isAdmin` flag do not grant that access.

| Route | Access |
| --- | --- |
| `GET user/:userId` | Own sessions; cross-user access requires administrator plus `sessions:read-any` |
| `PATCH :id/revoke` | Own session; cross-user access requires administrator plus `sessions:revoke-any` |
| `PATCH user/:userId/revoke-all` | Own sessions; cross-user access requires administrator plus `sessions:revoke-any` |
| `DELETE :id` | Active staff administrator plus `auth-tokens:delete` |
| `POST /auth/tokens` | Removed; session creation is internal to login/signup |

Cross-user lookup and bulk revocation return 403 before querying/mutating sessions. Individual revocation resolves ownership then rejects unauthorized callers before updating. Missing session IDs return 404. Anonymous calls to retained endpoints return 401. List and revoke responses expose only session metadata (ID, user ID, type, device/IP, expiry, revocation, last use and creation time), excluding token hashes and nested user records. Internal authentication lookup still loads the user and role; logout and password changes retain their internal revocation paths.

## Verification-token review

Repository usage search found the generic `VerificationTokensController` was only referenced by its module registration and unused frontend API definitions. No signup, login, email-verification or password-reset flow invokes `VerificationTokensService`. Password reset uses `ForgotPasswordService` and `PasswordResetToken` with its own dedicated endpoints.

The generic verification-token create, validate, consume and delete HTTP endpoints are removed (404), along with their unused API definitions in both frontends. The service/model and existing database records remain available internally; no schema or data deletion is required. Any external integration outside this repository that used these endpoints must migrate to a purpose-specific workflow. If email verification is introduced, it should generate and consume tokens within that workflow rather than expose generic token CRUD.

## Validation

Run from `backend`: `npx jest --runInBand --moduleNameMapper='{"^@/(.*)$":"<rootDir>/$1"}' auth-tokens-security.spec.ts`. HTTP tests exercise anonymous rejection, ownership, bulk revocation, administrator access, null actors, metadata filtering, admin-only deletion and removal of direct token creation. Existing login/logout/password-change service calls remain unchanged.
