# Auth module

Review owner: ERP backend maintainers (Auth module)
Last reviewed: 2026-10-10

The NestJS Auth module manages login/signup, JWT-backed sessions, logout, password changes and password reset. Base path: `/api/v1/auth`.

| Method | Route | Access |
| --- | --- | --- |
| POST | `/login` | Public, throttled |
| POST | `/signup` | Public, throttled |
| GET | `/me` | JWT |
| POST | `/logout` | JWT |
| POST | `/forgot-password` | Public, throttled |
| POST | `/reset-password` | Public, throttled; reset token required |
| PATCH | `/change-password` | JWT; current password required |
| GET | `/tokens/user/:userId` | JWT; own sessions or administrator |
| PATCH | `/tokens/:id/revoke` | JWT; own session or administrator |
| PATCH | `/tokens/user/:userId/revoke-all` | JWT; own sessions or administrator |
| DELETE | `/tokens/:id` | JWT; administrator only |

Session creation is internal to login/signup; `POST /tokens` has been removed. The generic `/verification-tokens` create/validate/consume/delete endpoints are removed. See [auth token administration](./auth-token-administration.md) for ownership rules, safe response fields and the verification-token review.

JWT validation checks its `jti` against a SHA-256 hash stored in `auth_tokens`, rejects revoked/expired sessions and resolves the user's current role and permissions from the database. Logout revokes the presented session. Password changes/reset revoke the user's sessions through internal service calls. These internal authentication paths do not expose generic token creation over HTTP.

Password reset uses `ForgotPasswordService` and the `password_reset_tokens` model. It generates a random token, persists its hash and sends a link; the forgot-password response does not disclose whether an account exists. Generic `VerificationToken` records and service remain internal and are not used by the current password-reset flow.

See [HTTP security](./http-security.md) for global authentication and throttling configuration. OAuth connectors are separate controllers under the Auth module.
