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
| GET | `/tokens/user/:userId` | JWT; own sessions, or administrator with `sessions:read-any` |
| PATCH | `/tokens/:id/revoke` | JWT; own session, or administrator with `sessions:revoke-any` |
| PATCH | `/tokens/user/:userId/revoke-all` | JWT; own sessions, or administrator with `sessions:revoke-any` |
| DELETE | `/tokens/:id` | JWT; active staff administrator with `auth-tokens:delete` |

Session creation is internal to login/signup; `POST /tokens` has been removed. The generic `/verification-tokens` create/validate/consume/delete endpoints are removed. See [auth token administration](./auth-token-administration.md) for ownership rules, safe response fields and the verification-token review.

JWT validation checks its `jti` against a SHA-256 hash stored in `auth_tokens`, rejects revoked/expired sessions and resolves the user's current role and permissions from the database. Logout revokes the presented session. Password changes/reset revoke the user's sessions through internal service calls. These internal authentication paths do not expose generic token creation over HTTP.

Password reset uses `ForgotPasswordService` and the `password_reset_tokens` model. It generates a random token, persists its hash and sends a link; the forgot-password response does not disclose whether an account exists. Generic `VerificationToken` records and service remain internal and are not used by the current password-reset flow.

See [HTTP security](./http-security.md) for global authentication and throttling configuration. OAuth connectors are separate controllers under the Auth module.
# Zoho email verification

On the ERP **Verify your email** page, staff can select **Verify with Zoho**.
The backend uses Zoho Accounts' authorization code flow with PKCE and checks
the signed ID token. The Zoho primary email must be verified and match the
current email of an active ERP staff account. After verification, staff sign
in with their ERP password. Email change requests still use the emailed link.

In the Zoho API Console, add the exact public API callback URL to a Server-based
Application, for example `https://erp-api.example.com/api/v1/auth/zoho-email/callback`.
The start and callback URLs must use the same API host so the browser can return
the verification cookie. Set `ZOHO_EMAIL_CLIENT_ID`, `ZOHO_EMAIL_CLIENT_SECRET`,
`ZOHO_EMAIL_REDIRECT_URI`, and the existing `FRONTEND_URL` on the backend. Use
`ZOHO_EMAIL_ACCOUNTS_URL` for the client's Zoho data center, for example
`https://accounts.zoho.in` for India. This flow supports one data center per
deployment and uses its own settings independently of Cliq. A compatible
server-based Cliq client can be used by registering the additional callback
and supplying its credentials in these settings.
