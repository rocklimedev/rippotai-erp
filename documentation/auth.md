# Auth Module

Handles login/logout, JWT issuance, refresh-token bookkeeping, and email/password-reset verification tokens.

Base path: `/api/v1/auth`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| POST | `/api/v1/auth/login` | `login` | — |
| POST | `/api/v1/auth/logout` | `logout` | JwtAuthGuard |
| GET | `/api/v1/auth/me` | `me` | — |
| POST | `/api/v1/auth/tokens` | `create` | — |
| DELETE | `/api/v1/auth/tokens/:id` | `remove` | — |
| PATCH | `/api/v1/auth/tokens/:id/revoke` | `revoke` | — |
| GET | `/api/v1/auth/tokens/user/:userId` | `findAllForUser` | — |
| PATCH | `/api/v1/auth/tokens/user/:userId/revoke-all` | `revokeAllForUser` | — |
| POST | `/api/v1/auth/verification-tokens` | `create` | — |
| DELETE | `/api/v1/auth/verification-tokens/:id` | `remove` | — |
| PATCH | `/api/v1/auth/verification-tokens/:id/consume` | `consume` | — |
| GET | `/api/v1/auth/verification-tokens/validate` | `findValidByToken` | — |

## How login works (`AuthService.login`)

1. Look up the `User` by email, including their `Role`.
2. Compare the submitted password against `password_hash` with **bcrypt**.
3. On success, generate a random UUID (`rawToken`), SHA-256 hash it, and store the hash as an `AuthToken` row (type `refresh`, 7‑day expiry). The raw UUID is embedded as the JWT's `jti` claim — the raw value is never persisted, only its hash.
4. Sign a JWT (`jsonwebtoken`, `process.env.JWT_SECRET`, 7‑day expiry) containing `sub` (user id), `email`, `role`, `role_id`, `type: 'access'`.
5. Update `user.last_login_at`.
6. Return `{ token, user }` to the client.

The frontend stores this JWT in `localStorage` under the key `token` and sends it as `Authorization: Bearer <token>` (see `frontend/api-layer.md`).

## How request auth works (`JwtStrategy` + `JwtAuthGuard`)

- `JwtAuthGuard` (in `common/guards/jwt-auth-guard.ts`) protects routes with `@UseGuards(JwtAuthGuard)`.
- On each guarded request, the strategy verifies the JWT signature/expiry, then calls `AuthService.getCurrentUserFromPayload`, which re-hashes the token's `jti` and looks up the matching `AuthToken` row to confirm it hasn't been **revoked** or **expired** in the DB — this is what makes server-side logout/revocation actually work even though JWTs are normally stateless.
- `touchLastUsed` bumps `last_used_at` on every authenticated request.

**Note:** only `GET /auth/me` and `POST /auth/logout` currently carry `@UseGuards(JwtAuthGuard)` explicitly in this controller; most other modules apply the guard per-controller (see each module's "Guards" note) — some routes (e.g. most quotation/vendor mutation sub-resources) currently have **no guard applied**, which is worth confirming with the team before writing external-facing docs.

## Auth tokens (`/auth/tokens`)

Refresh/session token bookkeeping, keyed by `user_id`. Supports revoking a single token or all tokens for a user (e.g. "log out everywhere").

## Verification tokens (`/auth/verification-tokens`)

Generic single-use token flow used for **email verification** and **password reset** (`VerificationTokenType` enum). `GET /validate?token=...` checks a token is unused and unexpired; `PATCH /:id/consume` marks it used (idempotency guarded — throws if already used or expired).

## Data models

#### `AuthToken` (table: `auth_tokens`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `user_id` | `user_id` | DataType.CHAR(36) | no | — | FK |
| `token_hash` | `token_hash` | DataType.STRING(255) | no | — | unique |
| `type` | `type` | DataType.ENUM(...Object.values(AuthTokenType) | no | AuthTokenType.REFRESH | — |
| `device_info` | `device_info` | DataType.TEXT | yes | — | — |
| `ip_address` | `ip_address` | DataType.STRING(45) | yes | — | — |
| `expires_at` | `expires_at` | DataType.DATE | no | — | — |
| `revoked_at` | `revoked_at` | DataType.DATE | yes | — | — |
| `last_used_at` | `last_used_at` | DataType.DATE | yes | — | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `user` | BelongsTo | `User` |

#### `VerificationToken` (table: `verification_tokens`)

| Column | DB field | Type | Null | Default | Notes |
|---|---|---|---|---|---|
| `id` | `id` | DataType.UUIDV4 | no | — | PK |
| `user_id` | `user_id` | DataType.CHAR(36) | no | — | FK |
| `token` | `token` | DataType.STRING(255) | no | — | unique |
| `type` | `type` | DataType.ENUM(...Object.values(VerificationTokenType) | no | — | — |
| `expires_at` | `expires_at` | DataType.DATE | no | — | — |
| `used_at` | `used_at` | DataType.DATE | yes | — | — |

**Relations**

| Relation | Type | Target |
|---|---|---|
| `user` | BelongsTo | `User` |


## Enums (from `common/enums`)

- `AuthTokenType`: `refresh`, `session`
- `VerificationTokenType`: `email_verification`, `password_reset`
